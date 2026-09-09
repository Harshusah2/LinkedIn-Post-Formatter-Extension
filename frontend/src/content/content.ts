const buttonId = 'linkedin-post-formatter-button';
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

function ensureButton() {
  if (document.getElementById(buttonId)) return;
  const button = document.createElement('button');
  button.id = buttonId;
  button.type = 'button';
  button.textContent = 'Format';
  Object.assign(button.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999', padding: '10px 14px', borderRadius: '999px', border: 'none', background: '#0a66c2', color: '#fff', fontWeight: '600', cursor: 'pointer' });
  button.addEventListener('click', () => {
    const composer = findComposer();
    if (composer) chrome.runtime.sendMessage({ type: 'open-formatter', text: composer.innerText });
  });
  document.body.appendChild(button);
}

chrome.runtime.onMessage.addListener((message: { type?: string; text?: string }) => {
  if (message.type === 'insert-formatted-text' && typeof message.text === 'string') {
    const composer = findComposer();
    if (composer) insertText(composer, message.text);
  }
});

ensureButton();
new MutationObserver(ensureButton).observe(document.documentElement, { childList: true, subtree: true });
