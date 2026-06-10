'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Delete, Space } from 'lucide-react';
import {
  COMMON_PUNCTUATION,
  composeTamilSyllable,
  LATIN_ROWS,
  resolveKeyboardLanguage,
  TAMIL_CONSONANTS,
  TAMIL_VOWELS,
  type KeyboardLanguage,
} from '@/lib/keyboardLayouts';

interface OnScreenKeyboardProps {
  language: string;
  disabled?: boolean;
  onInsert: (text: string) => void;
  onBackspace: () => void;
}

function KeyButton({
  label,
  onClick,
  disabled,
  className = '',
  ariaLabel,
}: {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      className={`min-h-[3.25rem] rounded-xl bg-[var(--background)] text-xl font-semibold transition-colors active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--background)]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${className}`}
    >
      {label}
    </button>
  );
}

function LatinKeyboard({
  layout,
  disabled,
  onInsert,
  onBackspace,
}: {
  layout: 'en' | 'es';
  disabled?: boolean;
  onInsert: (text: string) => void;
  onBackspace: () => void;
}) {
  const rows = LATIN_ROWS[layout];

  return (
    <div className="space-y-2">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
        >
          {row.map((key) => (
            <KeyButton
              key={key}
              label={key}
              disabled={disabled}
              onClick={() => onInsert(key)}
              className="text-2xl uppercase"
            />
          ))}
        </div>
      ))}

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${COMMON_PUNCTUATION.length}, minmax(0, 1fr))` }}
      >
        {COMMON_PUNCTUATION.map((symbol) => (
          <KeyButton
            key={symbol}
            label={symbol}
            disabled={disabled}
            onClick={() => onInsert(symbol)}
            className="text-2xl"
          />
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <KeyButton
          label={
            <span className="flex items-center justify-center gap-2 text-lg">
              <Space size={22} />
              Space
            </span>
          }
          ariaLabel="Space"
          disabled={disabled}
          onClick={() => onInsert(' ')}
          className="col-span-1"
        />
        <KeyButton
          label={<Delete size={24} />}
          ariaLabel="Backspace"
          disabled={disabled}
          onClick={onBackspace}
          className="px-6"
        />
      </div>
    </div>
  );
}

function TamilKeyboard({
  disabled,
  onInsert,
  onBackspace,
}: {
  disabled?: boolean;
  onInsert: (text: string) => void;
  onBackspace: () => void;
}) {
  const [pendingConsonant, setPendingConsonant] = useState<string | null>(null);
  const [consonantPage, setConsonantPage] = useState(0);

  const consonantPages = useMemo(() => {
    const pageSize = 9;
    const pages: string[][] = [];
    for (let i = 0; i < TAMIL_CONSONANTS.length; i += pageSize) {
      pages.push(TAMIL_CONSONANTS.slice(i, i + pageSize));
    }
    return pages;
  }, []);

  const handleConsonant = (consonant: string) => {
    setPendingConsonant(consonant);
  };

  const handleVowel = (vowel: string) => {
    if (pendingConsonant) {
      onInsert(composeTamilSyllable(pendingConsonant, vowel));
      setPendingConsonant(null);
      return;
    }
    onInsert(vowel);
  };

  const handlePulli = () => {
    if (pendingConsonant) {
      onInsert(pendingConsonant + '்');
      setPendingConsonant(null);
      return;
    }
    onInsert('்');
  };

  return (
    <div className="space-y-3">
      {pendingConsonant && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/40">
          <span className="text-sm opacity-80">Next letter combines with</span>
          <span className="text-3xl font-bold text-[var(--primary)]">{pendingConsonant}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPendingConsonant(null)}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-[var(--surface)] disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-50">
            Consonants
          </span>
          {consonantPages.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || consonantPage === 0}
                onClick={() => setConsonantPage((p) => p - 1)}
                className="px-3 py-1 text-sm rounded-lg bg-[var(--background)] disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs opacity-50">
                {consonantPage + 1} / {consonantPages.length}
              </span>
              <button
                type="button"
                disabled={disabled || consonantPage === consonantPages.length - 1}
                onClick={() => setConsonantPage((p) => p + 1)}
                className="px-3 py-1 text-sm rounded-lg bg-[var(--background)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {consonantPages[consonantPage].map((consonant) => (
            <KeyButton
              key={consonant}
              label={consonant}
              disabled={disabled}
              onClick={() => handleConsonant(consonant)}
              className={`text-3xl py-4 ${
                pendingConsonant === consonant
                  ? 'ring-2 ring-[var(--primary)] bg-[var(--primary)]/20'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-50 px-1">
          Vowels
        </span>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {TAMIL_VOWELS.map((vowel) => (
            <KeyButton
              key={vowel}
              label={vowel}
              disabled={disabled}
              onClick={() => handleVowel(vowel)}
              className="text-3xl py-4"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <KeyButton
          label="்"
          ariaLabel="Pulli"
          disabled={disabled}
          onClick={handlePulli}
          className="text-3xl"
        />
        {COMMON_PUNCTUATION.map((symbol) => (
          <KeyButton
            key={symbol}
            label={symbol}
            disabled={disabled}
            onClick={() => onInsert(symbol)}
            className="text-2xl"
          />
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <KeyButton
          label={
            <span className="flex items-center justify-center gap-2 text-lg">
              <Space size={22} />
              Space
            </span>
          }
          ariaLabel="Space"
          disabled={disabled}
          onClick={() => onInsert(' ')}
        />
        <KeyButton
          label={<Delete size={24} />}
          ariaLabel="Backspace"
          disabled={disabled}
          onClick={onBackspace}
          className="px-6"
        />
      </div>
    </div>
  );
}

export const OnScreenKeyboard = ({
  language,
  disabled,
  onInsert,
  onBackspace,
}: OnScreenKeyboardProps) => {
  const layout: KeyboardLanguage = resolveKeyboardLanguage(language);

  return (
    <div
      className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--background)]"
      aria-label={`On-screen keyboard (${layout})`}
    >
      {layout === 'ta' ? (
        <TamilKeyboard disabled={disabled} onInsert={onInsert} onBackspace={onBackspace} />
      ) : (
        <LatinKeyboard
          layout={layout}
          disabled={disabled}
          onInsert={onInsert}
          onBackspace={onBackspace}
        />
      )}
    </div>
  );
};
