export type KeyboardLanguage = 'en' | 'es' | 'ta';

const KEYBOARD_LANGUAGE_CODES: Record<KeyboardLanguage, string[]> = {
  en: ['en', 'english'],
  es: ['es', 'spanish', 'español', 'espanol'],
  ta: ['ta', 'tamil', 'தமிழ்'],
};

export function resolveKeyboardLanguage(language: string): KeyboardLanguage {
  const lower = language.trim().toLowerCase();
  for (const [layout, codes] of Object.entries(KEYBOARD_LANGUAGE_CODES) as [
    KeyboardLanguage,
    string[],
  ][]) {
    if (codes.some((code) => code === lower)) {
      return layout;
    }
  }
  return 'en';
}

export const LATIN_ROWS: Record<'en' | 'es', string[][]> = {
  en: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ],
  es: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'ñ', 'm'],
  ],
};

export const COMMON_PUNCTUATION = ['.', ',', '?', '!'];

export const TAMIL_VOWELS = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'] as const;

export const TAMIL_CONSONANTS = [
  'க',
  'ங',
  'ச',
  'ஞ',
  'ட',
  'ண',
  'த',
  'ந',
  'ப',
  'ம',
  'ய',
  'ர',
  'ல',
  'வ',
  'ழ',
  'ள',
  'ற',
  'ன',
] as const;

const TAMIL_VOWEL_SIGNS: Record<(typeof TAMIL_VOWELS)[number], string> = {
  அ: '',
  ஆ: 'ா',
  இ: 'ி',
  ஈ: 'ீ',
  உ: 'ு',
  ஊ: 'ூ',
  எ: 'ெ',
  ஏ: 'ே',
  ஐ: 'ை',
  ஒ: 'ொ',
  ஓ: 'ோ',
  ஔ: 'ௌ',
};

export function removeLastGrapheme(text: string, language: string): string {
  if (!text) return '';
  const locale = resolveKeyboardLanguage(language) === 'ta' ? 'ta' : 'en';
  if (typeof Intl.Segmenter !== 'undefined') {
    const segments = [
      ...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text),
    ];
    return segments
      .slice(0, -1)
      .map((s) => s.segment)
      .join('');
  }
  return [...text].slice(0, -1).join('');
}

export function composeTamilSyllable(consonant: string, vowel: string): string {
  const sign = TAMIL_VOWEL_SIGNS[vowel as (typeof TAMIL_VOWELS)[number]];
  if (sign === undefined) {
    return vowel;
  }
  if (!sign) {
    return consonant;
  }
  return consonant + sign;
}
