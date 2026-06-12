import { useAppStore } from '@/store/appStore';
import { useAudioOutput } from '@/hooks/useAudioOutput';
import { useCallback, useEffect, useState } from 'react';

import { getIconUrl } from '@/lib/icon-lookup';

function ChoiceContent({
  showImages,
  showText,
  emoji, // Keep for backward compatibility if needed, but primarily use iconUrl
  label,
  spoken,
}: {
  showImages: boolean;
  showText: boolean;
  emoji: string;
  label: string;
  spoken: string;
}) {
  const [iconUrl, setIconUrl] = useState<string>('');

  useEffect(() => {
    if (!showImages) return;
    const keyword = label || spoken || 'icon';
    let isActive = true;
    getIconUrl(keyword).then(url => {
      if (isActive && url) setIconUrl(url);
    });
    return () => { isActive = false; };
  }, [showImages, label, spoken]);

  const hasImage = showImages && iconUrl;
  const hasLabel = showText && label;

  return (
    <>
      {hasImage && (
        <img 
          src={iconUrl} 
          alt={label || spoken} 
          className={`${hasLabel ? 'w-16 h-16 mb-3' : 'w-24 h-24'}`} 
        />
      )}
      {!hasImage && showImages && emoji && (
         <span className={`${hasLabel ? 'text-4xl mb-3' : 'text-6xl'}`}>{emoji}</span>
      )}
      {hasLabel && <span className="text-3xl font-bold tracking-wide text-center leading-tight">{label}</span>}
    </>
  );
}

export const ResponseButtons = () => {
  const { responseOptions, appState, sessionPreferences, addConversationTurn, setResponseOptions, setQuestion } = useAppStore();
  const { speak, resumeCaregiverListening } = useAudioOutput();
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const isDisabled = appState === 'listening' || appState === 'processing';
  const isSpeaking = appState === 'speaking';
  const isCycleMode = sessionPreferences?.choiceInteraction === 'cycle';

  const selectOption = useCallback(
    (index: number, spokenText: string) => {
      setActiveButtonIndex(index);
      addConversationTurn('user', spokenText);
      setResponseOptions([]);
      setQuestion('');
      
      if (sessionPreferences?.readOptionsAloud !== false) {
        speak(spokenText);
      } else {
        resumeCaregiverListening();
      }
      setTimeout(() => setActiveButtonIndex(null), 300);
    },
    [addConversationTurn, speak, sessionPreferences?.readOptionsAloud, resumeCaregiverListening, setResponseOptions, setQuestion],
  );

  useEffect(() => {
    setFocusedIndex(0);
    setActiveButtonIndex(null);
  }, [responseOptions]);

  useEffect(() => {
    if (
      !sessionPreferences ||
      sessionPreferences.inputMode !== 'select' ||
      !isCycleMode ||
      responseOptions.length === 0 ||
      isDisabled
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        setFocusedIndex((current) => (current + 1) % responseOptions.length);
        return;
      }

      if (event.code === 'Enter') {
        event.preventDefault();
        const option = responseOptions[focusedIndex];
        if (option) {
          selectOption(focusedIndex, option.spoken);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionPreferences, responseOptions, focusedIndex, isDisabled, isCycleMode, selectOption]);

  if (!sessionPreferences || sessionPreferences.inputMode !== 'select') {
    return null;
  }

  if (responseOptions.length === 0) {
    return null;
  }

  const { showImages, showText } = sessionPreferences;

  return (
    <div className="w-full max-w-2xl mt-8 space-y-4">
      <div
        className="grid grid-cols-2 gap-4"
        aria-live={isCycleMode ? 'polite' : undefined}
      >
        {responseOptions.map((option, index) => {
          const isActive = activeButtonIndex === index;
          const isFocused = isCycleMode && focusedIndex === index;
          const isDimmed = isSpeaking && !isActive && !isFocused;

          const sharedClasses = `
            flex flex-col items-center justify-center p-6 rounded-3xl min-h-[120px]
            transition-all duration-200
            ${isDimmed ? 'opacity-40' : ''}
          `;

          if (isCycleMode) {
            return (
              <div
                key={index}
                aria-label={`${option.label || option.emoji || `Choice ${index + 1}`}${isFocused ? ', selected' : ''}`}
                className={`
                  ${sharedClasses}
                  ${isFocused
                    ? 'scale-[1.03] bg-primary-gradient text-white shadow-lg shadow-[var(--primary)]/40 ring-4 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]'
                    : 'scale-[0.97] bg-[var(--surface)] text-[var(--foreground)] opacity-50'
                  }
                  ${isActive ? 'scale-95 shadow-inner' : ''}
                `}
              >
                <ChoiceContent
                  showImages={showImages}
                  showText={showText}
                  emoji={option.emoji}
                  label={option.label}
                  spoken={option.spoken}
                />
              </div>
            );
          }

          return (
            <button
              key={index}
              onClick={() => selectOption(index, option.spoken)}
              disabled={isDisabled}
              className={`
                ${sharedClasses} shadow-sm
                ${isActive
                  ? 'scale-95 bg-primary-gradient text-white shadow-inner'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--foreground)]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
                <ChoiceContent
                  showImages={showImages}
                  showText={showText}
                  emoji={option.emoji}
                  label={option.label}
                  spoken={option.spoken}
                />
            </button>
          );
        })}
      </div>

      {isCycleMode && (
        <p className="text-center text-sm opacity-60">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] font-mono text-xs">Space</kbd>{' '}
          to cycle choices · Caregiver presses{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] font-mono text-xs">Enter</kbd>{' '}
          to confirm
        </p>
      )}
    </div>
  );
};
