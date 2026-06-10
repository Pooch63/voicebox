'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useAudioOutput } from '@/hooks/useAudioOutput';
import { OnScreenKeyboard } from '@/components/OnScreenKeyboard';
import { removeLastGrapheme } from '@/lib/keyboardLayouts';
import { Send } from 'lucide-react';

export const TypeResponse = () => {
  const { appState, sessionPreferences, transcript, addConversationTurn } = useAppStore();
  const { speak } = useAudioOutput();
  const [text, setText] = useState('');

  if (!sessionPreferences || sessionPreferences.inputMode !== 'type') {
    return null;
  }

  if (!transcript.question) {
    return null;
  }

  const isDisabled = appState === 'listening' || appState === 'processing' || appState === 'speaking';
  const lang = sessionPreferences.language;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;
    addConversationTurn('user', trimmed);
    speak(trimmed, lang);
    setText('');
  };

  const handleInsert = (chunk: string) => {
    setText((prev) => prev + chunk);
  };

  const handleBackspace = () => {
    setText((prev) => removeLastGrapheme(prev, lang));
  };

  return (
    <div className="w-full max-w-2xl mt-8 space-y-4">
      <textarea
        value={text}
        readOnly
        disabled={isDisabled}
        lang={lang}
        inputMode="none"
        placeholder="Type your answer..."
        rows={3}
        aria-label="Your typed answer"
        className="w-full p-5 text-2xl rounded-2xl bg-[var(--surface)] text-[var(--foreground)] placeholder:opacity-40 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 cursor-default"
      />
      <OnScreenKeyboard
        language={lang}
        disabled={isDisabled}
        onInsert={handleInsert}
        onBackspace={handleBackspace}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled || !text.trim()}
        className="w-full flex items-center justify-center gap-3 py-5 text-xl font-bold rounded-2xl bg-primary-gradient text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        <Send size={24} />
        Speak answer
      </button>
    </div>
  );
};
