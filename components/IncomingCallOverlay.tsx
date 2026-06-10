import { Utensils, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface IncomingCallOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function IncomingCallOverlay({ isVisible, onDismiss }: IncomingCallOverlayProps) {
  const router = useRouter();

  if (!isVisible) return null;

  const handleAnswer = () => {
    onDismiss();
    router.push('/order-food');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center transform animate-in slide-in-from-bottom-8 duration-500">
        <div className="w-24 h-24 bg-primary-gradient rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[var(--primary)]/40 animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
          <Utensils size={40} className="text-white animate-bounce" />
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Are you hungry?</h2>
        <p className="text-[var(--foreground)] opacity-70 mb-8 text-center">Would you like to order some food?</p>

        <div className="flex w-full gap-4">
          <button 
            onClick={onDismiss}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white">
              <ThumbsDown size={32} />
            </div>
            <span className="font-bold text-xl">No</span>
          </button>

          <button 
            onClick={handleAnswer}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white animate-pulse">
              <ThumbsUp size={32} />
            </div>
            <span className="font-bold text-xl">Yes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
