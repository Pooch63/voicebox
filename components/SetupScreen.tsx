'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { formatLanguageForInput, resolveLanguageInput } from '@/lib/languages';
import {
  DEFAULT_SESSION_PREFERENCES,
  type SessionPreferences,
  getAppMode,
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
          checked ? 'bg-primary-gradient' : 'bg-[var(--background)]'
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

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-start in victim mode
  useEffect(() => {
    if (getAppMode() === 'victim') {
      startSession(DEFAULT_SESSION_PREFERENCES);
    }
  }, [startSession]);

  const steps = useMemo(() => {
    const s = [
      { id: 'mode', title: 'How do you want to answer?' },
      ...(prefs.inputMode === 'select' ? [{ id: 'choices', title: 'Choice settings' }] : []),
      { id: 'language', title: 'Your language' }
    ];
    return s;
  }, [prefs.inputMode]);

  const validStepIndex = Math.min(currentStepIndex, steps.length - 1);
  const currentStep = steps[validStepIndex];

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

  const navigateStep = (direction: 'next' | 'prev') => {
    if (isTransitioning) return;
    
    if (direction === 'next' && validStepIndex === steps.length - 1) {
      handleStart();
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentStepIndex((i) => i + 1);
      } else {
        setCurrentStepIndex((i) => Math.max(0, i - 1));
      }
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">VoiceBack</h1>
        <p className="text-lg opacity-70">
          Set up how you&apos;d like to respond before starting
        </p>
      </div>

      <div className="relative bg-[var(--background)] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[var(--primary)]/5 ring-1 ring-black/5 flex flex-col overflow-hidden">
        
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === validStepIndex ? 'w-8 bg-[var(--primary)]' : 'w-2 bg-[var(--primary)]/20'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm font-medium opacity-50">
            Step {validStepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Form Content Wrapper with transition */}
        <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'} min-h-[220px] flex flex-col justify-center`}>
          {currentStep.id === 'mode' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">{currentStep.title}</h2>
              <ModeSelector
                value={prefs.inputMode}
                onChange={(mode) => updatePref('inputMode', mode)}
              />
            </div>
          )}

          {currentStep.id === 'choices' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">{currentStep.title}</h2>
              <div className="space-y-3">
                <ChoiceInteractionSelector
                  value={prefs.choiceInteraction}
                  onChange={(mode) => updatePref('choiceInteraction', mode)}
                />
                <div className="pt-2 space-y-3">
                  <Toggle
                    checked={prefs.showImages}
                    onChange={(v) => updatePref('showImages', v)}
                    label="Show images"
                    description="Display emoji icons on choices"
                  />
                  <Toggle
                    checked={prefs.showText}
                    onChange={(v) => updatePref('showText', v)}
                    label="Show text"
                    description="Display words on choices"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'language' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">{currentStep.title}</h2>
              <p className="text-sm opacity-60 text-center mb-4">
                The caregiver always speaks English. Questions and choices will appear in your language.
              </p>
              <LanguageSelector value={languageInput} onChange={setLanguageInput} />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-[var(--surface)]">
          <button
            type="button"
            onClick={() => navigateStep('prev')}
            disabled={validStepIndex === 0}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
              validStepIndex === 0 
                ? 'opacity-0 pointer-events-none' 
                : 'hover:bg-[var(--surface)] text-[var(--foreground)] active:scale-95'
            }`}
            aria-label="Previous step"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => navigateStep('next')}
            className={`flex items-center gap-2 px-6 h-12 rounded-full font-bold transition-all duration-200 active:scale-95 text-white shadow-md ${
              validStepIndex === steps.length - 1 
                ? 'bg-primary-gradient shadow-[var(--primary)]/30 hover:scale-[1.02]' 
                : 'bg-[var(--foreground)] hover:bg-[var(--foreground)]/80'
            }`}
          >
            {validStepIndex === steps.length - 1 ? (
              'Start'
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
