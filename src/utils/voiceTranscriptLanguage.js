const ARABIC_RE = /[\u0600-\u06FF]/;

export function containsArabic(text) {
  return ARABIC_RE.test(text || '');
}

export function shouldLocalizeToEnglish(text, outputLanguage = 'en', detectedLanguage) {
  if (outputLanguage !== 'en') return false;
  const trimmed = (text || '').trim();
  if (!trimmed) return false;
  if (containsArabic(trimmed)) return true;
  if (detectedLanguage && detectedLanguage !== 'en') return true;
  return false;
}
