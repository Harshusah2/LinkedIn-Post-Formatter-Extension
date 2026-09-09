import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  saveTheme
} from '../shared/storage';
import { DEFAULT_TEMPLATES, TemplateItem, maxTemplates } from '../shared/constants';
import { FaLinkedin } from 'react-icons/fa6';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  RotateCcw,
  Sun,
  Moon,
  Trash2,
  Plus,
  Eye,
  PenLine,
  Bookmark,
  X
} from 'lucide-react';
import { LinkedInCardPreview } from './components/LinkedInCardPreview';

type TabType = 'compose' | 'preview' | 'templates';

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
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const query = new URLSearchParams(window.location.search);
  const embedded = query.get('embedded') === '1';
  const targetTabId = Number(query.get('targetTabId'));

  // Initialize theme and load data
  useEffect(() => {
    const saved = loadSavedTheme();
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);

    void initTemplates();
    void loadComposerText();
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
          showToast('Inserted into composer! 🚀');
        } else {
          showToast(event.data.error || 'Please open LinkedIn "Create a post" first');
        }
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  const stats = useMemo(() => calculatePostStats(text), [text]);

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

  // Handle formatting application (selection-aware)
  const applyStyle = (styleKey: StyleKey) => {
    setActiveStyle(styleKey);
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => formatText(prev, styleKey));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const { nextText, newStart, newEnd } = formatSelectionOrAll(text, start, end, styleKey);
    setText(nextText);

    // Restore cursor selection after state update
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });

    showToast(start === end ? `Formatted all as ${styleKey}` : `Formatted selection as ${styleKey}`);
  };

  // Apply bullet points to selected lines or entire text
  const handleApplyBullet = (bulletIcon: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? text.length;

    const { nextText, newStart, newEnd } = applyBulletToList(text, start, end, bulletIcon);
    setText(nextText);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });

    showToast('Applied list bullets 🔹');
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

  // Close handler (embedded iframe or popup window)
  const handleClose = () => {
    if (embedded) {
      window.parent.postMessage({ type: 'close-formatter' }, '*');
    } else {
      window.close();
    }
  };

  // Insert into LinkedIn active post composer
  const handleInsertIntoLinkedIn = async () => {
    if (embedded) {
      window.parent.postMessage({ type: 'insert-formatted-text', text }, '*');
      return;
    }

    try {
      const tabId = Number.isInteger(targetTabId) && targetTabId > 0 ? targetTabId : undefined;
      const tabs = tabId ? [] : await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabId ? { id: tabId } : tabs[0];

      if (!tab?.id) {
        showToast('No active LinkedIn tab found');
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'insert-formatted-text', text }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          showToast(response?.error || 'Please open LinkedIn "Create a post" first');
        } else {
          showToast('Inserted into LinkedIn! 🚀');
          setTimeout(() => window.close(), 500);
        }
      });
    } catch {
      showToast('Please open LinkedIn "Create a post" first');
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
  const categories = ['All', 'Framework', 'Story', 'Opinion', 'Launch', 'Custom'];
  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

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
              <span className="pro-badge">PRO</span>
            </div>
            <p className="brand-sub">Craft high-impact LinkedIn posts</p>
          </div>
        </div>

        <div className="header-right">
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
              onChange={(e) => setText(e.target.value)}
              placeholder="Write or paste your LinkedIn post here..."
              rows={9}
              spellCheck="true"
            />

            {/* Live Metrics Row */}
            <div className="metrics-row">
              <div className="metric-chip">
                <span className="metric-value">{stats.charCount}</span>
                <span className="metric-name">chars</span>
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
                <div className="hook-status-badge warning" title="LinkedIn cuts off around 210 chars on mobile">
                  ⚠️ Past "See more" fold ({stats.charCount}/210)
                </div>
              ) : (
                <div className="hook-status-badge success" title="Entire text fits above fold">
                  ✅ Fits above fold
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
                onClick={handleHookify}
                title="Bold the very first line of your post"
              >
                ⚡ Bold Hook Line
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={handleCleanSpacing}
                title="Remove messy stacked blank lines"
              >
                🧹 Clean Spacing
              </button>
              <button
                type="button"
                className="tool-btn"
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
                    onClick={() => handleApplyBullet(b.icon)}
                    title={b.label}
                  >
                    {b.icon === 'num' ? '1️⃣2️⃣' : b.icon}
                  </button>
                ))}
              </div>
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
          onClick={handleInsertIntoLinkedIn}
          title="Insert directly into open LinkedIn composer"
        >
          <Send size={17} />
          <span>Insert to LinkedIn</span>
        </button>
      </footer>
    </div>
  );
}
