export const formatCategoryLabel = (value: string) => {
  const name = String(value || '').replace(/\s+/g, ' ').trim();
  if (!name) return '';

  const letters = name.replace(/[^A-Za-z\u00C0-\u017F]/g, '');
  const isUppercase = letters.length > 0 && letters === letters.toUpperCase();
  if (!isUppercase) return name;

  const sentenceCaseName = name.toLocaleLowerCase('ro-RO');
  return sentenceCaseName.charAt(0).toLocaleUpperCase('ro-RO') + sentenceCaseName.slice(1);
};
