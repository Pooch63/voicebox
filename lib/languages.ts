export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'tl', label: 'Tagalog', nativeLabel: 'Tagalog' },
];

export function formatLanguageOption(lang: LanguageOption): string {
  return `${lang.nativeLabel} (${lang.label})`;
}

export function getLanguageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.nativeLabel ?? code;
}

export function formatLanguageForInput(codeOrName: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === codeOrName);
  return lang ? formatLanguageOption(lang) : codeOrName;
}

export function resolveLanguageInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'en';

  const lower = trimmed.toLowerCase();
  const match = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.code.toLowerCase() === lower ||
      l.label.toLowerCase() === lower ||
      l.nativeLabel.toLowerCase() === lower ||
      formatLanguageOption(l).toLowerCase() === lower,
  );
  return match?.code ?? trimmed;
}
