const buttonId = 'linkedin-post-formatter-button';
let formatterFrame: HTMLIFrameElement | null = null;

const composerSelectors = ['[contenteditable="true"][role="textbox"]', '[contenteditable="true"]', '.ql-editor'];

function findComposer() {
  for (const selector of composerSelectors) {
    const composer = document.querySelector(selector);
    if (composer instanceof HTMLElement && composer.offsetParent !== null) return composer;
  }
  return null;
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
  if (formatterFrame) return;
  formatterFrame = document.createElement('iframe');
  formatterFrame.src = chrome.runtime.getURL('index.html?embedded=1');
  Object.assign(formatterFrame.style, { position: 'fixed', top: '16px', right: '16px', width: '440px', height: 'calc(100vh - 32px)', zIndex: '2147483647', border: '0', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,.28)', background: '#f5f7fb' });
  document.body.appendChild(formatterFrame);
  formatterFrame.addEventListener('load', () => formatterFrame?.contentWindow?.postMessage({ type: 'composer-text', text }, '*'), { once: true });
}

function ensureButton() {
  if (document.getElementById(buttonId)) return;
  const button = document.createElement('button');
  button.id = buttonId;
  button.type = 'button';
  button.textContent = 'Format';
  Object.assign(button.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999', padding: '10px 14px', borderRadius: '999px', border: 'none', background: '#0a66c2', color: '#fff', fontWeight: '600', cursor: 'pointer' });
  button.addEventListener('click', () => {
    const composer = findComposer();
    chrome.runtime.sendMessage({ type: 'open-formatter', text: composer?.innerText ?? '' }, () => {
      if (chrome.runtime.lastError) console.error('[LinkedIn Post Formatter]', chrome.runtime.lastError.message);
    });
  });
  document.body.appendChild(button);
}

window.addEventListener('message', (event) => {
  if (event.source !== formatterFrame?.contentWindow || event.data?.type !== 'insert-formatted-text') return;
  const composer = findComposer();
  if (composer) insertText(composer, event.data.text);
  formatterFrame?.remove();
  formatterFrame = null;
});

chrome.runtime.onMessage.addListener((message: { type?: string; text?: string }) => {
  if (message.type === 'show-formatter-panel' && typeof message.text === 'string') {
    showFormatterPanel(message.text);
  }
  if (message.type === 'insert-formatted-text' && typeof message.text === 'string') {
    const composer = findComposer();
    if (composer) insertText(composer, message.text);
  }
});

ensureButton();
new MutationObserver(ensureButton).observe(document.documentElement, { childList: true, subtree: true });


