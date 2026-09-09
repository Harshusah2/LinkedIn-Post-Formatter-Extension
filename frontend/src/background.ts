import { savePendingText } from './shared/storage';

chrome.runtime.onMessage.addListener((message: { type?: string; text?: string }) => {
  if (message.type !== 'open-formatter' || typeof message.text !== 'string') return;
  void savePendingText(message.text);
  void chrome.action.openPopup();
});
