'use client';

import { useId } from 'react';
import { SUPPORTED_LANGUAGES, formatLanguageOption } from '@/lib/languages';

interface LanguageSelectorProps {
  value: string;
  onChange: (text: string) => void;
}

export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const listId = useId();

  return (
    <div className="space-y-2">
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Choose or type a language..."
        className="w-full p-4 text-lg rounded-2xl bg-[var(--surface)] border-2 border-transparent focus:border-[var(--primary)] focus:outline-none"
        aria-label="Your language"
      />
      <datalist id={listId}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={formatLanguageOption(lang)} />
        ))}
      </datalist>
      <p className="text-xs opacity-50 px-1">
        Pick from the list or type any language (e.g. Tamil, Русский)
      </p>
    </div>
  );
};
