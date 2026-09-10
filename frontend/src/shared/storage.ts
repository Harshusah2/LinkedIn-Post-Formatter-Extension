import { DEFAULT_TEMPLATES, TemplateItem } from './constants';

const templatesKey = 'linkedin-formatter.templates.v2';
const legacyTemplatesKey = 'linkedin-formatter.templates';
const pendingTextKey = 'linkedin-formatter.pending-text';
const themeKey = 'linkedin-formatter.theme';

export async function loadTemplates(): Promise<TemplateItem[]> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      const result = await chrome.storage.sync.get([templatesKey, legacyTemplatesKey]);
      if (Array.isArray(result[templatesKey]) && result[templatesKey].length > 0) {
        return result[templatesKey] as TemplateItem[];
      }
      // Check legacy format
      if (Array.isArray(result[legacyTemplatesKey]) && result[legacyTemplatesKey].length > 0) {
        const legacy: string[] = result[legacyTemplatesKey];
        return legacy.map((content, idx) => ({
          id: `legacy-${idx}`,
          title: content.split('\n')[0].slice(0, 24) || `Template ${idx + 1}`,
          category: 'Custom',
          content
        }));
      }
    }
  } catch (error) {
    console.warn('[Storage] Error loading templates from chrome.storage:', error);
  }

  // Fallback to local storage or defaults
  try {
    const raw = localStorage.getItem(templatesKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return DEFAULT_TEMPLATES;
}

export async function saveTemplate(item: TemplateItem, limit: number): Promise<TemplateItem[]> {
  const current = await loadTemplates();
  const next = [item, ...current.filter((t) => t.id !== item.id && t.content !== item.content)].slice(0, limit);

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ [templatesKey]: next });
    }
  } catch (error) {
    console.warn('[Storage] Error saving templates to sync:', error);
  }

  try {
    localStorage.setItem(templatesKey, JSON.stringify(next));
  } catch {}

  return next;
}

export async function deleteTemplate(id: string): Promise<TemplateItem[]> {
  const current = await loadTemplates();
  const next = current.filter((t) => t.id !== id);

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ [templatesKey]: next });
    }
  } catch {}

  try {
    localStorage.setItem(templatesKey, JSON.stringify(next));
  } catch {}

  return next;
}

export async function loadPendingText(): Promise<string> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get(pendingTextKey);
      return typeof result[pendingTextKey] === 'string' ? result[pendingTextKey] : '';
    }
  } catch {}
  return localStorage.getItem(pendingTextKey) || '';
}

export async function savePendingText(text: string): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [pendingTextKey]: text });
      return;
    }
  } catch {}
  localStorage.setItem(pendingTextKey, text);
}

export async function clearPendingText(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove(pendingTextKey);
      return;
    }
  } catch {}
  localStorage.removeItem(pendingTextKey);
}

/**
 * Load saved theme preference.
 * Reads from localStorage synchronously for instant first render,
 * then chrome.storage.sync is used for cross-device persistence via saveTheme.
 */
export function loadSavedTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return 'light';
}

/**
 * Persist theme to both chrome.storage.sync (cross-device) and
 * localStorage (instant read on next open without waiting for async storage).
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  // Write to localStorage for synchronous reads
  try {
    localStorage.setItem(themeKey, theme);
  } catch {}
  // Write to chrome.storage.sync for cross-device persistence
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({ [themeKey]: theme }).catch(() => {});
    }
  } catch {}
}

/**
 * Load theme from chrome.storage.sync and update localStorage cache.
 * Call this on startup to pick up the synced preference.
 */
export async function syncThemeFromCloud(): Promise<'light' | 'dark'> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      const result = await chrome.storage.sync.get(themeKey);
      const synced = result[themeKey];
      if (synced === 'dark' || synced === 'light') {
        // Update localStorage cache so next synchronous read is correct
        try { localStorage.setItem(themeKey, synced); } catch {}
        return synced;
      }
    }
  } catch {}
  return loadSavedTheme();
}
