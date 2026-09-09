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

// Explicit maps for special mathematical unicode sets
const doubleStruckUpper = '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ';
const doubleStruckLower = '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫';
const doubleStruckDigits = '𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡';
const doubleStruckMap: Record<string, string> = {};
[...doubleStruckUpper].forEach((char, i) => { doubleStruckMap[String.fromCharCode(65 + i)] = char; });
[...doubleStruckLower].forEach((char, i) => { doubleStruckMap[String.fromCharCode(97 + i)] = char; });
[...doubleStruckDigits].forEach((char, i) => { doubleStruckMap[String.fromCharCode(48 + i)] = char; });

const scriptUpper = '𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵';
const scriptLower = '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏';
const scriptMap: Record<string, string> = {};
[...scriptUpper].forEach((char, i) => { scriptMap[String.fromCharCode(65 + i)] = char; });
[...scriptLower].forEach((char, i) => { scriptMap[String.fromCharCode(97 + i)] = char; });

const styleMaps: Record<Exclude<StyleKey, 'plain' | 'underline' | 'strike'>, Record<string, string>> = {
  bold: createRangeMap(0x1D5D4, 0x1D5EE, 0x1D7EC),       // Sans-serif Bold
  italic: createRangeMap(0x1D608, 0x1D622),              // Sans-serif Italic
  boldItalic: createRangeMap(0x1D63C, 0x1D656),          // Sans-serif Bold Italic
  serifBold: createRangeMap(0x1D400, 0x1D41A, 0x1D7CE),  // Serif Bold
  serifItalic: createRangeMap(0x1D434, 0x1D44E),        // Serif Italic
  mono: createRangeMap(0x1D670, 0x1D68A, 0x1D7F6),       // Monospace
  doubleStruck: doubleStruckMap,
  script: scriptMap
};

/**
 * Reverts any unicode formatted text back to standard plain ASCII
 */
export function unformatText(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Format string with a specified style
 */
export function formatText(input: string, style: StyleKey): string {
  if (style === 'plain') {
    return unformatText(input);
  }

  // Normalize first so already styled text gets replaced smoothly
  const cleanInput = unformatText(input);

  if (style === 'underline') {
    return cleanInput
      .split('')
      .map((char) => (char === '\n' || char === '\r' ? char : `${char}\u0332`))
      .join('');
  }

  if (style === 'strike') {
    return cleanInput
      .split('')
      .map((char) => (char === '\n' || char === '\r' ? char : `${char}\u0336`))
      .join('');
  }

  const map = styleMaps[style];
  return cleanInput
    .split('')
    .map((char) => map[char] || char)
    .join('');
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
  if (selStart === selEnd) {
    // No selection: apply to entire text
    const formatted = formatText(fullText, style);
    return {
      nextText: formatted,
      newStart: 0,
      newEnd: formatted.length
    };
  }

  const before = fullText.slice(0, selStart);
  const selected = fullText.slice(selStart, selEnd);
  const after = fullText.slice(selEnd);

  const formattedSelection = formatText(selected, style);
  const nextText = `${before}${formattedSelection}${after}`;

  return {
    nextText,
    newStart: selStart,
    newEnd: selStart + formattedSelection.length
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

export function applyBulletToList(
  fullText: string,
  selStart: number,
  selEnd: number,
  bulletIcon: string
): { nextText: string; newStart: number; newEnd: number } {
  const target = selStart === selEnd ? fullText : fullText.slice(selStart, selEnd);
  const lines = target.split('\n');

  const numberIcons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  const bulleted = lines
    .map((line, index) => {
      if (!line.trim()) return line;
      // Remove any existing leading bullet
      const cleaned = line.replace(/^([•\-\*🔹📌🚀✅👉\d️⃣]+|\d+\.)\s*/u, '');
      const prefix = bulletIcon === 'num'
        ? (numberIcons[index] || `${index + 1}.`)
        : bulletIcon;
      return `${prefix} ${cleaned}`;
    })
    .join('\n');

  if (selStart === selEnd) {
    return { nextText: bulleted, newStart: 0, newEnd: bulleted.length };
  }

  const before = fullText.slice(0, selStart);
  const after = fullText.slice(selEnd);
  const nextText = `${before}${bulleted}${after}`;
  return { nextText, newStart: selStart, newEnd: selStart + bulleted.length };
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
  const charCount = [...clean].length;
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
