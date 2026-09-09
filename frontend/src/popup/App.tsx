import { useEffect, useMemo, useState } from 'react';
import { formatText, type StyleKey } from '../shared/formatter';
import { clearPendingText, loadPendingText, loadTemplates, saveTemplate } from '../shared/storage';
import { createSampleTemplates, maxTemplates } from '../shared/constants';

const styles: Array<{ key: StyleKey; label: string }> = [
  { key: 'plain', label: 'Plain' }, { key: 'bold', label: 'Bold' }, { key: 'italic', label: 'Italic' },
  { key: 'serifBold', label: 'Serif' }, { key: 'mono', label: 'Mono' }
];

export function App() {
  const [text, setText] = useState('Write your LinkedIn post here...');
  const [style, setStyle] = useState<StyleKey>('plain');
  const [templates, setTemplates] = useState<string[]>(createSampleTemplates);
  const query = new URLSearchParams(window.location.search);
  const embedded = query.get('embedded') === '1';
  const targetTabId = Number(query.get('targetTabId'));

  useEffect(() => {
    const receiveComposerText = (event: MessageEvent<{ type?: string; text?: string }>) => {
      if (event.data?.type === 'composer-text' && typeof event.data.text === 'string') setText(event.data.text);
    };
    window.addEventListener('message', receiveComposerText);
    return () => window.removeEventListener('message', receiveComposerText);
  }, []);
  const formatted = useMemo(() => formatText(text, style), [text, style]);

  useEffect(() => {
    void handleLoadTemplates();
    void loadComposerText();
  }, []);

  async function loadComposerText() {
    const pendingText = await loadPendingText();
    if (pendingText) {
      setText(pendingText);
      await clearPendingText();
    }
  }

  async function handleLoadTemplates() {
    const loaded = await loadTemplates();
    setTemplates(loaded.length > 0 ? loaded : createSampleTemplates);
  }

  async function handleSaveTemplate() {
    const next = await saveTemplate(formatted, maxTemplates);
    setTemplates(next);
  }

  async function handleInsertIntoLinkedIn() {
    if (embedded) {
      window.parent.postMessage({ type: 'insert-formatted-text', text: formatted }, '*');
      return;
    }
    const tabId = Number.isInteger(targetTabId) && targetTabId > 0 ? targetTabId : undefined;
    const tabs = tabId ? [] : await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabId ? { id: tabId } : tabs[0];
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'insert-formatted-text', text: formatted });
    window.close();
  }

  return (
    <div className="app-shell">
      <header className="header"><div><p className="eyebrow">Phase 1 MVP</p><h1>LinkedIn Post Formatter</h1></div><p className="subtitle">Format, preview, copy, and save templates locally.</p></header>
      <section className="panel">
        <label className="label" htmlFor="post-input">Post text</label>
        <textarea id="post-input" className="textarea" value={text} onChange={(event) => setText(event.target.value)} rows={8} />
        <div className="toolbar">{styles.map((item) => <button key={item.key} className={style === item.key ? 'chip chip-active' : 'chip'} onClick={() => setStyle(item.key)} type="button">{item.label}</button>)}</div>
        <div className="preview"><div className="preview-head"><span>Live preview</span><div><button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(formatted)}>Copy</button> <button className="secondary-button" type="button" onClick={handleInsertIntoLinkedIn}>Insert</button></div></div><pre className="preview-box">{formatted}</pre></div>
      </section>
      <section className="panel">
        <div className="section-head"><h2>Saved templates</h2><button className="secondary-button" type="button" onClick={handleLoadTemplates}>Refresh</button></div>
        <div className="template-list">{templates.map((template) => <button key={template} className="template-chip" type="button" onClick={() => setText(template)}>{template}</button>)}</div>
        <button className="primary-button" type="button" onClick={handleSaveTemplate}>Save current preview</button>
      </section>
    </div>
  );
}


