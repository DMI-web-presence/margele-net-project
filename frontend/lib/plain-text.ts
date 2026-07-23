const namedHtmlEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '...',
  laquo: '"',
  lt: '<',
  mdash: '-',
  nbsp: ' ',
  ndash: '-',
  quot: '"',
  raquo: '"',
  bull: '*',
  abreve: '\u0103',
  Abreve: '\u0102',
  acirc: '\u00e2',
  Acirc: '\u00c2',
  icirc: '\u00ee',
  Icirc: '\u00ce',
  scomma: '\u0219',
  Scomma: '\u0218',
  scedil: '\u015f',
  Scedil: '\u015e',
  tcomma: '\u021b',
  Tcomma: '\u021a',
  tcedil: '\u0163',
  Tcedil: '\u0162',
};

export function toPlainText(value: string | null | undefined) {
  if (!value) return '';

  let text = String(value);

  // Legacy descriptions can contain encoded tags, sometimes more than once.
  for (let pass = 0; pass < 2; pass += 1) {
    const decoded = decodeHtmlEntities(text);
    if (decoded === text) break;
    text = decoded;
  }

  return text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|hr)\b[^>]*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const hexadecimal = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);

      if (
        Number.isInteger(codePoint) &&
        codePoint > 0 &&
        codePoint <= 0x10ffff &&
        !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return String.fromCodePoint(codePoint);
      }

      return match;
    }

    return namedHtmlEntities[entity] ?? namedHtmlEntities[entity.toLowerCase()] ?? match;
  });
}
