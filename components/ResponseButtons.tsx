import { useAppStore } from '@/store/appStore';
import { useAudioOutput } from '@/hooks/useAudioOutput';
import { useCallback, useEffect, useState } from 'react';

function ChoiceContent({
  showImages,
  showText,
  emoji,
  label,
  large,
}: {
  showImages: boolean;
  showText: boolean;
  emoji: string;
  label: string;
  large?: boolean;
}) {
  const hasEmoji = showImages && emoji;
  const hasLabel = showText && label;

  return (
    <>
      {hasEmoji && (
        <span className={`${hasLabel ? 'text-4xl mb-3' : large ? 'text-7xl' : 'text-6xl'}`}>
          {emoji}
        </span>
      )}
      {hasLabel && (
        <span className={`font-bold tracking-wide ${large ? 'text-4xl' : 'text-3xl'}`}>
          {label}
        </span>
      )}
    </>
  );
}

export const ResponseButtons = () => {
  const { responseOptions, appState, sessionPreferences, addConversationTurn } = useAppStore();
  const { speak } = useAudioOutput();
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const isDisabled = appState === 'listening' || appState === 'processing';
  const isSpeaking = appState === 'speaking';

  const selectOption = useCallback(
    (index: number, spokenText: string) => {
      setActiveButtonIndex(index);
      addConversationTurn('user', spokenText);
      speak(spokenText);
      setTimeout(() => setActiveButtonIndex(null), 300);
    },
    [addConversationTurn, speak],
  );

  useEffect(() => {
    setFocusedIndex(0);
    setActiveButtonIndex(null);
  }, [responseOptions]);

  useEffect(() => {
    if (
      !sessionPreferences ||
      sessionPreferences.inputMode !== 'select' ||
      sessionPreferences.choiceInteraction !== 'cycle' ||
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
  }, [
    sessionPreferences,
    responseOptions,
    focusedIndex,
    isDisabled,
    selectOption,
  ]);

  if (!sessionPreferences || sessionPreferences.inputMode !== 'select') {
    return null;
  }

  if (responseOptions.length === 0) {
    return null;
  }

  const { showImages, showText, choiceInteraction } = sessionPreferences;

  if (choiceInteraction === 'cycle') {
    const focusedOption = responseOptions[focusedIndex];

    return (
      <div className="w-full max-w-2xl mt-8 space-y-6">
        <div
          className={`
            flex flex-col items-center justify-center p-8 rounded-3xl min-h-[180px]
            transition-all duration-200 shadow-md border-4 border-[var(--primary)]
            bg-[var(--primary)]/10 text-[var(--foreground)]
            ${isSpeaking ? 'opacity-40' : ''}
          `}
          aria-live="polite"
          aria-label={`Choice ${focusedIndex + 1} of ${responseOptions.length}`}
        >
          <ChoiceContent
            showImages={showImages}
            showText={showText}
            emoji={focusedOption.emoji}
            label={focusedOption.label}
            large
          />
        </div>

        <div className="flex justify-center gap-2">
          {responseOptions.map((_, index) => (
            <span
              key={index}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                index === focusedIndex
                  ? 'w-8 bg-[var(--primary)]'
                  : 'w-2.5 bg-[var(--surface)]'
              }`}
              aria-hidden
            />
          ))}
        </div>

        <p className="text-center text-sm opacity-60">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] font-mono text-xs">Space</kbd>{' '}
          to cycle choices · Caregiver presses{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] font-mono text-xs">Enter</kbd>{' '}
          to confirm
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl grid grid-cols-2 gap-4 mt-8">
      {responseOptions.map((option, index) => {
        const isActive = activeButtonIndex === index;

        return (
          <button
            key={index}
            onClick={() => selectOption(index, option.spoken)}
            disabled={isDisabled}
            className={`
              flex flex-col items-center justify-center p-6 rounded-3xl min-h-[120px]
              transition-all duration-200 shadow-sm
              ${isActive ? 'scale-95 bg-[var(--primary)] text-white shadow-inner' : 'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--foreground)]'}
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isSpeaking && !isActive ? 'opacity-40' : ''}
            `}
          >
            <ChoiceContent
              showImages={showImages}
              showText={showText}
              emoji={option.emoji}
              label={option.label}
            />
          </button>
        );
      })}
    </div>
  );
};
