'use client';

import { useState } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { formatLanguageForInput, resolveLanguageInput } from '@/lib/languages';
import {
  DEFAULT_SESSION_PREFERENCES,
  type SessionPreferences,
} from '@/lib/sessionPreferences';
import { useAppStore } from '@/store/appStore';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] cursor-pointer">
      <div className="flex-1 min-w-0">
        <span className="block text-lg font-semibold">{label}</span>
        {description && (
          <span className="block text-sm opacity-70 mt-0.5">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--background)]'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function ChoiceInteractionSelector({
  value,
  onChange,
}: {
  value: SessionPreferences['choiceInteraction'];
  onChange: (mode: SessionPreferences['choiceInteraction']) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          { id: 'tap' as const, label: 'Tap choices', desc: 'Tap a button to answer' },
          { id: 'cycle' as const, label: 'Cycle through', desc: 'Space to browse, Enter to confirm' },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`p-4 rounded-2xl text-left transition-all duration-200 border-2 ${
            value === option.id
              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
              : 'border-transparent bg-[var(--surface)] hover:bg-[var(--surface)]/80'
          }`}
        >
          <span className="block text-lg font-bold">{option.label}</span>
          <span className="block text-sm opacity-70 mt-1">{option.desc}</span>
        </button>
      ))}
    </div>
  );
}

function ModeSelector({
  value,
  onChange,
}: {
  value: SessionPreferences['inputMode'];
  onChange: (mode: SessionPreferences['inputMode']) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          { id: 'select' as const, label: 'Tap choices', desc: 'Answer with buttons' },
          { id: 'type' as const, label: 'Type answer', desc: 'Use on-screen keyboard' },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`p-4 rounded-2xl text-left transition-all duration-200 border-2 ${
            value === option.id
              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
              : 'border-transparent bg-[var(--surface)] hover:bg-[var(--surface)]/80'
          }`}
        >
          <span className="block text-lg font-bold">{option.label}</span>
          <span className="block text-sm opacity-70 mt-1">{option.desc}</span>
        </button>
      ))}
    </div>
  );
}

export const SetupScreen = () => {
  const startSession = useAppStore((s) => s.startSession);
  const [prefs, setPrefs] = useState<SessionPreferences>(DEFAULT_SESSION_PREFERENCES);
  const [languageInput, setLanguageInput] = useState(() =>
    formatLanguageForInput(DEFAULT_SESSION_PREFERENCES.language),
  );

  const updatePref = <K extends keyof SessionPreferences>(key: K, value: SessionPreferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'inputMode' && value === 'type') {
        return next;
      }
      if (next.inputMode === 'select' && !next.showImages && !next.showText) {
        if (key === 'showImages' && !value) next.showText = true;
        if (key === 'showText' && !value) next.showImages = true;
      }
      return next;
    });
  };

  const handleStart = () => {
    startSession({
      ...prefs,
      language: resolveLanguageInput(languageInput),
    });
  };

  return (
    <div className="w-full max-w-lg space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">VoiceBack</h1>
        <p className="text-lg opacity-70">
          Set up how you&apos;d like to respond before starting
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 px-1">
          How do you want to answer?
        </h2>
        <ModeSelector
          value={prefs.inputMode}
          onChange={(mode) => updatePref('inputMode', mode)}
        />
      </div>

      {prefs.inputMode === 'select' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 px-1">
            How to pick a choice
          </h2>
          <ChoiceInteractionSelector
            value={prefs.choiceInteraction}
            onChange={(mode) => updatePref('choiceInteraction', mode)}
          />
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 px-1 pt-2">
            Choice button options
          </h2>
          <Toggle
            checked={prefs.showImages}
            onChange={(v) => updatePref('showImages', v)}
            label="Show images"
            description="Display emoji icons on each choice"
          />
          <Toggle
            checked={prefs.showText}
            onChange={(v) => updatePref('showText', v)}
            label="Show text"
            description="Display words on each choice"
          />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 px-1">
          Your language
        </h2>
        <p className="text-sm opacity-60 px-1 -mt-1">
          The caregiver always speaks English. Questions and choices will appear in your language.
        </p>
        <LanguageSelector value={languageInput} onChange={setLanguageInput} />
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="w-full py-6 text-2xl font-bold rounded-3xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        Start Conversation
      </button>
    </div>
  );
};
