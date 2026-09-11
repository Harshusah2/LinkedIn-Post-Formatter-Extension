const buttonId = 'linkedin-post-formatter-button';

function reportExtensionError(error: unknown, source: string) {
  try {
    chrome.runtime.sendMessage({
      type: 'extension-error',
      error: error instanceof Error ? error.message : String(error),
      source
    });
  } catch {}
}

window.addEventListener('error', (event) => {
  if (String(event.filename || '').includes('chrome-extension://')) reportExtensionError(event.error || event.message, 'content-script');
});
window.addEventListener('unhandledrejection', (event) => {
  reportExtensionError(event.reason, 'content-script-promise');
});

let formatterFrame: HTMLIFrameElement | null = null;
let isAnimatingClose = false;

function showFormatterPanel(text: string) {
  if (isAnimatingClose) return;

  const triggerButton = document.getElementById(buttonId);

  if (formatterFrame) {
    // Already open — send text and focus
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
  button.title = 'Format LinkedIn Post';
  button.setAttribute('aria-label', 'Open LinkedIn Post Formatter');

  button.innerHTML = `
    <div style="width:34px;height:34px;border-radius:50%;background:#0A66C2;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.18);transition:transform 0.2s ease;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="display:block;">
        <path d="M19 19h-2.9v-4.5c0-1.08-.02-2.47-1.5-2.47-1.51 0-1.74 1.18-1.74 2.39V19h-2.9V9.5h2.78v1.3h.04c.39-.73 1.34-1.5 2.76-1.5 2.95 0 3.5 1.94 3.5 4.47V19zM6.9 8.2a1.69 1.69 0 1 1 0-3.37 1.69 1.69 0 0 1 0 3.37zM5.45 19h2.9V9.5h-2.9V19z"/>
      </svg>
    </div>
  `;

  // Sticked on screen's left at center - sleek dark navy tab with rounded outer corners
  Object.assign(button.style, {
    position: 'fixed',
    left: '0px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: '2147483646',
    width: '50px',
    height: '52px',
    borderRadius: '0 16px 16px 0',
    border: 'none',
    background: '#1D2D44',
    boxShadow: '2px 4px 16px rgba(0, 0, 0, 0.22), 0 1px 4px rgba(0, 0, 0, 0.12)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, background 0.22s ease, opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    outline: 'none',
    webkitTapHighlightColor: 'transparent'
  });

  // Micro-interaction hover & click effects
  button.addEventListener('mouseenter', () => {
    if (!formatterFrame) {
      button.style.transform = 'translateY(-50%) translateX(4px)';
      button.style.boxShadow = '4px 6px 20px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15)';
      button.style.background = '#243956';
    }
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(-50%) translateX(0)';
    button.style.boxShadow = '2px 4px 16px rgba(0, 0, 0, 0.22), 0 1px 4px rgba(0, 0, 0, 0.12)';
    button.style.background = '#1D2D44';
  });

  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(-50%) translateX(2px) scale(0.96)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-50%) translateX(4px)';
  });

  button.addEventListener('click', () => {
    if (formatterFrame) {
      closeFormatterPanel();
    } else {
      showFormatterPanel('');
    }
  });

  document.body.appendChild(button);
}

/** Check if an element is inside our extension iframe or button */
function isOurExtensionElement(el: Element): boolean {
  return el.closest('#linkedin-formatter-frame, #linkedin-post-formatter-button') !== null;
}

/** Check if an element is specifically inside a comment section or direct message chat */
function isCommentOrChat(el: Element): boolean {
  if (isOurExtensionElement(el)) return true;
  // Direct messages (overlay chat bubble)
  if (el.closest('.msg-form, .msg-overlay-container, [data-view-name="message-overlay"]')) return true;
  // Comment section editor (only if it has comment placeholders and lacks Create Post signatures)
  const commentContainer = el.closest(
    '.comments-comment-box, .comments-comment-texteditor, form.comments-comment-box__form, .feed-shared-comment-box'
  );
  if (commentContainer) {
    const text = commentContainer.textContent || '';
    if (!text.includes('Post to Anyone') && !text.includes('talk about') && !text.includes('What do you want to')) {
      return true;
    }
  }
  return false;
}

/** Check that element is attached to DOM and not hidden with display:none / visibility:hidden */
function isNotHidden(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (!el.isConnected) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * Dispatches a complete sequence of pointer/mouse events to reliably simulate a user click.
 * Emits PointerEvents, MouseEvents with standard button states (buttons: 1 on down, 0 on up/click),
 * and dispatches across the leaf element, clickable container, and parent to guarantee React/Ember handler triggering.
 */
function simulateClick(el: HTMLElement) {
  // Find any ancestor that looks like the clickable wrapper
  let clickable: HTMLElement = el;
  let curr: HTMLElement | null = el;
  for (let i = 0; i < 4 && curr && curr !== document.body; i++) {
    if (
      curr.tagName === 'BUTTON' ||
      curr.tagName === 'A' ||
      curr.getAttribute('role') === 'button' ||
      curr.getAttribute('tabindex') !== null
    ) {
      clickable = curr;
      break;
    }
    try {
      if (window.getComputedStyle(curr).cursor === 'pointer') {
        clickable = curr;
      }
    } catch {}
    curr = curr.parentElement;
  }

  // Focus both elements
  try { clickable.focus(); } catch {}
  try { el.focus(); } catch {}

  // List of elements to trigger: inner target, clickable wrapper, and parent
  const elementsToClick: HTMLElement[] = [el];
  if (clickable !== el && !elementsToClick.includes(clickable)) {
    elementsToClick.push(clickable);
  }
  if (
    clickable.parentElement &&
    clickable.parentElement !== document.body &&
    !elementsToClick.includes(clickable.parentElement)
  ) {
    elementsToClick.push(clickable.parentElement);
  }

  for (const target of elementsToClick) {
    // 1. Pointerdown (buttons: 1)
    try {
      target.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        })
      );
    } catch {}

    // 2. Mousedown (buttons: 1)
    try {
      target.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1
        })
      );
    } catch {}

    // 3. Pointerup (buttons: 0)
    try {
      target.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        })
      );
    } catch {}

    // 4. Mouseup (buttons: 0)
    try {
      target.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0
        })
      );
    } catch {}

    // 5. Native click() method
    try {
      target.click();
    } catch {}

    // 6. Synthetic click event (buttons: 0)
    try {
      target.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0
        })
      );
    } catch {}

    // 7. Keyboard Enter & Space simulation (triggers interactive div keyboard listeners)
    try {
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
      target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
      target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
      target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
    } catch {}
  }
}

/**
 * Recursively queries elements across the main document, all Shadow DOM roots,
 * and any accessible same-origin iframes.
 */
function deepQuerySelectorAll<T extends HTMLElement = HTMLElement>(
  selector: string,
  root: Document | Element | ShadowRoot = document
): T[] {
  const results: T[] = [];

  // 1. Query the current root directly
  try {
    const elements = root.querySelectorAll<T>(selector);
    for (const el of Array.from(elements)) {
      if (!isOurExtensionElement(el)) {
        results.push(el);
      }
    }
  } catch {}

  // 2. Recursively traverse child elements to check for open shadowRoot
  try {
    const all = root.querySelectorAll('*');
    for (const el of Array.from(all)) {
      if (isOurExtensionElement(el)) continue;

      if (el.shadowRoot) {
        results.push(...deepQuerySelectorAll<T>(selector, el.shadowRoot));
      }

      if (el instanceof HTMLIFrameElement) {
        try {
          const doc = el.contentDocument || el.contentWindow?.document;
          if (doc) {
            results.push(...deepQuerySelectorAll<T>(selector, doc));
          }
        } catch {}
      }
    }
  } catch {}

  return results;
}

/**
 * Finds the currently open LinkedIn "Create a post" modal and returns its text editor.
 * Uses exact selectors and searches across Light DOM, Shadow DOM roots, and iframes.
 */
function getOpenCreatePostEditor(diag?: string[]): HTMLElement | null {
  diag?.push('Scanning for Create Post editor (deep Shadow DOM & iframe aware)...');

  // 1. Direct query using LinkedIn's exact DOM structure and attributes:
  const directSelectors = [
    // Exact attribute from user's inspected DOM:
    '[data-test-ql-editor-contenteditable="true"]',
    // Exact class tree from user's inspected DOM:
    '.share-creation-state__text-editor .ql-editor',
    '.share-creation-state .ql-editor[contenteditable="true"]',
    '.editor-content.ql-container .ql-editor',
    '.share-creation-state [contenteditable="true"]:not(.ql-clipboard)',
    '.share-creation-state__content-scrollable .ql-editor',
    '.share-creation-state__share-box-v2 .ql-editor',
    '.ql-editor[data-placeholder="What do you want to talk about?"]',
    '.ql-editor[aria-label="Text editor for creating content"]',
    '.ql-editor[aria-placeholder="What do you want to talk about?"]',
    '.ql-editor',
    // Additional Create Post selectors:
    '.share-box__text-editor [contenteditable="true"]',
    'div[data-placeholder*="What do you want to talk about"]',
    'div[aria-placeholder*="What do you want to talk about"]'
  ];

  for (const sel of directSelectors) {
    const matches = deepQuerySelectorAll(sel);
    for (const el of matches) {
      if (!isOurExtensionElement(el) && !el.classList.contains('ql-clipboard')) {
        diag?.push(`SUCCESS: Found editor using deep selector: "${sel}" (<${el.tagName} class="${el.className}">)`);
        return el;
      }
    }
  }

  // 2. Gather all contenteditable elements across light DOM and shadow roots
  const allEditables = deepQuerySelectorAll('*').filter((el) => {
    if (isOurExtensionElement(el)) return false;
    return (el.isContentEditable || el.getAttribute('contenteditable') === 'true') && !el.classList.contains('ql-clipboard');
  });

  diag?.push(`Found ${allEditables.length} contenteditable elements across DOM & ShadowRoots`);

  // 3. Match any editable within a .share-creation-state container
  for (const ed of allEditables) {
    if (ed.closest('.share-creation-state, .share-creation-state__text-editor, .share-creation-state__share-box-v2')) {
      diag?.push(`SUCCESS: Found editor via .share-creation-state ancestor: <${ed.tagName} class="${ed.className}">`);
      return ed;
    }
  }

  // 4. Match any editable with "talk about" placeholder
  for (const ed of allEditables) {
    const p = (ed.getAttribute('data-placeholder') || ed.getAttribute('aria-placeholder') || '').toLowerCase();
    if (p.includes('talk about')) {
      diag?.push(`SUCCESS: Found editor via placeholder attribute: <${ed.tagName} class="${ed.className}">`);
      return ed;
    }
  }

  // 5. Match by author button / text in ancestor tree
  for (const ed of allEditables) {
    if (isCommentOrChat(ed)) continue;
    let container: HTMLElement | null = ed;
    for (let depth = 0; depth < 10 && container && container !== document.body; depth++) {
      const text = container.textContent || '';
      if (
        text.includes('Post to Anyone') ||
        text.includes('Post to Connections') ||
        text.includes('talk about') ||
        text.includes('What do you want to')
      ) {
        diag?.push(`SUCCESS: Found editor via ancestor text match: <${ed.tagName} class="${ed.className}">`);
        return ed;
      }
      container = container.parentElement;
    }
  }

  // 6. Non-comment fallback
  const nonComment = allEditables.filter((e) => !isCommentOrChat(e));
  if (nonComment.length > 0) {
    diag?.push(`Fallback to first non-comment editable: <${nonComment[0].tagName} class="${nonComment[0].className}">`);
    return nonComment[0];
  }

  diag?.push('No active Create Post editor found in any DOM tree or ShadowRoot.');
  return null;
}

/**
 * Clicks LinkedIn's "Start a post" button to open the Create Post modal.
 */
function clickStartPostButton(diag?: string[]): boolean {
  // Strategy 1: Known trigger button selectors
  const triggerSelectors = [
    'button.share-box-feed-entry__trigger',
    '[data-view-name="share-box-feed-entry__trigger"]',
    'button[data-control-name="share.sharebox_open"]',
    '.share-box-feed-entry button',
    '.share-box-feed-entry__wrapper button',
    'div.share-box-feed-entry__top-bar button',
    'button[aria-label*="Start a post" i]',
    'button[aria-label*="Create a post" i]',
    '[data-test-share-box-feed-entry__trigger]',
    '[data-view-name*="share-box" i]'
  ];

  for (const sel of triggerSelectors) {
    const btn = deepQuerySelectorAll<HTMLElement>(sel)[0];
    if (btn && isNotHidden(btn) && !isOurExtensionElement(btn)) {
      diag?.push(`Clicked "Start a post" trigger using selector: ${sel}`);
      simulateClick(btn);
      return true;
    }
  }

  // Strategy 2: Targeted text matching with STRICT character length check
  // (Prevents matching huge feed wrapper divs whose text starts with "Start a post")
  const rawCandidates = deepQuerySelectorAll<HTMLElement>('button, [role="button"], span, p, div').filter((b) => {
    if (isOurExtensionElement(b)) return false;
    if (!isNotHidden(b)) return false;
    const t = b.textContent?.trim().toLowerCase() || '';
    // STRICT: Must contain "start a post" or "create a post" and be a leaf/button element (< 50 chars)
    return (t.includes('start a post') || t.includes('create a post')) && t.length < 50;
  });

  // Sort candidates:
  // Priority 1: Has a button tag or button parent
  // Priority 2: Shortest text length (most specific leaf element)
  rawCandidates.sort((a, b) => {
    const aIsBtn = a.tagName === 'BUTTON' || a.closest('button, [role="button"]') !== null;
    const bIsBtn = b.tagName === 'BUTTON' || b.closest('button, [role="button"]') !== null;
    if (aIsBtn && !bIsBtn) return -1;
    if (!aIsBtn && bIsBtn) return 1;
    return (a.textContent?.trim().length || 0) - (b.textContent?.trim().length || 0);
  });

  if (rawCandidates.length > 0) {
    const best = rawCandidates[0];
    diag?.push(`Clicked "Start a post" trigger via text: "${best.textContent?.trim()}" (<${best.tagName} class="${best.className}">)`);
    simulateClick(best);
    return true;
  }

  // Strategy 3: Try media/photo detour button in the share box
  const mediaBtn = deepQuerySelectorAll<HTMLElement>('button, [role="button"]').find((b) => {
    if (isOurExtensionElement(b) || !isNotHidden(b)) return false;
    const label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase().trim();
    return label.includes('add media') || label.includes('add a photo') || label === 'media' || label === 'photo';
  });
  if (mediaBtn) {
    diag?.push(`Clicked media detour trigger: "${mediaBtn.getAttribute('aria-label') || mediaBtn.textContent?.trim()}" (<${mediaBtn.tagName} class="${mediaBtn.className}">)`);
    simulateClick(mediaBtn);
    return true;
  }

  diag?.push('Could not find any "Start a post" button on page.');
  return false;
}

/**
 * Polls for the Create Post editor to appear after clicking "Start a post".
 */
async function waitForEditor(timeoutMs = 6000, diag?: string[]): Promise<HTMLElement | null> {
  const start = Date.now();
  diag?.push(`Polling for editor (timeout: ${timeoutMs}ms)...`);
  let retriedClick = false;

  while (Date.now() - start < timeoutMs) {
    const editor = getOpenCreatePostEditor();
    if (editor) {
      diag?.push(`Editor found after ${Date.now() - start}ms!`);
      return editor;
    }
    // If not found after 1500ms, retry clicking "Start a post" once
    if (!retriedClick && Date.now() - start > 1500) {
      retriedClick = true;
      diag?.push('Editor not detected yet after 1500ms. Retrying "Start a post" click...');
      clickStartPostButton(diag);
    }
    await new Promise((res) => setTimeout(res, 80));
  }

  diag?.push(`Editor polling timed out after ${timeoutMs}ms.`);

  // At timeout, capture detailed DOM state across all roots
  const shareBoxes = deepQuerySelectorAll('.share-creation-state, .share-box-v2, [data-test-ql-editor-contenteditable]');
  diag?.push(`At timeout: found ${shareBoxes.length} share-creation elements in DOM/ShadowRoots`);
  const qlEditors = deepQuerySelectorAll('.ql-editor');
  diag?.push(`At timeout: found ${qlEditors.length} .ql-editor elements in DOM/ShadowRoots`);
  const allContentEditables = deepQuerySelectorAll('[contenteditable="true"]');
  diag?.push(`At timeout: found ${allContentEditables.length} contenteditable="true" elements in DOM/ShadowRoots`);

  // Count shadow roots
  let shadowCount = 0;
  try {
    for (const el of document.querySelectorAll('*')) {
      if (el.shadowRoot) shadowCount++;
    }
  } catch {}
  diag?.push(`Shadow roots detected on page: ${shadowCount}`);

  return null;
}

/**
 * Injects formatted text into a contenteditable editor and syncs with React & Quill.
 */
function fillEditor(editor: HTMLElement, formattedText: string, diag?: string[]): boolean {
  diag?.push(`Executing fillEditor on <${editor.tagName} class="${editor.className}">`);

  if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
    editor.value = formattedText;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    diag?.push('Filled HTML input/textarea element directly.');
    return true;
  }

  // Format lines into Quill paragraph structure
  const lines = formattedText.split('\n');
  const escapedHtml = lines
    .map((line) => {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped.length > 0 ? escaped : '<br>'}</p>`;
    })
    .join('');

  // 1. Focus the editor element
  editor.focus();
  diag?.push(`Editor focused. Active element: <${document.activeElement?.tagName} class="${document.activeElement?.className}">`);

  // Check if Quill instance is accessible directly on element or container
  try {
    const qlContainer = editor.closest('.ql-container') as HTMLElement | null;
    const quillInstance = (editor as any).__quill || (qlContainer as any)?.__quill;
    if (quillInstance && typeof quillInstance.clipboard?.dangerouslyPasteHTML === 'function') {
      quillInstance.clipboard.dangerouslyPasteHTML(escapedHtml);
      diag?.push('Populated via Quill instance dangerouslyPasteHTML');
    } else if (quillInstance && typeof quillInstance.setText === 'function') {
      quillInstance.setText(formattedText);
      diag?.push('Populated via Quill instance setText');
    }
  } catch (e) {
    diag?.push(`Quill direct instance note: ${String(e)}`);
  }

  // 2. Select existing contents in editor
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch (e) {
    diag?.push(`selectNodeContents note: ${String(e)}`);
  }

  // 3. Try DataTransfer paste event (Quill clipboard module handler)
  if (!editor.textContent || editor.textContent.trim().length < 5) {
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', formattedText);
      dt.setData('text/html', escapedHtml);
      const pasteEvt = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clipboardData: dt
      });
      editor.dispatchEvent(pasteEvt);
      const curLen = (editor.textContent || '').trim().length;
      diag?.push(`DataTransfer paste event dispatched (content length: ${curLen})`);
    } catch (e) {
      diag?.push(`ClipboardEvent paste note: ${String(e)}`);
    }
  }

  // 4. If editor is still empty, try document.execCommand('insertText')
  if (!editor.textContent || editor.textContent.trim().length < 5) {
    try {
      editor.focus();
      document.execCommand('selectAll', false, undefined);
      const inserted = document.execCommand('insertText', false, formattedText);
      const curLen = (editor.textContent || '').trim().length;
      diag?.push(`execCommand('insertText') returned ${inserted} (content length: ${curLen})`);
    } catch (e) {
      diag?.push(`execCommand('insertText') note: ${String(e)}`);
    }
  }

  // 5. If still empty, try document.execCommand('insertHTML')
  if (!editor.textContent || editor.textContent.trim().length < 5) {
    try {
      editor.focus();
      document.execCommand('selectAll', false, undefined);
      const inserted = document.execCommand('insertHTML', false, escapedHtml);
      const curLen = (editor.textContent || '').trim().length;
      diag?.push(`execCommand('insertHTML') returned ${inserted} (content length: ${curLen})`);
    } catch (e) {
      diag?.push(`execCommand('insertHTML') note: ${String(e)}`);
    }
  }

  // 6. Direct innerHTML if still empty
  if (!editor.textContent || editor.textContent.trim().length < 5) {
    editor.innerHTML = escapedHtml;
    const curLen = (editor.textContent || '').trim().length;
    diag?.push(`Set innerHTML directly (content length: ${curLen})`);
  }

  // 7. Fire React / Quill / Ember input events
  try {
    editor.dispatchEvent(
      new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: formattedText
      })
    );
    editor.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    editor.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ', code: 'Space' }));
    editor.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ', code: 'Space' }));
    diag?.push('Dispatched beforeinput, input, change, and key events');
  } catch (e) {
    diag?.push(`Event dispatch note: ${String(e)}`);
  }

  // 8. Remove Quill placeholder class and hide placeholder text
  editor.classList.remove('ql-blank');
  let parent: HTMLElement | null = editor.parentElement;
  while (parent && parent !== document.body) {
    parent.classList.remove('ql-blank');
    parent = parent.parentElement;
  }

  // 9. Enable LinkedIn's Post button
  try {
    const postButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'button.share-actions__primary-action, .share-creation-state button.artdeco-button--primary'
      )
    );
    for (const pb of postButtons) {
      pb.removeAttribute('disabled');
      pb.classList.remove('artdeco-button--disabled');
      pb.setAttribute('aria-disabled', 'false');
    }
    diag?.push(`Found and enabled ${postButtons.length} post button(s).`);
  } catch (e) {
    diag?.push(`Enable post button note: ${String(e)}`);
  }

  // 10. Place cursor at the end
  try {
    const selection = window.getSelection();
    const endRange = document.createRange();
    endRange.selectNodeContents(editor);
    endRange.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(endRange);
  } catch {}

  const finalLength = (editor.textContent || '').trim().length;
  diag?.push(`Final check: editor text length is ${finalLength}`);
  return finalLength > 0;
}

/**
 * Finds LinkedIn's active "Create a post" Quill editor and inserts formatted text.
 * If the Create Post modal is not open, it clicks "Start a post" and autofills once open.
 * Strictly avoids comment sections. Returns full diagnostic trace on failure.
 */
async function insertTextIntoLinkedIn(formattedText: string): Promise<{ success: boolean; error?: string }> {
  const diag: string[] = [];
  diag.push(`Requested insert of ${formattedText.length} characters.`);

  // 1. Check if Create Post modal is already open
  let editor = getOpenCreatePostEditor(diag);

  // 2. If not open, click "Start a post" and wait for the modal to mount
  if (!editor) {
    diag.push('Create Post modal not currently open. Attempting to open it...');
    const clicked = clickStartPostButton(diag);
    if (clicked) {
      editor = await waitForEditor(6000, diag);
    } else {
      // If clicking failed, still try polling in case it was opened by user or in transition
      editor = await waitForEditor(3000, diag);
    }
  }

  // 3. If still not found, return error with full diagnostic trace
  if (!editor) {
    const dialogsOnPage = Array.from(document.querySelectorAll('[role="dialog"], .artdeco-modal, .share-creation-state'))
      .map((d) => `<${d.tagName} class="${d.className}">`)
      .join(', ');
    diag.push(`Containers found on page: ${dialogsOnPage || 'None'}`);

    const errorReport = [
      'Could not locate the LinkedIn "Create a post" editor field.',
      '',
      '👉 Tip: Click "Start a post" on your LinkedIn feed first, then click "Retry Insert" below!',
      '',
      'Diagnostic Trace:',
      ...diag.map((step, idx) => `${idx + 1}. ${step}`)
    ].join('\n');

    return {
      success: false,
      error: errorReport
    };
  }

  // 4. Fill the editor
  try {
    const ok = fillEditor(editor, formattedText, diag);
    if (!ok) {
      const errorReport = [
        'Editor element was found, but content could not be populated.',
        '',
        'Diagnostic Trace:',
        ...diag.map((step, idx) => `${idx + 1}. ${step}`)
      ].join('\n');

      return {
        success: false,
        error: errorReport
      };
    }
    return { success: true };
  } catch (err) {
    diag.push(`Exception in fillEditor: ${String(err)}`);
    const errorReport = [
      `Insert operation threw an error: ${String(err)}`,
      '',
      'Diagnostic Trace:',
      ...diag.map((step, idx) => `${idx + 1}. ${step}`)
    ].join('\n');

    return { success: false, error: errorReport };
  }
}

// ─── Window message listener (embedded iframe path) ───────────────────────────
window.addEventListener('message', async (event) => {
  const isFromOurExtension =
    (formatterFrame && event.source === formatterFrame.contentWindow) ||
    (typeof event.origin === 'string' && event.origin.includes(chrome.runtime.id));

  if (!isFromOurExtension) return;

  if (event.data?.type === 'close-formatter') {
    closeFormatterPanel();
    return;
  }

  // Insert formatted text into LinkedIn composer (called from embedded iframe)
  if (event.data?.type === 'insert-to-linkedin' && typeof event.data.text === 'string') {
    const result = await insertTextIntoLinkedIn(event.data.text);
    formatterFrame?.contentWindow?.postMessage(
      result.success
        ? { type: 'insert-result', success: true }
        : { type: 'insert-result', success: false, error: result.error },
      '*'
    );
    if (result.success) {
      setTimeout(() => closeFormatterPanel(), 400);
    }
    return;
  }

  // Fallback clipboard copy from parent window (when navigator.clipboard is blocked in iframe)
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

// ─── Chrome runtime message listener (standalone popup path) ──────────────────
chrome.runtime.onMessage.addListener((message: { type?: string; text?: string }, _sender, sendResponse) => {
  if (message.type === 'show-formatter-panel' && typeof message.text === 'string') {
    showFormatterPanel(message.text);
    sendResponse({ success: true });
    return false;
  }

  // Insert formatted text into LinkedIn composer (called from standalone popup)
  if (message.type === 'insert-to-linkedin' && typeof message.text === 'string') {
    insertTextIntoLinkedIn(message.text).then((result) => {
      sendResponse(result);
    });
    return true; // Keep message port open for async response
  }

  sendResponse({ success: false });
  return false;
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
ensureButton();
new MutationObserver(ensureButton).observe(document.documentElement, { childList: true, subtree: true });
