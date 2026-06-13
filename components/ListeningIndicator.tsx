import { useAppStore } from '@/store/appStore';
import { Mic, MicOff } from 'lucide-react';

interface ListeningIndicatorProps {
  /** Whether the mic session is active (VAD is armed / listening) */
  isActive?: boolean;
  /** Whether speech is currently being detected. Overrides appStore state when provided. */
  isListening?: boolean;
  /** Callback to start listening — renders a tappable button when provided and not active */
  onStart?: () => void;
}

export const ListeningIndicator = ({ isActive = false, isListening: isListeningProp, onStart }: ListeningIndicatorProps) => {
  const { appState } = useAppStore();

  // Use prop-driven state if provided, otherwise fall back to global store
  const isListening = isListeningProp ?? (appState === 'listening');
  const isProcessing = appState === 'processing';
  const canStart = !isActive && !isListening && !isProcessing && onStart;

  // Show the active listening state when isActive is true OR isListening is true
  const showListeningVisual = isListening || (isActive && appState === 'listening');

  const micButton = (
    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
      showListeningVisual ? 'bg-primary-gradient text-white shadow-lg shadow-[var(--primary)]/50' :
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
        {showListeningVisual && (
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
        {showListeningVisual ? 'Listening...' :
         isProcessing ? 'Thinking...' :
         isActive ? 'Ready' :
         'Tap to start listening'}
      </p>
    </div>
  );
};
