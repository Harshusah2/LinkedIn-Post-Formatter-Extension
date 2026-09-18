import { DEFAULT_TEMPLATES, DEFAULT_HASHTAG_SETS, HashtagSet, TemplateItem } from './constants';

const templatesKey = 'linkedin-formatter.templates.v2';
const legacyTemplatesKey = 'linkedin-formatter.templates';
const pendingTextKey = 'linkedin-formatter.pending-text';
const themeKey = 'linkedin-formatter.theme';
const draftsKey = 'linkedin-formatter.drafts';
const hashtagSetsKey = 'linkedin-formatter.hashtag-sets.v1';

export interface DraftItem {
  id: string;
  preview: string;  // first 60 chars of plain text
  text: string;     // full text content
  savedAt: number;  // Date.now() timestamp
}

const MAX_DRAFTS = 5;

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

// ─── POST HISTORY / DRAFTS ──────────────────────────────────────────────────

/**
 * Auto-save the current composer text as a draft.
 * Keeps only the last MAX_DRAFTS (5) entries. Stored in chrome.storage.local.
 */
export async function saveDraft(text: string): Promise<void> {
  if (!text || text.trim().length < 20) return;

  const existing = await loadDrafts();
  const newDraft: DraftItem = {
    id: `draft-${Date.now()}`,
    preview: text.replace(/\n/g, ' ').slice(0, 60).trim(),
    text,
    savedAt: Date.now(),
  };

  // Remove duplicate near-identical drafts (same first 40 chars)
  const deduped = existing.filter(
    (d) => d.text.slice(0, 40) !== text.slice(0, 40)
  );

  const next = [newDraft, ...deduped].slice(0, MAX_DRAFTS);

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [draftsKey]: next });
      return;
    }
  } catch {}
  try { localStorage.setItem(draftsKey, JSON.stringify(next)); } catch {}
}

/** Load saved drafts from chrome.storage.local */
export async function loadDrafts(): Promise<DraftItem[]> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get(draftsKey);
      if (Array.isArray(result[draftsKey])) return result[draftsKey] as DraftItem[];
    }
  } catch {}
  try {
    const raw = localStorage.getItem(draftsKey);
    if (raw) return JSON.parse(raw) as DraftItem[];
  } catch {}
  return [];
}

/** Delete a single draft by id */
export async function deleteDraft(id: string): Promise<DraftItem[]> {
  const current = await loadDrafts();
  const next = current.filter((d) => d.id !== id);
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [draftsKey]: next });
      return next;
    }
  } catch {}
  try { localStorage.setItem(draftsKey, JSON.stringify(next)); } catch {}
  return next;
}

// ─── HASHTAG SETS ────────────────────────────────────────────────────────────

/** Load saved hashtag sets from chrome.storage.sync (cross-device) */
export async function loadHashtagSets(): Promise<HashtagSet[]> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      const result = await chrome.storage.sync.get(hashtagSetsKey);
      if (Array.isArray(result[hashtagSetsKey]) && result[hashtagSetsKey].length > 0) {
        return result[hashtagSetsKey] as HashtagSet[];
      }
    }
  } catch {}
  return DEFAULT_HASHTAG_SETS;
}

/** Save a hashtag set (insert or update by id) */
export async function saveHashtagSet(set: HashtagSet): Promise<HashtagSet[]> {
  const current = await loadHashtagSets();
  const next = [set, ...current.filter((s) => s.id !== set.id)];
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ [hashtagSetsKey]: next });
    }
  } catch {}
  return next;
}

/** Delete a hashtag set by id */
export async function deleteHashtagSet(id: string): Promise<HashtagSet[]> {
  const current = await loadHashtagSets();
  const next = current.filter((s) => s.id !== id);
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ [hashtagSetsKey]: next });
    }
  } catch {}
  return next;
}
