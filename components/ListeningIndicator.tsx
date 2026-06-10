import { useAppStore } from '@/store/appStore';
import { Mic, MicOff } from 'lucide-react';

interface ListeningIndicatorProps {
  isActive?: boolean;
  onStart?: () => void;
}

export const ListeningIndicator = ({ isActive = false, onStart }: ListeningIndicatorProps) => {
  const { appState, connectionHealth } = useAppStore();

  if (!connectionHealth.mic) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
          <MicOff size={32} />
        </div>
        <p className="mt-2 text-sm text-red-400">Microphone Disabled</p>
      </div>
    );
  }

  const isListening = appState === 'listening';
  const isProcessing = appState === 'processing';
  const canStart = !isActive && !isListening && !isProcessing && onStart;

  const micButton = (
    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
      isListening ? 'bg-primary-gradient text-white shadow-lg shadow-[var(--primary)]/50' :
      isProcessing ? 'bg-yellow-500 text-white animate-pulse' :
      isActive ? 'bg-[var(--surface)] text-[var(--foreground)]' :
      'bg-primary-gradient text-white shadow-lg shadow-[var(--primary)]/30 hover:scale-105'
    }`}>
      <Mic size={36} />
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-[var(--primary)] animate-ping opacity-20" />
        )}

        {canStart ? (
          <button
            type="button"
            onClick={onStart}
            aria-label="Start listening"
            className="rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            {micButton}
          </button>
        ) : (
          micButton
        )}
      </div>
      <p className="mt-4 text-sm tracking-wide opacity-80 h-5">
        {isListening ? 'Listening...' :
         isProcessing ? 'Thinking...' :
         isActive ? 'Ready' :
         'Tap to start listening'}
      </p>
    </div>
  );
};
