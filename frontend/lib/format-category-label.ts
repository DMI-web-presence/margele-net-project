export const formatCategoryLabel = (value: string) => {
  const name = String(value || '').replace(/\s+/g, ' ').trim();
  if (!name) return '';

  const letters = name.replace(/[^A-Za-z\u00C0-\u017F]/g, '');
  const isUppercase = letters.length > 0 && letters === letters.toUpperCase();
  if (!isUppercase) return name;

  const smallWords = new Set(['de', 'din', 'si', 'sau', 'cu', 'pentru', 'la']);

  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
