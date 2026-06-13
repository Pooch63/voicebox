"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Mic } from "lucide-react";
import { ListeningIndicator } from "./ListeningIndicator";
import { useMicrophone } from "@/hooks/useMicrophone";
import type { HeartbeatPrompt } from "@/hooks/useHeartbeat";

type HeartbeatPromptProps = {
  prompt: HeartbeatPrompt;
  onDismiss: () => void;
  onComplete: () => void;
};

export function HeartbeatPromptOverlay({ prompt, onDismiss, onComplete }: HeartbeatPromptProps) {
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [micStarted, setMicStarted] = useState(false);

  useEffect(() => {
    if (prompt.therapyWord) {
      fetch(`/api/icon?q=${encodeURIComponent(prompt.therapyWord)}`)
        .then(res => res.json())
        .then(data => {
          if (data.url) setIconUrl(data.url);
        })
        .catch(() => setIconUrl(null));
    }
  }, [prompt.therapyWord]);

  const handleSpeechEnd = useCallback(async (audioBlob: Blob) => {
    setProcessing(true);
    mic.clearProcessing();
    
    if (prompt.type === "therapy_prompt" && prompt.therapyWord) {
      // Score therapy response
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('targetWord', prompt.therapyWord);

      try {
        const res = await fetch('/api/therapy-score', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.error) {
          setFeedback("Error: " + data.error);
        } else {
          const clarity = data.clarity ? `${(data.clarity * 100).toFixed(0)}%` : 'N/A';
          setFeedback(`Great job! Clarity: ${clarity}`);
        }
      } catch (error) {
        console.error("Error scoring therapy:", error);
        setFeedback("Error processing response");
      }
    } else {
      // For hunger check, just transcribe
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      try {
        const res = await fetch('/api/respond', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.transcription) {
          setFeedback(`You said: "${data.transcription}"`);
        } else {
          setFeedback("Got it!");
        }
      } catch (error) {
        console.error("Error transcribing:", error);
        setFeedback("Error processing response");
      }
    }
    
    setProcessing(false);
    
    // Auto-close after showing feedback
    setTimeout(() => {
      onComplete();
    }, 2000);
  }, [prompt, onComplete]);

  const mic = useMicrophone({
    onSpeechEnd: handleSpeechEnd,
    onSpeechStart: () => {
      // Speech detected — visual feedback is handled by isListening
    },
    onMisfire: () => {
      // Speech too short — keep listening
    },
  });

  const handleStartListening = useCallback(() => {
    setMicStarted(true);
    mic.start();
  }, [mic]);

  // Clean up mic when component unmounts
  useEffect(() => {
    return () => {
      mic.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-2 border-[var(--primary)]/50 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
              <span className="text-2xl">
                {prompt.type === 'hunger_check' ? '🍽️' : '💬'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {prompt.type === 'hunger_check' ? 'Hunger Check' : 'Therapy Practice'}
            </h2>
          </div>
          <button
            onClick={() => {
              mic.stop();
              onDismiss();
            }}
            className="w-10 h-10 rounded-full bg-gray-500/20 hover:bg-gray-500/30 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-[var(--foreground)]" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          {prompt.therapyWord && iconUrl && (
            <div className="mb-6">
              <img 
                src={iconUrl} 
                alt={prompt.therapyWord}
                className="w-32 h-32 mx-auto"
              />
            </div>
          )}
          
          <h3 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            {prompt.question}
          </h3>
          
          {prompt.type === "therapy_prompt" && (
            <p className="text-lg text-[var(--foreground)] opacity-60">
              {micStarted ? '' : 'Tap the microphone and say the word clearly'}
            </p>
          )}
          
          {prompt.type === "hunger_check" && (
            <p className="text-lg text-[var(--foreground)] opacity-60">
              Tap the microphone to answer
            </p>
          )}
        </div>

        {/* Listening Indicator */}
        {micStarted && (mic.isListening || (!feedback && !processing)) && (
          <div className="mb-6">
            <ListeningIndicator isActive={true} isListening={mic.isListening} />
            <p className="text-center text-[var(--foreground)] opacity-70 mt-4">
              {mic.isListening ? 'Listening...' : 'Ready — speak now'}
            </p>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="text-center mb-6">
            <p className="text-xl text-[var(--foreground)]">Processing...</p>
          </div>
        )}
        
        {/* Feedback */}
        {feedback && !processing && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-6 mb-6 text-center">
            <p className="text-xl font-semibold text-green-500">{feedback}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!feedback && !processing && (
          <div className="flex flex-col gap-4 mt-4">
            {prompt.type === 'hunger_check' ? (
              <div className="flex gap-4 w-full px-4">
                <button
                  onClick={() => {
                    mic.stop();
                    setFeedback("Got it. Let us know if you need anything else.");
                    setTimeout(() => onComplete(), 2000);
                  }}
                  className="flex-1 py-5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold text-2xl transition-all shadow-md active:scale-95"
                >
                  No
                </button>
                <button
                  onClick={async () => {
                    mic.stop();
                    setProcessing(true);
                    try {
                      await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          notification_type: "food_request",
                          title: "Food Request",
                          message: "Patient is hungry and would like food",
                          priority: "normal"
                        })
                      });
                      setFeedback("Notification Sent! Your caregiver has been notified.");
                    } catch (error) {
                      setFeedback("Error sending notification");
                    } finally {
                      setProcessing(false);
                      setTimeout(() => onComplete(), 2000);
                    }
                  }}
                  className="flex-1 py-5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-2xl font-bold text-2xl transition-all shadow-md active:scale-95"
                >
                  Yes
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {!micStarted && (
                  <button
                    onClick={handleStartListening}
                    disabled={mic.loading}
                    className="w-28 h-28 rounded-full flex items-center justify-center text-white transition-all shadow-xl bg-gradient-to-br from-[var(--primary)] to-emerald-600 hover:scale-105 active:scale-95 shadow-[var(--primary)]/40 cursor-pointer disabled:opacity-50"
                    aria-label="Press to speak"
                  >
                    <Mic size={48} className="text-white" />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    mic.stop();
                    onDismiss();
                  }}
                  className="px-6 py-2 text-[var(--foreground)] opacity-50 hover:opacity-100 font-medium text-lg transition-opacity"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
