const templatesKey = 'linkedin-formatter.templates';
const pendingTextKey = 'linkedin-formatter.pending-text';

export async function loadTemplates() {
  const result = await chrome.storage.sync.get(templatesKey);
  return Array.isArray(result[templatesKey]) ? result[templatesKey] as string[] : [];
}

export async function saveTemplate(template: string, limit: number) {
  const templates = await loadTemplates();
  const next = [template, ...templates.filter((item) => item !== template)].slice(0, limit);
  await chrome.storage.sync.set({ [templatesKey]: next });
  return next;
}

export async function loadPendingText() {
  const result = await chrome.storage.local.get(pendingTextKey);
  return typeof result[pendingTextKey] === 'string' ? result[pendingTextKey] : '';
}

export async function savePendingText(text: string) {
  await chrome.storage.local.set({ [pendingTextKey]: text });
}

export async function clearPendingText() {
  await chrome.storage.local.remove(pendingTextKey);
}
