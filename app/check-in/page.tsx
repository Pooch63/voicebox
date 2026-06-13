"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Home } from "lucide-react";
import { supabase } from "@/lib/db";
import Link from "next/link";
import { ListeningIndicator } from "@/components/ListeningIndicator";
import { useMicrophone } from "@/hooks/useMicrophone";
import { TherapyMicGrader } from "@/components/TherapyMicGrader";

type PendingPing = {
  response_id: string;
  ping_type: string;
  question: string;
  therapy_word: string | null;
  created_at: string;
};

export default function CheckInPage() {
  const [pendingPings, setPendingPings] = useState<PendingPing[]>([]);
  const [currentPing, setCurrentPing] = useState<PendingPing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [micStarted, setMicStarted] = useState(false);

  // Process audio when speech ends (via VAD)
  const handleSpeechEnd = useCallback(async (audioBlob: Blob) => {
    if (!currentPing) return;
    
    setProcessing(true);
    mic.clearProcessing();
    
    if (currentPing.ping_type === "therapy_prompt") {
      setProcessing(false);
      return; // Handled by TherapyMicGrader
    } else {
      // For other pings, just transcribe
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      try {
        const res = await fetch('/api/respond', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.transcription) {
          setFeedback(`You said: "${data.transcription}"`);
          await markPingResponded(data.transcription);
        } else {
          setFeedback("Sorry, I didn't catch that.");
        }
      } catch (error) {
        console.error("Error transcribing:", error);
        setFeedback("Error processing response");
      }
    }
    
    setProcessing(false);
    
    // Move to next ping after 2 seconds
    setTimeout(() => {
      moveToNextPing();
    }, 2000);
  }, [currentPing]);

  const mic = useMicrophone({
    onSpeechEnd: handleSpeechEnd,
    onSpeechStart: () => {
      // Visual feedback handled by isListening
    },
    onMisfire: () => {
      // Speech too short — keep listening
    },
  });

  useEffect(() => {
    loadPendingPings();
    
    // Subscribe to new pings
    const channel = supabase
      .channel('patient-pings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ping_responses'
        },
        () => {
          loadPendingPings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      mic.stop();
    };
  }, []);
  
  useEffect(() => {
    // Reset mic state when ping changes
    setMicStarted(false);
    mic.stop();
  }, [currentPing]);

  const loadPendingPings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ping_responses")
        .select("*")
        .eq("patient_id", user.id)
        .is("responded_at", null)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading pings:", error);
        return;
      }

      setPendingPings(data || []);
      if (data && data.length > 0 && !currentPing) {
        setCurrentPing(data[0]);
      }
    } catch (error) {
      console.error("Error loading pings:", error);
    } finally {
      setLoading(false);
    }
  };

  const markPingResponded = async (responseText: string) => {
    if (!currentPing) return;
    
    try {
      await supabase
        .from("ping_responses")
        .update({
          response_text: responseText,
          responded_at: new Date().toISOString()
        })
        .eq("response_id", currentPing.response_id);
    } catch (error) {
      console.error("Error marking ping responded:", error);
    }
  };

  const moveToNextPing = () => {
    setFeedback("");
    setMicStarted(false);
    mic.stop();
    
    setPendingPings(prev => {
      const nextPings = prev.filter(p => p.response_id !== currentPing?.response_id);
      if (nextPings.length > 0) {
        setCurrentPing(nextPings[0]);
      } else {
        setCurrentPing(null);
      }
      return nextPings;
    });
  };

  const handleStartListening = useCallback(() => {
    setMicStarted(true);
    mic.start();
  }, [mic]);

  const handleSkip = async () => {
    if (!currentPing) return;
    
    mic.stop();
    await markPingResponded("Skipped");
    moveToNextPing();
  };

  if (loading) {
    return (
      <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <Bell size={40} className="text-[var(--primary)] animate-pulse mx-auto mb-3" />
          <p className="text-lg text-[var(--foreground)]">Loading check-ins...</p>
        </div>
      </main>
    );
  }

  if (!currentPing) {
    return (
      <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Check size={60} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            All Caught Up!
          </h1>
          <p className="text-lg text-[var(--foreground)] opacity-70 mb-6">
            You have no pending check-ins right now.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-full font-bold text-lg hover:opacity-90 transition-all"
          >
            <Home size={20} />
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Check-In Time
        </h1>
        <p className="text-[var(--foreground)] opacity-60">
          {pendingPings.length} check-in{pendingPings.length !== 1 ? 's' : ''} pending
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-2xl">
          
          {/* Question Display */}
          <div className="bg-[var(--surface)] rounded-3xl p-8 mb-8 text-center border border-[var(--border)]/50 shadow-lg">
            
            <h2 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              {currentPing.question}
            </h2>
            
            {currentPing.ping_type === "therapy_prompt" && (
              <p className="text-xl text-[var(--foreground)] opacity-60">
                {micStarted ? '' : 'Tap the button and say the word clearly'}
              </p>
            )}
            
            {currentPing.ping_type === "hunger_check" && (
              <p className="text-xl text-[var(--foreground)] opacity-60">
                Tap the button to answer yes or no
              </p>
            )}
          </div>

          {currentPing.ping_type === "therapy_prompt" ? (
            <div className="flex flex-col items-center">
              <TherapyMicGrader
                targetWord={currentPing.therapy_word!}
                mode="victim"
                autoStart={false}
                sessionActive={true}
                onSuccess={(word, scoreData) => {
                  markPingResponded(`Therapy: ${word} - ${(scoreData.score * 100).toFixed(0)}%`);
                  setTimeout(() => {
                    moveToNextPing();
                  }, 2000);
                }}
              />
              <button
                onClick={handleSkip}
                className="mt-6 px-8 py-4 bg-gray-500 hover:bg-gray-600 active:scale-95 text-white rounded-2xl font-bold text-xl transition-all shadow-xl"
              >
                Skip
              </button>
            </div>
          ) : (
            <>
              {/* Listening Indicator */}
              {micStarted && (mic.isListening || (!feedback && !processing)) && (
                <div className="mb-8">
                  <ListeningIndicator isActive={true} isListening={mic.isListening} />
                  <p className="text-center text-[var(--foreground)] opacity-70 mt-4">
                    {mic.isListening ? 'Listening...' : 'Ready — speak now'}
                  </p>
                </div>
              )}

              {/* Processing/Feedback */}
              {processing && (
                <div className="text-center mb-8">
                  <p className="text-xl text-[var(--foreground)]">Processing...</p>
                </div>
              )}
              
              {feedback && !processing && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-6 mb-8 text-center">
                  <p className="text-xl font-semibold text-green-500">{feedback}</p>
                </div>
              )}

              {/* Action Buttons */}
              {!feedback && !processing && (
                <div className="flex gap-4">
                  <button
                    onClick={micStarted ? () => mic.stop() : handleStartListening}
                    disabled={mic.loading}
                    className="flex-1 py-6 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-2xl font-bold text-2xl transition-all disabled:opacity-50 shadow-xl"
                  >
                    {mic.loading ? 'Loading...' : micStarted ? 'Stop' : 'Start'}
                  </button>
                  
                  <button
                    onClick={handleSkip}
                    disabled={processing}
                    className="px-8 py-6 bg-gray-500 hover:bg-gray-600 active:scale-95 text-white rounded-2xl font-bold text-xl transition-all disabled:opacity-50"
                  >
                    Skip
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
