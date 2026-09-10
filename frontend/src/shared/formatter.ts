export type StyleKey =
  | 'plain'
  | 'bold'
  | 'italic'
  | 'boldItalic'
  | 'serifBold'
  | 'serifItalic'
  | 'mono'
  | 'doubleStruck'
  | 'script'
  | 'underline'
  | 'strike';

export interface StyleOption {
  key: StyleKey;
  label: string;
  preview: string;
  category: 'emphasis' | 'serif' | 'creative' | 'decoration';
}

export const STYLE_OPTIONS: StyleOption[] = [
  { key: 'plain', label: 'Plain', preview: 'Normal', category: 'emphasis' },
  { key: 'bold', label: 'Bold', preview: '𝗕𝗼𝗹𝗱', category: 'emphasis' },
  { key: 'italic', label: 'Italic', preview: '𝘐𝘵𝘢𝘭𝘪𝘤', category: 'emphasis' },
  { key: 'boldItalic', label: 'Bold Italic', preview: '𝘽𝙤𝙡𝙙 𝙄𝙩', category: 'emphasis' },
  { key: 'serifBold', label: 'Serif Bold', preview: '𝐒𝐞𝐫𝐢𝐟 𝐁', category: 'serif' },
  { key: 'serifItalic', label: 'Serif Italic', preview: '𝑆𝑒𝑟𝑖𝑓 𝐼', category: 'serif' },
  { key: 'mono', label: 'Monospace', preview: '𝙼𝚘𝚗𝚘', category: 'creative' },
  { key: 'doubleStruck', label: 'Outline', preview: '𝕆𝕦𝕥𝕝𝕚𝕟𝕖', category: 'creative' },
  { key: 'script', label: 'Script', preview: '𝒮𝒸𝓇𝒾𝓅𝓉', category: 'creative' },
  { key: 'underline', label: 'Underline', preview: 'U̲n̲d̲e̲r̲', category: 'decoration' },
  { key: 'strike', label: 'Strikethrough', preview: 'S̶t̶r̶i̶k̶e̶', category: 'decoration' }
];

// Helper to create character mappings from start code points
function createRangeMap(upperStart: number, lowerStart: number, digitStart?: number): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < 26; i++) {
    map[String.fromCharCode(65 + i)] = String.fromCodePoint(upperStart + i);
    map[String.fromCharCode(97 + i)] = String.fromCodePoint(lowerStart + i);
  }
  if (digitStart !== undefined) {
    for (let i = 0; i < 10; i++) {
      map[String.fromCharCode(48 + i)] = String.fromCodePoint(digitStart + i);
    }
  }
  return map;
}

// Explicit Double-Struck (Outline) map with all 26 letters and 10 digits
const doubleStruckUpper = [...'𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ'];
const doubleStruckLower = [...'𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫'];
const doubleStruckDigits = [...'𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡'];
const doubleStruckMap: Record<string, string> = {};
doubleStruckUpper.forEach((char, i) => { doubleStruckMap[String.fromCharCode(65 + i)] = char; });
doubleStruckLower.forEach((char, i) => { doubleStruckMap[String.fromCharCode(97 + i)] = char; });
doubleStruckDigits.forEach((char, i) => { doubleStruckMap[String.fromCharCode(48 + i)] = char; });

// Complete 26-character Script (Calligraphic) uppercase and lowercase sets (including Letterlike Symbols)
const scriptUpper = [
  '\u{1D49C}', // A
  '\u{212C}',  // B (ℬ)
  '\u{1D49E}', // C
  '\u{1D49F}', // D
  '\u{2130}',  // E (ℰ)
  '\u{2131}',  // F (ℱ)
  '\u{1D4A2}', // G
  '\u{210B}',  // H (ℋ)
  '\u{2110}',  // I (ℐ)
  '\u{1D4A5}', // J
  '\u{1D4A6}', // K
  '\u{2112}',  // L (ℒ)
  '\u{2133}',  // M (ℳ)
  '\u{1D4A9}', // N
  '\u{1D4AA}', // O
  '\u{1D4AB}', // P
  '\u{1D4AC}', // Q
  '\u{211B}',  // R (ℛ)
  '\u{1D4AE}', // S
  '\u{1D4AF}', // T
  '\u{1D4B0}', // U
  '\u{1D4B1}', // V
  '\u{1D4B2}', // W
  '\u{1D4B3}', // X
  '\u{1D4B4}', // Y
  '\u{1D4B5}'  // Z
];
const scriptLower = [...'𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏'];
const scriptMap: Record<string, string> = {};
scriptUpper.forEach((char, i) => { scriptMap[String.fromCharCode(65 + i)] = char; });
scriptLower.forEach((char, i) => { scriptMap[String.fromCharCode(97 + i)] = char; });

// Serif Italic with Unicode hole fixed: 'h' must be U+210E (Planck constant ℎ)
const serifItalicMap = createRangeMap(0x1D434, 0x1D44E);
serifItalicMap['h'] = '\u210E';

const styleMaps: Record<Exclude<StyleKey, 'plain' | 'underline' | 'strike'>, Record<string, string>> = {
  bold: createRangeMap(0x1D5D4, 0x1D5EE, 0x1D7EC),       // Sans-serif Bold
  italic: createRangeMap(0x1D608, 0x1D622),              // Sans-serif Italic
  boldItalic: createRangeMap(0x1D63C, 0x1D656),          // Sans-serif Bold Italic
  serifBold: createRangeMap(0x1D400, 0x1D41A, 0x1D7CE),  // Serif Bold
  serifItalic: serifItalicMap,                           // Serif Italic (with U+210E fix)
  mono: createRangeMap(0x1D670, 0x1D68A, 0x1D7F6),       // Monospace
  doubleStruck: doubleStruckMap,                         // Outline
  script: scriptMap                                      // Complete Script (all 26 letters)
};

// Inverted lookup map to cleanly convert all styled Unicode back to plain ASCII
// without stripping accents or corrupting emojis!
const reverseStyleMap: Record<string, string> = {};
for (const map of Object.values(styleMaps)) {
  for (const [ascii, styled] of Object.entries(map)) {
    reverseStyleMap[styled] = ascii;
  }
}

/**
 * Checks if a character is an emoji, variation selector, or zero-width joiner
 * to prevent attaching combining underline/strikethrough marks to emojis.
 */
function isEmojiOrSymbol(char: string): boolean {
  return /[\p{Extended_Pictographic}\p{Emoji_Component}\u200D\uFE0F]/u.test(char);
}

/**
 * Reverts any unicode formatted text back to standard plain ASCII.
 * Unlike normalize('NFKD'), this custom unformatter:
 * 1. Safely preserves accented letters (Café, Résumé, Über, Señor).
 * 2. Safely preserves all emojis and keycap numbers (🚀, 🔹, 1️⃣).
 * 3. Removes combining underlines (\u0332) and strikethroughs (\u0336).
 * 4. Reverse-maps all mathematical bold/italic/script characters back to plain letters.
 */
export function unformatText(input: string): string {
  // Strip underline and strikethrough combining marks only
  const withoutCombining = input.replace(/[\u0332\u0336]/g, '');

  // Reverse map all styled Unicode letters by code point
  return Array.from(withoutCombining)
    .map((char) => reverseStyleMap[char] || char)
    .join('');
}

/**
 * Format string with a specified style.
 * Uses code-point iteration (Array.from) to prevent splitting UTF-16 surrogate pairs.
 */
export function formatText(input: string, style: StyleKey): string {
  // Always unformat any existing styled Unicode first so styles cleanly replace each other
  const cleanInput = unformatText(input);

  if (style === 'plain') {
    return cleanInput;
  }

  if (style === 'underline') {
    return Array.from(cleanInput)
      .map((char) => {
        // Do not add combining underline to newlines, whitespace, or emojis
        if (char === '\n' || char === '\r' || char === ' ' || isEmojiOrSymbol(char)) {
          return char;
        }
        return `${char}\u0332`;
      })
      .join('');
  }

  if (style === 'strike') {
    return Array.from(cleanInput)
      .map((char) => {
        // Do not add combining strikethrough to newlines, whitespace, or emojis
        if (char === '\n' || char === '\r' || char === ' ' || isEmojiOrSymbol(char)) {
          return char;
        }
        return `${char}\u0336`;
      })
      .join('');
  }

  const map = styleMaps[style];
  return Array.from(cleanInput)
    .map((char) => map[char] || char)
    .join('');
}

/**
 * Adjusts selection index so it never cuts in the middle of a UTF-16 surrogate pair
 */
function clampToSurrogateBoundary(text: string, index: number): number {
  if (index > 0 && index < text.length) {
    const prev = text.charCodeAt(index - 1);
    const curr = text.charCodeAt(index);
    if (prev >= 0xd800 && prev <= 0xdbff && curr >= 0xdc00 && curr <= 0xdfff) {
      return index - 1;
    }
  }
  return index;
}

/**
 * Apply styling to either the selected portion or the entire text
 */
export function formatSelectionOrAll(
  fullText: string,
  selStart: number,
  selEnd: number,
  style: StyleKey
): { nextText: string; newStart: number; newEnd: number } {
  const safeStart = clampToSurrogateBoundary(fullText, selStart);
  const safeEnd = clampToSurrogateBoundary(fullText, selEnd);

  if (safeStart === safeEnd) {
    // No selection: apply to entire text
    const formatted = formatText(fullText, style);
    return {
      nextText: formatted,
      newStart: 0,
      newEnd: formatted.length
    };
  }

  const before = fullText.slice(0, safeStart);
  const selected = fullText.slice(safeStart, safeEnd);
  const after = fullText.slice(safeEnd);

  const formattedSelection = formatText(selected, style);
  const nextText = `${before}${formattedSelection}${after}`;

  return {
    nextText,
    newStart: safeStart,
    newEnd: safeStart + formattedSelection.length
  };
}

/**
 * List bullets helper
 */
export const BULLET_STYLES = [
  { icon: '🔹', label: 'Blue Diamond' },
  { icon: '•', label: 'Classic Bullet' },
  { icon: '📌', label: 'Pin Marker' },
  { icon: '🚀', label: 'Rocket' },
  { icon: '✅', label: 'Checkmark' },
  { icon: '👉', label: 'Pointer' },
  { icon: 'num', label: '1️⃣ 2️⃣ 3️⃣' }
];

// Regex to match existing list bullets (emojis, standard bullets, numbered keycaps / digits)
const BULLET_PREFIX_REGEX = /^(\s*)(?:[•\-\*\+🔹📌🚀✅👉]|(?:\d+|[1-9]|10)(?:\uFE0F?\u20E3|\.)|🔟)\s*/u;

export function applyBulletToList(
  fullText: string,
  selStart: number,
  selEnd: number,
  bulletIcon: string
): { nextText: string; newStart: number; newEnd: number } {
  if (!fullText) {
    const prefix = bulletIcon === 'num' ? '1️⃣ ' : `${bulletIcon} `;
    return { nextText: prefix, newStart: prefix.length, newEnd: prefix.length };
  }

  // Sanitize & clamp bounds to surrogate boundaries
  const safeStart = clampToSurrogateBoundary(fullText, Math.max(0, Math.min(selStart, fullText.length)));
  const safeEnd = clampToSurrogateBoundary(fullText, Math.max(0, Math.min(selEnd, fullText.length)));
  let start = safeStart;
  let end = safeEnd;
  if (start > end) {
    [start, end] = [end, start];
  }

  // Determine line boundaries around the cursor or selection
  const lineStartIndex = fullText.lastIndexOf('\n', Math.max(0, start - 1));
  const lineStart = lineStartIndex === -1 ? 0 : lineStartIndex + 1;

  // If selection ends right at a newline character, don't include the following empty line
  const effectiveEnd = (end > start && fullText[end - 1] === '\n') ? end - 1 : end;
  const lineEndIndex = fullText.indexOf('\n', effectiveEnd);
  const lineEnd = lineEndIndex === -1 ? fullText.length : lineEndIndex;

  const before = fullText.slice(0, lineStart);
  const target = fullText.slice(lineStart, lineEnd);
  const after = fullText.slice(lineEnd);

  const lines = target.split('\n');
  const numberIcons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  // Check if all non-empty lines in target already have this exact bullet (for toggle-off support)
  const isAllSameBullet = lines.every((line) => {
    if (!line.trim()) return true;
    const match = line.match(BULLET_PREFIX_REGEX);
    if (!match) return false;
    const matchedBullet = match[0].trim();
    if (bulletIcon === 'num') {
      return numberIcons.includes(matchedBullet) || /^\d+\.$/.test(matchedBullet);
    }
    return matchedBullet === bulletIcon;
  });

  let deltaLength = 0;

  const bulleted = lines
    .map((line, index) => {
      if (!line.trim()) return line;

      // Extract leading whitespace
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const stripped = line.replace(BULLET_PREFIX_REGEX, '$1');

      if (isAllSameBullet) {
        // Toggle OFF: remove bullet
        const nextLine = stripped;
        deltaLength += nextLine.length - line.length;
        return nextLine;
      } else {
        // Toggle ON or Replace bullet
        const prefix = bulletIcon === 'num'
          ? (numberIcons[index] || `${index + 1}.`)
          : bulletIcon;
        const nextLine = `${indent}${prefix} ${stripped.trimStart()}`;
        deltaLength += nextLine.length - line.length;
        return nextLine;
      }
    })
    .join('\n');

  const nextText = `${before}${bulleted}${after}`;

  let newStart: number;
  let newEnd: number;

  if (start === end) {
    // Single cursor: keep cursor on the line adjusted by the change in length
    newStart = Math.max(lineStart, Math.min(start + deltaLength, lineStart + bulleted.length));
    newEnd = newStart;
  } else {
    // Range selection: keep the affected lines highlighted
    newStart = lineStart;
    newEnd = lineStart + bulleted.length;
  }

  return { nextText, newStart, newEnd };
}

/**
 * Hookify: bold the first line/hook of the post for instant attention
 */
export function hookifyFirstLine(text: string): string {
  const lines = text.split('\n');
  if (lines.length === 0) return text;

  // Find first non-empty line
  const firstIndex = lines.findIndex((l) => l.trim().length > 0);
  if (firstIndex === -1) return text;

  lines[firstIndex] = formatText(lines[firstIndex], 'bold');
  return lines.join('\n');
}

/**
 * Optimizes whitespace for LinkedIn: strips 3+ stacked empty lines down to clean single paragraph breaks
 */
export function cleanExtraLineBreaks(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Real-time post stats
 */
export function calculatePostStats(text: string) {
  const clean = unformatText(text);
  const charCount = Array.from(clean).length;
  const words = clean.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Average reading speed ~ 200 wpm (words per minute)
  const readSeconds = Math.max(1, Math.round((wordCount / 200) * 60));

  // LinkedIn desktop/mobile "see more" cutoff occurs at ~210 characters or line 3
  const lines = text.split('\n');
  const seeMoreCutoffIndex = 210;
  const isPastSeeMore = charCount > seeMoreCutoffIndex;

  return {
    charCount,
    wordCount,
    readSeconds,
    isPastSeeMore,
    lineCount: lines.length
  };
}
