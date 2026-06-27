const SINHALA_RE = /[\u0D80-\u0DFF]/;
const TAMIL_RE = /[\u0B80-\u0BFF]/;

export function detectTextLanguage(text) {
  const value = String(text || '');
  if (SINHALA_RE.test(value)) return 'si';
  if (TAMIL_RE.test(value)) return 'ta';
  return undefined;
}

export function getTextLangProps(text) {
  const lang = detectTextLanguage(text);
  return lang ? { lang } : {};
}
