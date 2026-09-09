export type StyleKey = 'plain' | 'bold' | 'italic' | 'serifBold' | 'mono';

const unicodeMaps: Record<Exclude<StyleKey, 'plain'>, Record<string, string>> = {
  bold: {
    a: '𝗮',
    b: '𝗯',
    c: '𝗰',
    d: '𝗱',
    e: '𝗲',
    f: '𝗳',
    g: '𝗴',
    h: '𝗵',
    i: '𝗶',
    j: '𝗷',
    k: '𝗸',
    l: '𝗹',
    m: '𝗺',
    n: '𝗻',
    o: '𝗼',
    p: '𝗽',
    q: '𝗾',
    r: '𝗿',
    s: '𝘀',
    t: '𝘁',
    u: '𝘂',
    v: '𝘃',
    w: '𝘄',
    x: '𝘅',
    y: '𝘆',
    z: '𝘇'
  },
  italic: {
    a: '𝘢',
    b: '𝘣',
    c: '𝘤',
    d: '𝘥',
    e: '𝘦',
    f: '𝘧',
    g: '𝘨',
    h: '𝘩',
    i: '𝘪',
    j: '𝘫',
    k: '𝘬',
    l: '𝘭',
    m: '𝘮',
    n: '𝘯',
    o: '𝘰',
    p: '𝘱',
    q: '𝘲',
    r: '𝘳',
    s: '𝘴',
    t: '𝘵',
    u: '𝘶',
    v: '𝘷',
    w: '𝘸',
    x: '𝘹',
    y: '𝘺',
    z: '𝘻'
  },
  serifBold: {
    a: '𝐚',
    b: '𝐛',
    c: '𝐜',
    d: '𝐝',
    e: '𝐞',
    f: '𝐟',
    g: '𝐠',
    h: '𝐡',
    i: '𝐢',
    j: '𝐣',
    k: '𝐤',
    l: '𝐥',
    m: '𝐦',
    n: '𝐧',
    o: '𝐨',
    p: '𝐩',
    q: '𝐪',
    r: '𝐫',
    s: '𝐬',
    t: '𝐭',
    u: '𝐮',
    v: '𝐯',
    w: '𝐰',
    x: '𝐱',
    y: '𝐲',
    z: '𝐳'
  },
  mono: {
    a: '𝚊',
    b: '𝚋',
    c: '𝚌',
    d: '𝚍',
    e: '𝚎',
    f: '𝚏',
    g: '𝚐',
    h: '𝚑',
    i: '𝚒',
    j: '𝚓',
    k: '𝚔',
    l: '𝚕',
    m: '𝚖',
    n: '𝚗',
    o: '𝚘',
    p: '𝚙',
    q: '𝚚',
    r: '𝚛',
    s: '𝚜',
    t: '𝚝',
    u: '𝚞',
    v: '𝚟',
    w: '𝚠',
    x: '𝚡',
    y: '𝚢',
    z: '𝚣'
  }
};

export function formatText(input: string, style: StyleKey) {
  if (style === 'plain') {
    return input;
  }

  const map = unicodeMaps[style];
  return input.replace(/[a-z]/gi, (character) => {
    const lower = character.toLowerCase();
    const mapped = map[lower];
    return character === lower ? mapped : mapped.toUpperCase();
  });
}
