import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  STYLE_OPTIONS,
  BULLET_STYLES,
  formatText,
  formatSelectionOrAll,
  applyBulletToList,
  hookifyFirstLine,
  cleanExtraLineBreaks,
  calculatePostStats,
  type StyleKey
} from '../shared/formatter';
import {
  clearPendingText,
  loadPendingText,
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  loadSavedTheme,
  saveTheme,
  syncThemeFromCloud,
  saveDraft,
  loadDrafts,
  deleteDraft,
  loadHashtagSets,
  saveHashtagSet,
  deleteHashtagSet,
  type DraftItem,
} from '../shared/storage';
import { DEFAULT_TEMPLATES, DEFAULT_HASHTAG_SETS, TemplateItem, HashtagSet, maxTemplates } from '../shared/constants';
import { canUse, getFeature } from '../shared/pro';
import { FaLinkedin } from 'react-icons/fa6';
import {
  Sparkles,
  Copy,
  Check,
  Clock,
  Hash,
  RotateCcw,
  Sun,
  Moon,
  Trash2,
  Plus,
  Eye,
  PenLine,
  Bookmark,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  SmilePlus,
} from 'lucide-react';
import { LinkedInCardPreview } from './components/LinkedInCardPreview';

type TabType = 'compose' | 'preview' | 'templates' | 'hashtags';

// Emoji data organized by category
const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Business': ['🚀','💡','📈','💼','🎯','✅','⚡','🔥','🏆','💪','🎓','🌍','💰','🤝','📊','📣'],
  'Celebrate': ['🎉','🙌','👏','🥳','🎊','🏅','⭐','✨','🌟','🎈','💫','🎁','🥂','🎤','👑','🌈'],
  'Ideas': ['💭','🔑','📌','🧠','🔍','📝','🗺️','🌱','🦋','🔓','💬','🗣️','🎨','🧩','⚙️','🔗'],
  'Numbers': ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','➡️','◾','🔹','🔸','▶️','•'],
};

export function App() {
  const [text, setText] = useState<string>(
    '90% of LinkedIn creators miss this one fundamental rule:\n\n' +
    'Formatting matters just as much as your content.\n\n' +
    'Here is why:\n' +
    '🔹 Readers scan in F-shaped patterns\n' +
    '🔹 Bold hooks stop the endless scroll\n' +
    '🔹 Clean line breaks prevent fatigue\n\n' +
    'Start using modern Unicode styles to stand out in the feed today! 🚀'
  );
  const [activeTab, setActiveTab] = useState<TabType>('compose');
  const [activeStyle, setActiveStyle] = useState<StyleKey>('plain');
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newTemplateTitle, setNewTemplateTitle] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [insertErrorDetails, setInsertErrorDetails] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Post History
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hashtag Manager
  const [hashtagSets, setHashtagSets] = useState<HashtagSet[]>(DEFAULT_HASHTAG_SETS);
  const [showNewHashtagForm, setShowNewHashtagForm] = useState<boolean>(false);
  const [newHashtagName, setNewHashtagName] = useState<string>('');
  const [newHashtagTags, setNewHashtagTags] = useState<string>('');

  // Emoji Picker
  const [showEmojiPanel, setShowEmojiPanel] = useState<boolean>(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState<string>('Business');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const recordSelection = () => {
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
  };

  const query = new URLSearchParams(window.location.search);
  const embedded = query.get('embedded') === '1';
  const targetTabId = Number(query.get('targetTabId'));

  // Initialize theme and load data
  useEffect(() => {
    // 1. Instant synchronous read from localStorage for immediate render
    const saved = loadSavedTheme();
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);

    // 2. Async sync from chrome.storage.sync — picks up cross-device preference
    syncThemeFromCloud().then((synced) => {
      if (synced !== saved) {
        setTheme(synced);
        document.documentElement.setAttribute('data-theme', synced);
      }
    });

    void initTemplates();
    void loadComposerText();
    void initDrafts();
    void initHashtagSets();
  }, []);

  // Listen for text from LinkedIn content script iframe and insertion results
  useEffect(() => {
    const handleWindowMessage = (
      event: MessageEvent<{ type?: string; text?: string; success?: boolean; error?: string }>
    ) => {
      if (event.data?.type === 'composer-text' && typeof event.data.text === 'string' && event.data.text.trim()) {
        setText(event.data.text);
      }
      if (event.data?.type === 'insert-result') {
        if (event.data.success) {
          setInsertErrorDetails(null);
          showToast('Inserted into composer! 🚀');
        } else {
          const err = event.data.error || 'Please open LinkedIn "Create a post" first';
          setInsertErrorDetails(err);
          showToast('Autofill failed — see error details below');
        }
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  const stats = useMemo(() => calculatePostStats(text), [text]);

  // ── 2-second debounced auto-save ─────────────────────────────────────────
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      await saveDraft(text);
      setDrafts(await loadDrafts());
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [text]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    saveTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  async function loadComposerText() {
    const pendingText = await loadPendingText();
    if (pendingText) {
      setText(pendingText);
      await clearPendingText();
    }
  }

  async function initTemplates() {
    const loaded = await loadTemplates();
    setTemplates(loaded.length > 0 ? loaded : DEFAULT_TEMPLATES);
  }

  async function initDrafts() {
    const loaded = await loadDrafts();
    setDrafts(loaded);
  }

  async function initHashtagSets() {
    const loaded = await loadHashtagSets();
    setHashtagSets(loaded.length > 0 ? loaded : DEFAULT_HASHTAG_SETS);
  }

  // ── Draft / History Handlers ──────────────────────────────────────────────
  const handleLoadDraft = (draft: DraftItem) => {
    setText(draft.text);
    setShowHistory(false);
    setActiveTab('compose');
    showToast('Draft loaded! ✍️');
  };

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await deleteDraft(id);
    setDrafts(next);
    showToast('Draft removed');
  };

  const formatDraftTime = (savedAt: number): string => {
    const diff = Date.now() - savedAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ── Emoji Picker Handler ──────────────────────────────────────────────────
  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRef.current.end;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    const newPos = start + emoji.length;
    lastSelectionRef.current = { start: newPos, end: newPos };
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  // ── Hashtag Manager Handlers ──────────────────────────────────────────────
  const handleAppendHashtags = (set: HashtagSet) => {
    const tagsStr = '\n\n' + set.tags.join(' ');
    setText((prev) => prev + tagsStr);
    setActiveTab('compose');
    showToast(`Added ${set.tags.length} hashtags from "${set.name}" \uD83C\uDFF7\uFE0F`);
  };

  const handleSaveHashtagSet = async () => {
    if (!newHashtagName.trim()) { showToast('Give your set a name first'); return; }
    if (!newHashtagTags.trim()) { showToast('Enter at least one hashtag'); return; }
    const rawTags = newHashtagTags.split(/[,\s]+/).filter(Boolean);
    const normalized = rawTags.map((t) => t.startsWith('#') ? t : `#${t}`);
    const newSet: HashtagSet = {
      id: `hs-${Date.now()}`,
      name: newHashtagName.trim(),
      tags: normalized,
    };
    const next = await saveHashtagSet(newSet);
    setHashtagSets(next);
    setNewHashtagName('');
    setNewHashtagTags('');
    setShowNewHashtagForm(false);
    showToast('Hashtag set saved! 🏷️');
  };

  const handleDeleteHashtagSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await deleteHashtagSet(id);
    setHashtagSets(next);
    showToast('Hashtag set removed');
  };

  // Handle formatting application (selection-aware)
  const applyStyle = (styleKey: StyleKey) => {
    setActiveStyle(styleKey);
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRef.current.end;

    const { nextText, newStart, newEnd } = formatSelectionOrAll(text, start, end, styleKey);
    setText(nextText);
    lastSelectionRef.current = { start: newStart, end: newEnd };

    // Restore cursor selection after state update
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });

    showToast(start === end ? `Formatted all as ${styleKey}` : `Formatted selection as ${styleKey}`);
  };

  // Apply bullet points to selected lines or current line
  const handleApplyBullet = (bulletIcon: string) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRef.current.end;

    const { nextText, newStart, newEnd } = applyBulletToList(text, start, end, bulletIcon);
    setText(nextText);
    lastSelectionRef.current = { start: newStart, end: newEnd };

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });

    const isSingle = start === end;
    showToast(isSingle ? 'Updated bullet on current line 🔹' : 'Applied list bullets 🔹');
  };

  // Quick Action: Hookify first line
  const handleHookify = () => {
    const result = hookifyFirstLine(text);
    setText(result);
    showToast('Hookified first line in bold! ⚡');
  };

  // Quick Action: Clean extra whitespace
  const handleCleanSpacing = () => {
    const result = cleanExtraLineBreaks(text);
    setText(result);
    showToast('Cleaned line breaks for LinkedIn 🧹');
  };

  // Quick Action: Clear all formatting to clean plain text
  const handleClearFormatting = () => {
    applyStyle('plain');
  };

  // Robust fallback copy function for popups and iframes
  const copyToClipboard = async (textToCopy: string): Promise<boolean> => {
    // 1. Try standard Async Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch {
        // Fallback to legacy execCommand below
      }
    }

    // 2. Try execCommand('copy') with temporary textarea
    try {
      const el = document.createElement('textarea');
      el.value = textToCopy;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      el.setSelectionRange(0, el.value.length);
      const successful = document.execCommand('copy');
      document.body.removeChild(el);
      if (successful) return true;
    } catch {
      // Fallback to parent postMessage
    }

    // 3. If embedded in iframe, ask parent window to copy
    if (embedded) {
      try {
        window.parent.postMessage({ type: 'copy-text-to-clipboard', text: textToCopy }, '*');
        return true;
      } catch {}
    }

    return false;
  };

  // Copy to clipboard with animation
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setHasCopied(true);
      showToast('Copied formatted post! 📋✨');
      setTimeout(() => setHasCopied(false), 2000);
    } else {
      showToast('Failed to copy to clipboard');
    }
  };

  // Insert post into LinkedIn's "Create a post" composer
  const handleInsertToLinkedIn = () => {
    if (!text.trim()) {
      showToast('Nothing to insert — write your post first!');
      return;
    }
    // Snapshot text IMMEDIATELY — avoids any stale-closure risk with async tab queries
    const textToInsert = text;
    setInsertErrorDetails(null);

    if (embedded) {
      // ── Embedded iframe path ──────────────────────────────────────────────
      // The formatter panel is injected into the LinkedIn tab itself.
      // LinkedIn tab IS focused → postMessage works, "Start a post" click works.
      window.parent.postMessage({ type: 'insert-to-linkedin', text: textToInsert }, '*');
      return;
    }

    // ── Standalone popup path ─────────────────────────────────────────────────
    // The extension popup is its own window. While it's open, the LinkedIn tab is
    // in the background and won't respond to synthetic DOM clicks (e.g. "Start a post").
    // Fix: resolve the LinkedIn tab → focus its window → wait 350ms → send insert message.
    // Focusing LinkedIn will close this popup (Chrome default), but setTimeout and
    // chrome API callbacks still complete even after popup closes.

    const doInsertInTab = (tabId: number, windowId: number) => {
      showToast('Switching to LinkedIn... ⚡');

      // Bring LinkedIn window to the foreground so the content script can interact
      chrome.windows.update(windowId, { focused: true }, () => {
        chrome.tabs.update(tabId, { active: true }, () => {
          // Wait for the tab to fully become active before inserting
          setTimeout(() => {
            chrome.tabs.sendMessage(
              tabId,
              { type: 'insert-to-linkedin', text: textToInsert },
              { frameId: 0 },
              (response) => {
                if (chrome.runtime.lastError) {
                  // Popup may be closed by now — silently ignore
                  return;
                }
                if (response?.success) {
                  // Popup may be closed — nothing to do, user sees result in LinkedIn
                  return;
                }
                // If popup is still alive, show the error
                try {
                  const err = response?.error || 'Please open LinkedIn "Create a post" first';
                  setInsertErrorDetails(err);
                  showToast('Autofill failed — see error details below');
                } catch {
                  // popup already unmounted
                }
              }
            );
          }, 350);
        });
      });
    };

    // Find the LinkedIn tab: prefer the last-focused window's active tab,
    // fall back to any open LinkedIn tab across all windows.
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id != null && (tab.url || '').includes('linkedin.com')) {
        doInsertInTab(tab.id, tab.windowId);
      } else {
        chrome.tabs.query({ url: '*://*.linkedin.com/*' }, (liTabs) => {
          const liTab = liTabs[0];
          if (!liTab?.id) {
            showToast('Open LinkedIn in a browser tab first!');
            return;
          }
          doInsertInTab(liTab.id, liTab.windowId);
        });
      }
    });
  };

  // Close handler (embedded iframe or popup window)
  const handleClose = () => {
    if (embedded) {
      window.parent.postMessage({ type: 'close-formatter' }, '*');
    } else {
      window.close();
    }
  };

  // Save current post as template
  const handleSaveCurrentAsTemplate = async () => {
    if (!text.trim()) {
      showToast('Cannot save an empty template');
      return;
    }

    const title = newTemplateTitle.trim() || text.slice(0, 30).trim() + '...';
    const newItem: TemplateItem = {
      id: `custom-${Date.now()}`,
      title,
      category: 'Custom',
      content: text
    };

    const next = await saveTemplate(newItem, maxTemplates);
    setTemplates(next);
    setShowSaveModal(false);
    setNewTemplateTitle('');
    showToast('Template saved successfully! 💾');
  };

  // Delete custom template
  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await deleteTemplate(id);
    setTemplates(next);
    showToast('Template removed');
  };

  // Filter templates by category
  const categories = ['All', 'Framework', 'Story', 'Opinion', 'Launch', 'Marketing', 'HR', 'Finance', 'Startup', 'Personal', 'Custom'];
  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  // Char limit bar helpers
  const LINKEDIN_CHAR_LIMIT = 3000;
  const charPct = Math.min((stats.charCount / LINKEDIN_CHAR_LIMIT) * 100, 100);
  const charColor = stats.charCount > 2800 ? 'red' : stats.charCount > 2000 ? 'amber' : '';

  return (
    <div className={`app-shell ${embedded ? 'embedded' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-pill">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="header">
        <div className="header-left">
          <div className="brand-badge">
            <FaLinkedin size={20} className="brand-logo" />
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">Post Formatter</h1>
            </div>
            <p className="brand-sub">Craft high-impact LinkedIn posts</p>
          </div>
        </div>

        <div className="header-right" style={{position:'relative'}}>
          {/* History Button */}
          <div className="history-dropdown-wrapper">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowHistory(!showHistory)}
              title={`Post History (${drafts.length} saved)`}
              style={{position:'relative'}}
            >
              <Clock size={16} />
              {drafts.length > 0 && <span style={{fontSize:'9px',fontWeight:700,position:'absolute',top:2,right:2,background:'#0a66c2',color:'#fff',borderRadius:'50%',width:12,height:12,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>{drafts.length}</span>}
            </button>
            {showHistory && (
              <div className="history-popover">
                <div className="history-popover-header">
                  <span className="history-popover-title">📋 Recent Drafts</span>
                  <button type="button" className="icon-btn" style={{padding:'2px'}} onClick={() => setShowHistory(false)}><X size={13}/></button>
                </div>
                {drafts.length === 0
                  ? <div className="history-empty">No drafts yet.<br/>Start writing — auto-saves every 2s!</div>
                  : drafts.map((draft) => (
                    <div key={draft.id} className="history-draft-item" onClick={() => handleLoadDraft(draft)}>
                      <div className="history-draft-content">
                        <div className="history-draft-preview">{draft.preview}</div>
                        <div className="history-draft-time">{formatDraftTime(draft.savedAt)}</div>
                      </div>
                      <button type="button" className="history-draft-delete" onClick={(e) => handleDeleteDraft(draft.id, e)}><Trash2 size={12}/></button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (window.confirm('Reset composer text to sample?')) {
                setText(DEFAULT_TEMPLATES[0].content);
                showToast('Composer reset');
              }
            }}
            title="Reset Composer"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            title={embedded ? 'Close Formatter Panel' : 'Close Popup'}
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Autofill Error Alert Banner with full diagnostics and Copy button */}
      {insertErrorDetails && (
        <div className="error-alert-banner">
          <div className="error-alert-header">
            <span>⚠️ Autofill Issue Detected</span>
            <button
              type="button"
              className="error-alert-close"
              onClick={() => setInsertErrorDetails(null)}
              title="Dismiss error report"
            >
              <X size={14} />
            </button>
          </div>
          <pre className="error-alert-content">{insertErrorDetails}</pre>
          <div className="error-alert-actions">
            <button
              type="button"
              className="error-alert-btn"
              onClick={() => {
                void copyToClipboard(insertErrorDetails);
                showToast('Copied error report! 📋');
              }}
            >
              Copy Error Info
            </button>
            <button
              type="button"
              className="error-alert-btn primary"
              onClick={() => {
                setInsertErrorDetails(null);
                handleInsertToLinkedIn();
              }}
            >
              Retry Insert
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          <PenLine size={15} />
          <span>Editor & Styles</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={15} />
          <span>Feed Preview</span>
          {stats.isPastSeeMore && <span className="tab-indicator-dot" title="Crossed mobile fold" />}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Bookmark size={15} />
          <span>Templates</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'hashtags' ? 'active' : ''}`}
          onClick={() => setActiveTab('hashtags')}
        >
          <Hash size={15} />
          <span># Tags</span>
        </button>
      </nav>

      {/* TAB 1: COMPOSE & FORMAT */}
      {activeTab === 'compose' && (
        <main className="tab-content">
          {/* Post Textarea */}
          <div className="editor-container">
            <div className="editor-top-bar">
              <span className="editor-label">Post Composer</span>
              <div className="selection-hint">
                <Sparkles size={13} />
                <span>Tip: Highlight text to format specific words</span>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              id="post-input"
              className="composer-textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                recordSelection();
              }}
              onSelect={recordSelection}
              onKeyUp={recordSelection}
              onClick={recordSelection}
              onPointerUp={recordSelection}
              placeholder="Write or paste your LinkedIn post here..."
              rows={9}
              spellCheck="true"
            />

            {/* Live Metrics Row */}
            <div className="metrics-row">
              {/* Character Limit Bar */}
              <div className="char-limit-bar-wrapper" title={`${stats.charCount} / ${LINKEDIN_CHAR_LIMIT} LinkedIn character limit`}>
                <div className="char-limit-bar">
                  <div
                    className={`char-limit-fill ${charColor}`}
                    style={{ width: `${charPct}%` }}
                  />
                </div>
                <span className={`char-limit-count ${charColor}`}>
                  {stats.charCount >= LINKEDIN_CHAR_LIMIT
                    ? `+${stats.charCount - LINKEDIN_CHAR_LIMIT} over!`
                    : `${stats.charCount}/${LINKEDIN_CHAR_LIMIT}`}
                </span>
              </div>
              <div className="metric-chip">
                <span className="metric-value">{stats.wordCount}</span>
                <span className="metric-name">words</span>
              </div>
              <div className="metric-chip">
                <span className="metric-value">~{stats.readSeconds}s</span>
                <span className="metric-name">read</span>
              </div>

              {stats.isPastSeeMore ? (
                <div className="hook-status-badge warning" title={`LinkedIn shows "see more" after ~${stats.SEE_MORE_CHAR_LIMIT} chars or 5+ lines`}>
                  ⚠️ Past fold
                </div>
              ) : (
                <div className="hook-status-badge success" title="Entire post fits above the LinkedIn fold">
                  ✅ Above fold
                </div>
              )}
            </div>
          </div>

          {/* Typography Styles Bar */}
          <div className="toolbar-section">
            <div className="toolbar-heading">
              <span>Unicode Styles</span>
              <span className="sub-hint">Click to apply to selection or whole post</span>
            </div>
            <div className="styles-grid">
              {STYLE_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`style-chip ${activeStyle === item.key ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyStyle(item.key)}
                  title={`Apply ${item.label} styling`}
                >
                  <span className="style-chip-preview">{item.preview}</span>
                  <span className="style-chip-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Creator Tools */}
          <div className="quick-tools-section">
            <div className="toolbar-heading">
              <span>Quick Enhancements</span>
            </div>
            <div className="quick-tools-row">
              <button
                type="button"
                className="tool-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleHookify}
                title="Bold the very first line of your post"
              >
                ⚡ Bold Hook Line
              </button>
              <button
                type="button"
                className="tool-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCleanSpacing}
                title="Remove messy stacked blank lines"
              >
                🧹 Clean Spacing
              </button>
              <button
                type="button"
                className="tool-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClearFormatting}
                title="Convert all styled Unicode back to plain standard text"
              >
                ↺ Clear Styles
              </button>
            </div>

            {/* Bullet List Presets */}
            <div className="bullets-row">
              <span className="bullet-label">List Bullets:</span>
              <div className="bullet-buttons">
                {BULLET_STYLES.map((b) => (
                  <button
                    key={b.icon}
                    type="button"
                    className="bullet-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyBullet(b.icon)}
                    title={b.label}
                  >
                    {b.icon === 'num' ? '1️⃣2️⃣' : b.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Picker */}
            <div className="emoji-section">
              <div className="emoji-section-header">
                <span className="toolbar-heading" style={{marginBottom:0}}><SmilePlus size={13} style={{verticalAlign:'middle',marginRight:4}}/>Emojis</span>
                <button type="button" className="emoji-toggle-btn" onClick={() => setShowEmojiPanel(!showEmojiPanel)}>
                  {showEmojiPanel ? 'Hide' : 'Show'}
                </button>
              </div>
              {showEmojiPanel && (
                <div className="emoji-panel">
                  <div className="emoji-category-tabs">
                    {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                      <button key={cat} type="button" className={`emoji-cat-btn ${activeEmojiCat === cat ? 'active' : ''}`} onClick={() => setActiveEmojiCat(cat)}>{cat}</button>
                    ))}
                  </div>
                  <div className="emoji-grid">
                    {EMOJI_CATEGORIES[activeEmojiCat].map((emoji, i) => (
                      <button key={i} type="button" className="emoji-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => handleInsertEmoji(emoji)} title={`Insert ${emoji}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* TAB 2: LINKEDIN CARD PREVIEW */}
      {activeTab === 'preview' && (
        <main className="tab-content">
          <LinkedInCardPreview text={text} charCount={stats.charCount} />
        </main>
      )}

      {/* TAB 3: VIRAL TEMPLATES */}
      {activeTab === 'templates' && (
        <main className="tab-content">
          <div className="templates-header">
            <div className="templates-title-row">
              <div>
                <h2 className="section-title">Creator Frameworks</h2>
                <p className="section-desc">Proven structures designed for maximum engagement</p>
              </div>
              <button
                type="button"
                className="save-template-trigger-btn"
                onClick={() => setShowSaveModal(true)}
              >
                <Plus size={14} />
                <span>Save Draft</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Save Modal Inline Box */}
          {showSaveModal && (
            <div className="save-modal-card">
              <p className="save-modal-title">Save current post as a reusable template</p>
              <input
                type="text"
                className="save-input"
                placeholder="Give your template a name (e.g. My Weekly Roundup)..."
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                maxLength={40}
              />
              <div className="save-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-confirm"
                  onClick={handleSaveCurrentAsTemplate}
                >
                  Save Template
                </button>
              </div>
            </div>
          )}

          {/* Templates Grid */}
          <div className="templates-list">
            {filteredTemplates.map((item) => (
              <div
                key={item.id}
                className="template-card"
                onClick={() => {
                  setText(item.content);
                  setActiveTab('compose');
                  showToast(`Loaded "${item.title}"! ✍️`);
                }}
              >
                <div className="template-card-top">
                  <span className={`template-cat-tag cat-${item.category.toLowerCase()}`}>
                    {item.category}
                  </span>
                  {item.category === 'Custom' && (
                    <button
                      type="button"
                      className="delete-template-btn"
                      onClick={(e) => handleDeleteTemplate(item.id, e)}
                      title="Delete template"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <h3 className="template-card-title">{item.title}</h3>
                <p className="template-card-snippet">
                  {item.content.slice(0, 100).replace(/\n/g, ' ')}...
                </p>
                <div className="template-card-footer">
                  <span>Click to use template</span>
                  <span className="template-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
      {/* TAB 4: HASHTAG MANAGER */}
      {activeTab === 'hashtags' && (
        <main className="tab-content">
          {canUse('hashtags') ? (
            <div className="hashtag-section">
              <div className="hashtag-section-header">
                <div>
                  <h2 className="section-title"># Hashtag Sets</h2>
                  <p className="section-desc">Save sets — append to post with one click</p>
                </div>
                <button
                  type="button"
                  className="save-template-trigger-btn"
                  onClick={() => setShowNewHashtagForm(!showNewHashtagForm)}
                >
                  {showNewHashtagForm ? <><X size={13}/> <span>Cancel</span></> : <><Plus size={14}/> <span>New Set</span></>}
                </button>
              </div>
              {showNewHashtagForm && (
                <div className="hashtag-new-form">
                  <input
                    type="text"
                    placeholder="Set name (e.g. Tech & AI)"
                    value={newHashtagName}
                    onChange={(e) => setNewHashtagName(e.target.value)}
                    maxLength={40}
                  />
                  <textarea
                    placeholder={'Add hashtags, comma or space separated...\ne.g. AI, Tech, Innovation'}
                    value={newHashtagTags}
                    onChange={(e) => setNewHashtagTags(e.target.value)}
                  />
                  <span className="hashtag-hint">Tags without # are auto-prefixed</span>
                  <div className="save-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => { setShowNewHashtagForm(false); setNewHashtagName(''); setNewHashtagTags(''); }}>Cancel</button>
                    <button type="button" className="btn-confirm" onClick={handleSaveHashtagSet}>Save Set</button>
                  </div>
                </div>
              )}
              {hashtagSets.map((set) => (
                <div key={set.id} className="hashtag-set-card">
                  <div className="hashtag-set-top">
                    <span className="hashtag-set-name">{set.name}</span>
                    <div className="hashtag-set-actions">
                      <button type="button" className="hashtag-append-btn" onClick={() => handleAppendHashtags(set)}>+ Append</button>
                      <button type="button" className="hashtag-delete-btn" onClick={(e) => handleDeleteHashtagSet(set.id, e)} title="Delete set"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="hashtag-tags-row">
                    {set.tags.map((tag) => <span key={tag} className="hashtag-tag-chip">{tag}</span>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pro-lock-card">
              <div className="pro-lock-icon">🔒</div>
              <div className="pro-lock-title">Hashtag Manager is a Pro Feature</div>
              <div className="pro-lock-desc">Save hashtag sets and append to posts with one click.</div>
              <button type="button" className="pro-upgrade-btn">⭐ Upgrade to Pro</button>
            </div>
          )}
        </main>
      )}

      {/* Floating Bottom Primary Action Bar */}
      <footer className="footer-action-bar">
        <button
          type="button"
          className={`action-btn-copy ${hasCopied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy formatted post to clipboard"
        >
          {hasCopied ? <Check size={17} /> : <Copy size={17} />}
          <span>{hasCopied ? 'Copied!' : 'Copy Post'}</span>
        </button>

        <button
          type="button"
          className="action-btn-insert"
          onClick={handleInsertToLinkedIn}
          title="Insert formatted post directly into LinkedIn's Create a post field"
        >
          <Send size={17} />
          <span>Insert to LinkedIn</span>
        </button>
      </footer>
    </div>
  );
}


