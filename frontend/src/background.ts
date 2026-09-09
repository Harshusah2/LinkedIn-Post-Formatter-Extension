chrome.runtime.onMessage.addListener(
  (message: { type?: string; text?: string }, sender, sendResponse) => {
    if (message.type !== 'open-formatter' || typeof message.text !== 'string') {
      sendResponse({ status: 'ignored' });
      return false;
    }

    const targetTabId = sender.tab?.id;
    const text = message.text;

    if (typeof targetTabId !== 'number') {
      sendResponse({ status: 'no-tab-id' });
      return false;
    }

    // Forward to tab with async response handling
    chrome.tabs.sendMessage(targetTabId, { type: 'show-formatter-panel', text })
      .then(() => {
        sendResponse({ status: 'ok' });
      })
      .catch((error: unknown) => {
        console.warn('[LinkedIn Post Formatter] Notice: tab not ready or already showing panel', error);
        sendResponse({ status: 'error', message: String(error) });
      });

    return true; // Keep message port open for async sendResponse
  }
);
