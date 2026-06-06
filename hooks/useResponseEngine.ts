import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';

function getLatestCaregiverText(
  history: { role: 'caregiver' | 'user'; text: string }[],
): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'caregiver') return history[i].text;
  }
  return '';
}

export const useResponseEngine = () => {
  const generateResponses = useCallback(async () => {
    const {
      conversationHistory,
      sessionPreferences,
      setAppState,
      setResponseOptions,
      setQuestion,
      setErrorMsg,
      clearDisplayTranscript,
    } = useAppStore.getState();

    const latestCaregiver = getLatestCaregiverText(conversationHistory);
    if (!latestCaregiver.trim()) return;

    setAppState('processing');
    setErrorMsg(null);

    const prefs = sessionPreferences ?? {
      inputMode: 'select' as const,
      choiceInteraction: 'tap' as const,
      showImages: true,
      showText: true,
      language: 'en',
    };

    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory,
          inputMode: prefs.inputMode,
          choiceInteraction: prefs.choiceInteraction,
          showImages: prefs.showImages,
          showText: prefs.showText,
          language: prefs.language,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      setQuestion(
        data.question ?? latestCaregiver,
        data.questionOriginal ?? latestCaregiver,
      );
      setResponseOptions(data.responses ?? []);
      clearDisplayTranscript();
      setAppState('idle');
    } catch (err) {
      console.error('Failed to generate responses:', err);
      setErrorMsg('Failed to generate responses');
      setQuestion(latestCaregiver, latestCaregiver);
      if (prefs.inputMode === 'select') {
        setResponseOptions([
          { label: 'Yes', spoken: 'Yes.', emoji: '✅' },
          { label: 'No', spoken: 'No.', emoji: '❌' },
          { label: 'Help', spoken: 'I need some help please.', emoji: '🙋' },
          { label: 'Say again', spoken: 'Could you say that again?', emoji: '🔄' },
        ]);
      } else {
        setResponseOptions([]);
      }
      clearDisplayTranscript();
      setAppState('idle');
    }
  }, []);

  return { generateResponses };
};
