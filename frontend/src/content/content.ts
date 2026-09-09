const buttonId = 'linkedin-post-formatter-button';
let formatterFrame: HTMLIFrameElement | null = null;
let isAnimatingClose = false;
let activeComposer: HTMLElement | null = null;

const composerSelectors = [
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="true"]',
  '.ql-editor'
];

function isCommentOrFeedEditor(element: HTMLElement): boolean {
  // 1. Any element inside a feed post item (all comments, replies, update items)
  if (element.closest('.feed-shared-update-v2, .feed-shared-update, [data-urn*="activity"], article, .comments-comment-box, .feed-shared-comment-box, .comments-comments-list, .comments-comment-item, .feed-shared-update-v2__comments-container')) {
    return true;
  }

  // 2. Any element inside LinkedIn messaging / chat overlays
  if (element.closest('.msg-overlay-container, .msg-overlay-conversation-bubble, .msg-form, .msg-thread, .msg-convo-wrapper')) {
    return true;
  }

  // 3. Extension iframe
  if (element.closest('#linkedin-formatter-frame')) {
    return true;
  }

  // 4. Attributes indicating comment, reply, search, message
  const text = [
    element.getAttribute('data-placeholder'),
    element.getAttribute('placeholder'),
    element.getAttribute('aria-label'),
    element.getAttribute('aria-placeholder')
  ].filter(Boolean).join(' ').toLowerCase();

  return text.includes('comment') || text.includes('reply') || text.includes('message') || text.includes('search');
}

function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function findPostComposer(): HTMLElement | null {
  // Strategy 1: Targeted search by LinkedIn's post composer placeholder ("talk about")
  // Only the main post composer has "What do you want to talk about?" (comments never do)
  const placeholderMatches = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-placeholder*="talk about" i], [aria-placeholder*="talk about" i], [aria-label*="talk about" i]'
    )
  ).filter((el) => isElementVisible(el) && !isCommentOrFeedEditor(el));

  for (const el of placeholderMatches) {
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      return el;
    }
    const editableAncestor = el.closest<HTMLElement>('[contenteditable="true"]');
    if (editableAncestor && isElementVisible(editableAncestor) && !isCommentOrFeedEditor(editableAncestor)) {
      return editableAncestor;
    }
    const editableChild = el.querySelector<HTMLElement>('[contenteditable="true"]');
    if (editableChild && isElementVisible(editableChild) && !isCommentOrFeedEditor(editableChild)) {
      return editableChild;
    }
  }

  // Strategy 2: Look inside active "Create a post" modal dialog containers
  const dialogSelectors = [
    '#artdeco-modal-outlet [role="dialog"]',
    '#artdeco-modal-outlet .artdeco-modal',
    '.artdeco-modal--layer-default',
    '[role="dialog"].artdeco-modal',
    '.artdeco-modal[role="dialog"]',
    '.share-creation-state',
    '.share-box-modal',
    '[role="dialog"]',
    '.artdeco-modal'
  ];

  for (const dialogSel of dialogSelectors) {
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>(dialogSel)).filter(isElementVisible);
    for (const dialog of dialogs) {
      // Must not be a reaction or comments modal
      const dialogLabel = (dialog.getAttribute('aria-label') || '').toLowerCase();
      if (dialogLabel.includes('reaction') || dialogLabel.includes('comment')) continue;

      const editor = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          '.ql-editor[contenteditable="true"], [contenteditable="true"][role="textbox"], [contenteditable="true"]'
        )
      ).find((el) => isElementVisible(el) && !isCommentOrFeedEditor(el));

      if (editor) return editor;
    }
  }

  // Strategy 3: Currently focused element if editable and strictly NOT in comments/feed
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.isContentEditable && isElementVisible(active) && !isCommentOrFeedEditor(active)) {
    return active;
  }

  // Strategy 4: Cached active composer if not in comments/feed
  if (activeComposer && activeComposer.isConnected && isElementVisible(activeComposer) && !isCommentOrFeedEditor(activeComposer)) {
    return activeComposer;
  }

  // Note: We deliberately do NOT fall back to arbitrary page contenteditables.
  // If the post modal is not open, returning null tells insertFormattedText to click "Start a post".
  return null;
}

function findStartPostTrigger(): HTMLElement | null {
  // Strategy A: Inside top-of-feed share box wrapper
  const shareBox = document.querySelector('.share-box-feed-entry__wrapper, .share-box-feed-entry, .share-box');
  if (shareBox) {
    const trigger = Array.from(shareBox.querySelectorAll<HTMLElement>('button, [role="button"], div.artdeco-button'))
      .find((el) => {
        const text = [el.innerText, el.getAttribute('aria-label')].filter(Boolean).join(' ').toLowerCase();
        return text.includes('start a post') || text.includes('create a post') || isElementVisible(el);
      });
    if (trigger) return trigger;
  }

  // Strategy B: Any button explicitly labeled "Start a post" or "Create a post" outside feed post items
  const allButtons = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'));
  const startBtn = allButtons.find((el) => {
    if (el.closest('.feed-shared-update-v2, .feed-shared-update, article, .comments-comment-box, [data-urn*="activity"]')) {
      return false;
    }
    const label = [
      el.getAttribute('aria-label'),
      el.getAttribute('data-placeholder'),
      el.innerText
    ].filter(Boolean).join(' ').toLowerCase();
    return label.includes('start a post') || label.includes('create a post') || label.includes('write a post');
  });

  return startBtn ?? null;
}

function insertText(composer: HTMLElement, text: string): boolean {
  // 1. Force window and element focus (critical when user clicked from inside extension iframe!)
  window.focus();
  if (formatterFrame) {
    try {
      formatterFrame.blur();
    } catch {}
  }
  composer.focus();

  // 2. Select all current contents in composer
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(composer);
  selection?.removeAllRanges();
  selection?.addRange(range);

  // 3. Prepare Quill HTML paragraphs
  const lines = text.split('\n');
  const htmlParagraphs = lines.map((line) => {
    if (!line.trim()) return '<p><br></p>';
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p>${escaped}</p>`;
  }).join('');

  // 4. Try native typing command (execCommand insertText)
  // This simulates user typing, preserves all Unicode styling, and keeps React/Quill state in sync
  let inserted = false;
  try {
    inserted = document.execCommand('insertText', false, text);
  } catch {
    inserted = false;
  }

  // 5. If execCommand('insertText') did not populate innerText, try insertHTML
  if (!inserted || !composer.innerText || composer.innerText.trim() === '') {
    try {
      range.selectNodeContents(composer);
      selection?.removeAllRanges();
      selection?.addRange(range);
      inserted = document.execCommand('insertHTML', false, htmlParagraphs);
    } catch {
      inserted = false;
    }
  }

  // 6. Direct DOM assignment fallback
  if (!composer.innerText || composer.innerText.trim() === '') {
    composer.innerHTML = htmlParagraphs;
    inserted = true;
  }

  // 7. Clear Quill's placeholder classes
  composer.classList.remove('ql-blank');
  composer.querySelectorAll('.ql-blank').forEach((el) => el.classList.remove('ql-blank'));

  // 8. Fire synthetic input events to trigger React & Quill state update
  composer.dispatchEvent(new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));
  composer.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));
  composer.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  composer.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  composer.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
  composer.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));

  // 9. Move cursor to end
  try {
    const endRange = document.createRange();
    endRange.selectNodeContents(composer);
    endRange.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(endRange);
  } catch {}

  // 10. Enable the LinkedIn Post button if disabled
  const dialog = composer.closest('[role="dialog"], .artdeco-modal, .share-creation-state, .share-box');
  if (dialog) {
    dialog.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    dialog.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    const postButton = dialog.querySelector<HTMLButtonElement>(
      'button.share-actions__primary-action, button.artdeco-button--primary'
    );
    if (postButton && postButton.hasAttribute('disabled')) {
      postButton.removeAttribute('disabled');
      postButton.classList.remove('artdeco-button--disabled');
    }
  }

  return true;
}

async function insertFormattedText(text: string): Promise<boolean> {
  let composer = findPostComposer();

  // If "Create a post" modal is not open yet, find and click "Start a post" button
  if (!composer) {
    const startPostButton = findStartPostTrigger();
    if (startPostButton) {
      startPostButton.click();
    }

    // Wait up to 5.0 seconds (50 iterations * 100ms) for the modal to mount
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      composer = findPostComposer();
      if (composer) break;
    }
  }

  if (!composer) {
    return false;
  }

  // Small delay to ensure Quill editor is fully initialized inside the modal
  await new Promise((resolve) => setTimeout(resolve, 150));

  return insertText(composer, text);
}

function showFormatterPanel(text: string) {
  if (isAnimatingClose) return;

  const triggerButton = document.getElementById(buttonId);

  if (formatterFrame) {
    // Already open, send text and focus
    formatterFrame.contentWindow?.postMessage({ type: 'composer-text', text }, '*');
    return;
  }

  formatterFrame = document.createElement('iframe');
  formatterFrame.id = 'linkedin-formatter-frame';
  formatterFrame.src = chrome.runtime.getURL('index.html?embedded=1');
  formatterFrame.allow = 'clipboard-write; clipboard-read';

  // Initial state for smooth slide-in animation from left
  Object.assign(formatterFrame.style, {
    position: 'fixed',
    top: '16px',
    left: '16px',
    width: '460px',
    height: 'calc(100vh - 32px)',
    maxHeight: '780px',
    zIndex: '2147483647',
    border: '0',
    borderRadius: '16px',
    boxShadow: '0 16px 48px -4px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0,0,0,0.06)',
    background: '#f4f6f8',
    opacity: '0',
    transform: 'translateX(-105%) scale(0.97)',
    transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity'
  });

  if (triggerButton) {
    triggerButton.style.opacity = '0.35';
  }

  document.body.appendChild(formatterFrame);

  // Trigger entrance transition on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (formatterFrame) {
        formatterFrame.style.opacity = '1';
        formatterFrame.style.transform = 'translateX(0) scale(1)';
      }
    });
  });

  formatterFrame.addEventListener('load', () => {
    formatterFrame?.contentWindow?.postMessage({ type: 'composer-text', text }, '*');
  }, { once: true });
}

function closeFormatterPanel() {
  if (!formatterFrame || isAnimatingClose) return;

  isAnimatingClose = true;
  const frameToClose = formatterFrame;
  const triggerButton = document.getElementById(buttonId);

  // Trigger exit animation sliding back to the left
  frameToClose.style.opacity = '0';
  frameToClose.style.transform = 'translateX(-105%) scale(0.97)';

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    frameToClose.remove();
    if (formatterFrame === frameToClose) {
      formatterFrame = null;
    }
    isAnimatingClose = false;
    if (triggerButton) {
      triggerButton.style.opacity = '1';
      triggerButton.style.pointerEvents = 'auto';
    }
  };

  frameToClose.addEventListener('transitionend', cleanup, { once: true });
  setTimeout(cleanup, 360); // Fallback if transitionend doesn't trigger
}

function ensureButton() {
  if (document.getElementById(buttonId)) return;

  const button = document.createElement('button');
  button.id = buttonId;
  button.type = 'button';
  button.setAttribute('aria-label', 'Open LinkedIn Post Formatter');

  button.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
      <span>Format</span>
    </span>
  `;

  // Attached to screen left side, vertically centered
  Object.assign(button.style, {
    position: 'fixed',
    left: '0px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: '2147483646',
    padding: '11px 15px 11px 10px',
    borderRadius: '0 14px 14px 0',
    border: 'none',
    borderLeft: 'none',
    background: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '12.5px',
    letterSpacing: '0.02em',
    boxShadow: '2px 4px 16px rgba(10, 102, 194, 0.4), 0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center'
  });

  // Micro-interaction hover slide effect
  button.addEventListener('mouseenter', () => {
    if (!formatterFrame) {
      button.style.transform = 'translateY(-50%) translateX(4px)';
      button.style.boxShadow = '4px 6px 20px rgba(10, 102, 194, 0.55), 0 2px 4px rgba(0,0,0,0.15)';
    }
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(-50%) translateX(0)';
    button.style.boxShadow = '2px 4px 16px rgba(10, 102, 194, 0.4), 0 1px 3px rgba(0,0,0,0.1)';
  });

  button.addEventListener('click', () => {
    const composer = findPostComposer();
    const text = composer?.innerText ?? '';
    if (formatterFrame) {
      closeFormatterPanel();
    } else {
      showFormatterPanel(text);
    }
  });

  document.body.appendChild(button);
}

document.addEventListener('focusin', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.isContentEditable && !isCommentOrFeedEditor(target)) {
    activeComposer = target;
  }
});

// Window communication from embedded iframe
window.addEventListener('message', async (event) => {
  const isFromOurExtension =
    (formatterFrame && event.source === formatterFrame.contentWindow) ||
    (typeof event.origin === 'string' && event.origin.includes(chrome.runtime.id));

  if (!isFromOurExtension) return;

  if (event.data?.type === 'close-formatter') {
    closeFormatterPanel();
    return;
  }

  if (event.data?.type === 'insert-formatted-text' && typeof event.data.text === 'string') {
    const success = await insertFormattedText(event.data.text);
    if (success) {
      formatterFrame?.contentWindow?.postMessage({ type: 'insert-result', success: true }, '*');
      setTimeout(() => {
        closeFormatterPanel();
      }, 350);
    } else {
      formatterFrame?.contentWindow?.postMessage({
        type: 'insert-result',
        success: false,
        error: 'Please open LinkedIn "Create a post" first!'
      }, '*');
    }
    return;
  }

  // Fallback clipboard copy from parent window
  if (event.data?.type === 'copy-text-to-clipboard' && typeof event.data.text === 'string') {
    try {
      await navigator.clipboard.writeText(event.data.text);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = event.data.text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  }
});

// Chrome runtime communication from popup / background
chrome.runtime.onMessage.addListener((message: { type?: string; text?: string }, _sender, sendResponse) => {
  if (message.type === 'show-formatter-panel' && typeof message.text === 'string') {
    showFormatterPanel(message.text);
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'insert-formatted-text' && typeof message.text === 'string') {
    const textToInsert = message.text;
    void (async () => {
      const success = await insertFormattedText(textToInsert);
      if (success) {
        closeFormatterPanel();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Please open LinkedIn "Create a post" first!' });
      }
    })();
    return true; // async response
  }
  sendResponse({ success: false });
  return false;
});

ensureButton();
new MutationObserver(ensureButton).observe(document.documentElement, { childList: true, subtree: true });


