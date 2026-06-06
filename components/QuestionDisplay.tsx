import { useAppStore } from '@/store/appStore';

interface QuestionDisplayProps {
  sessionActive?: boolean;
}

export const QuestionDisplay = ({ sessionActive = false }: QuestionDisplayProps) => {
  const { transcript, appState } = useAppStore();

  const isIdleOrSpeaking = appState === 'idle' || appState === 'speaking';
  const showQuestion = isIdleOrSpeaking && transcript.question;
  const displayText =
    appState === 'listening'
      ? transcript.live
      : appState === 'processing'
        ? transcript.final
        : '';
  const showLive =
    (appState === 'listening' || appState === 'processing') && Boolean(displayText);

  return (
    <div className="w-full max-w-2xl min-h-24 flex flex-col items-center justify-center p-6 bg-[var(--surface)] rounded-2xl shadow-sm text-center transition-all duration-500">
      {showQuestion ? (
        <>
          <h2 className="text-3xl font-bold text-[var(--foreground)] animate-fade-in">
            &ldquo;{transcript.question}&rdquo;
          </h2>
          {transcript.questionOriginal &&
            transcript.questionOriginal !== transcript.question && (
              <p className="mt-3 text-sm opacity-50 italic">
                Caregiver said: &ldquo;{transcript.questionOriginal}&rdquo;
              </p>
            )}
        </>
      ) : showLive ? (
        <h2
          className={`text-2xl font-medium text-[var(--foreground)] ${appState === 'listening' ? 'opacity-70 animate-pulse' : 'opacity-90'}`}
        >
          {displayText}
        </h2>
      ) : (
        <h2 className="text-xl font-medium text-[var(--foreground)] opacity-30 italic">
          {sessionActive ? 'Waiting for speech...' : 'Tap the microphone to begin'}
        </h2>
      )}
    </div>
  );
};
