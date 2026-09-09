chrome.runtime.onMessage.addListener((message: { type?: string; text?: string }, sender) => {
  if (message.type !== 'open-formatter' || typeof message.text !== 'string') return;
  const targetTabId = sender.tab?.id;
  const text = message.text;
  if (typeof targetTabId !== 'number' || typeof text !== 'string') return;

  void (async () => {
    await chrome.tabs.sendMessage(targetTabId, { type: 'show-formatter-panel', text });
  })().catch((error: unknown) => {
    console.error('[LinkedIn Post Formatter] Failed to open formatter:', error);
  });
});




