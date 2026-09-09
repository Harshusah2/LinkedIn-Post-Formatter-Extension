const buttonId = 'linkedin-post-formatter-button';
let formatterFrame: HTMLIFrameElement | null = null;
let isAnimatingClose = false;
let activeComposer: HTMLElement | null = null;

const composerSelectors = [
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="true"]',
  '.ql-editor'
];

function isCommentEditor(element: HTMLElement) {
  const metadata = [
    element.getAttribute('aria-label'),
    element.getAttribute('data-placeholder'),
    element.getAttribute('placeholder'),
    element.closest('[aria-label]')?.getAttribute('aria-label')
  ].filter(Boolean).join(' ').toLowerCase();
  return metadata.includes('comment') || metadata.includes('reply');
}

function findComposer(): HTMLElement | null {
  if (activeComposer && activeComposer.isConnected && activeComposer.offsetParent !== null && !isCommentEditor(activeComposer)) {
    return activeComposer;
  }

  const candidates = Array.from(document.querySelectorAll('[contenteditable="true"], .ql-editor'))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .filter((element) => element.offsetParent !== null && !isCommentEditor(element));

  return candidates.sort((first, second) => {
    const firstDialog = first.closest('[role="dialog"]') ? 1 : 0;
    const secondDialog = second.closest('[role="dialog"]') ? 1 : 0;
    return secondDialog - firstDialog;
  })[0] ?? null;
}

function insertText(composer: HTMLElement, text: string) {
  composer.focus();
  composer.innerHTML = '';
  text.split('\n').forEach((line, index) => {
    if (index > 0) composer.appendChild(document.createElement('br'));
    composer.appendChild(document.createTextNode(line));
  });
  composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
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
    const composer = findComposer();
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
  if (target instanceof HTMLElement && target.isContentEditable && !isCommentEditor(target)) {
    activeComposer = target;
  }
});

// Window communication from embedded iframe
window.addEventListener('message', async (event) => {
  if (event.source !== formatterFrame?.contentWindow) return;

  if (event.data?.type === 'close-formatter') {
    closeFormatterPanel();
    return;
  }

  if (event.data?.type === 'insert-formatted-text' && typeof event.data.text === 'string') {
    const composer = findComposer();
    if (composer) {
      insertText(composer, event.data.text);
    }
    closeFormatterPanel();
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
    const composer = findComposer();
    if (composer) {
      insertText(composer, message.text);
    }
    closeFormatterPanel();
    sendResponse({ success: true });
    return false;
  }
  sendResponse({ success: false });
  return false;
});

ensureButton();
new MutationObserver(ensureButton).observe(document.documentElement, { childList: true, subtree: true });


