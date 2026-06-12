import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split('-')[0];
  const matching = voices.filter((v) => v.lang.startsWith(langPrefix));
  if (matching.length === 0) return undefined;
  return (
    matching.find(
      (v) =>
        v.name.includes('Google') ||
        v.name.includes('Natural') ||
        v.name.includes('Premium'),
    ) ?? matching[0]
  );
}

// Keep a reference to prevent Safari/Chrome from garbage collecting the utterance before onend fires
let activeUtterance: SpeechSynthesisUtterance | null = null;

export const useAudioOutput = () => {
  const setAppState = useAppStore((state) => state.setAppState);
  const setAwaitingUserResponse = useAppStore((state) => state.setAwaitingUserResponse);
  const sessionLanguage = useAppStore((state) => state.sessionPreferences?.language ?? 'en');

  const resumeCaregiverListening = useCallback(() => {
    setAwaitingUserResponse(false);
    setAppState('idle');
  }, [setAwaitingUserResponse, setAppState]);

  const speak = useCallback(
    (text: string, lang?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        resumeCaregiverListening();
        return;
      }

      const targetLang = lang ?? sessionLanguage;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;

      const voice = pickVoice(targetLang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setAppState('speaking');
      };

      utterance.onend = () => {
        resumeCaregiverListening();
        activeUtterance = null;
      };

      utterance.onerror = () => {
        resumeCaregiverListening();
        activeUtterance = null;
      };

      activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [setAppState, sessionLanguage, resumeCaregiverListening],
  );

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtterance = null;
      setAppState('idle');
    }
  }, [setAppState]);

  return { speak, cancel, resumeCaregiverListening };
};
