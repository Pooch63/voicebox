import { Utensils, X, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface IncomingCallOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function IncomingCallOverlay({ isVisible, onDismiss }: IncomingCallOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isVisible) return null;

  const handleAnswer = async () => {
    setLoading(true);
    try {
      // Create notification for caregivers
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_type: "food_request",
          title: "Food Request",
          message: "Patient is hungry and would like food",
          priority: "normal"
        })
      });

      if (response.ok) {
        setSuccess(true);
        // Auto-dismiss after showing success message
        setTimeout(() => {
          setSuccess(false);
          onDismiss();
        }, 3000);
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      // Dismiss even if notification fails
      onDismiss();
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[var(--surface)] p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center transform animate-in slide-in-from-bottom-8 duration-500">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Notification Sent!</h2>
          <p className="text-[var(--foreground)] opacity-70 text-center">Your caregiver has been notified that you're hungry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center transform animate-in slide-in-from-bottom-8 duration-500">
        <div className="w-24 h-24 bg-primary-gradient rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[var(--primary)]/40 animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
          <Utensils size={40} className="text-white animate-bounce" />
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Are you hungry?</h2>
        <p className="text-[var(--foreground)] opacity-70 mb-8 text-center">Let your caregiver know you'd like food</p>

        <div className="flex w-full gap-4">
          <button 
            onClick={onDismiss}
            disabled={loading}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white">
              <ThumbsDown size={32} />
            </div>
            <span className="font-bold text-xl">No</span>
          </button>

          <button 
            onClick={handleAnswer}
            disabled={loading}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white animate-pulse">
              <ThumbsUp size={32} />
            </div>
            <span className="font-bold text-xl">{loading ? "..." : "Yes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
