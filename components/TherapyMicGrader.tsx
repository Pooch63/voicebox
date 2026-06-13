"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ListeningIndicator } from "@/components/ListeningIndicator";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAppStore } from "@/store/appStore";

export interface TherapyMicGraderProps {
  targetWord: string;
  mode: 'victim' | 'caregiver';
  autoStart?: boolean;
  sessionActive: boolean;
  onSuccess: (word: string, scoreData: any) => void;
  onRetry?: () => void;
}

export function TherapyMicGrader({
  targetWord,
  mode,
  autoStart = false,
  sessionActive,
  onSuccess,
  onRetry,
}: TherapyMicGraderProps) {
  const { appState, setAppState } = useAppStore();
  const [feedback, setFeedback] = useState("");
  const [scoreData, setScoreData] = useState<any>(null);
  
  const isMountedRef = useRef(true);
  const sessionActiveRef = useRef(sessionActive);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  const handleSpeechEnd = useCallback(async (audioBlob: Blob) => {
    if (!sessionActiveRef.current || !isMountedRef.current) return;
    
    setAppState('processing');
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('targetWord', targetWord);

    try {
      const res = await fetch('/api/therapy-score', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!sessionActiveRef.current || !isMountedRef.current) {
        setAppState('idle');
        mic.clearProcessing();
        return;
      }

      if (data.error) {
        setFeedback("Error: " + data.error);
        setScoreData(null);
        mic.clearProcessing();
        setTimeout(() => { 
          if (sessionActiveRef.current && isMountedRef.current && autoStart) mic.start(); 
        }, 2000);
      } else {
        setScoreData(data);
        mic.clearProcessing();
        if (data.score > 0.5) {
          setFeedback("Excellent!");
          onSuccess(targetWord, data);
        } else {
          setFeedback("Oops, let's try again.");
          if (onRetry) onRetry();
          setTimeout(() => {
            if (sessionActiveRef.current && isMountedRef.current && autoStart) {
              setFeedback("");
              setScoreData(null);
              mic.start();
            }
          }, 2000);
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      setFeedback("Error analyzing audio.");
      mic.clearProcessing();
      setTimeout(() => { 
        if (sessionActiveRef.current && isMountedRef.current && autoStart) mic.start(); 
      }, 2000);
    }
    if (isMountedRef.current) {
      setAppState('idle');
    }
  }, [targetWord, autoStart, onSuccess, onRetry, setAppState]);

  const mic = useMicrophone({
    onSpeechEnd: handleSpeechEnd,
    onSpeechStart: () => {
      setAppState('listening');
      setFeedback("");
      setScoreData(null);
    },
    onMisfire: () => {
      setAppState('idle');
    },
  });

  // Start listening when session is active and target word changes
  useEffect(() => {
    if (autoStart && sessionActive && !mic.loading) {
      setFeedback("");
      setScoreData(null);
      const t = setTimeout(() => {
        mic.start();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [targetWord, autoStart, sessionActive, mic.loading]);

  useEffect(() => {
    if (!sessionActive) {
      mic.stop();
      setAppState('idle');
      setFeedback("");
      setScoreData(null);
    }
  }, [sessionActive, setAppState]);

  const isRecording = mic.isListening;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center h-24 sm:h-32 items-center w-full">
        {(!feedback || mic.isListening) && (
          <ListeningIndicator 
            isActive={sessionActive && appState !== 'processing' && !mic.isProcessing} 
            isListening={mic.isListening} 
          />
        )}
      </div>

      <div className={`mt-6 sm:mt-8 flex flex-col items-center justify-center ${mode === 'victim' ? 'min-h-[10rem] sm:min-h-[12rem]' : 'min-h-[8rem] sm:min-h-[10rem]'}`}>
        {feedback && (
          <p className={`font-bold animate-fade-in drop-shadow-md text-center px-4 ${scoreData?.score > 0.5 ? 'text-green-400' : 'text-yellow-400'} ${mode === 'victim' ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-3xl sm:text-4xl'}`}>
            {mode === 'victim' ? (scoreData?.score > 0.5 ? '✓ Good!' : 'Try Again') : feedback}
          </p>
        )}
        {scoreData && mode === 'caregiver' && (
          <div className="mt-4 sm:mt-6 text-sm sm:text-base text-[var(--foreground)] opacity-90 animate-fade-in text-center bg-[var(--surface)]/60 p-4 sm:p-5 rounded-2xl shadow-sm border border-[var(--surface)] mx-4 max-w-md">
            <p className="font-bold mb-2 text-lg sm:text-xl">Score: {(scoreData.score * 100).toFixed(0)}%</p>
            <p className="text-xs sm:text-sm opacity-80 flex gap-3 sm:gap-4 justify-center flex-wrap">
              <span>Clarity: {(scoreData.details.clarityScore * 100).toFixed(0)}%</span>
              <span>Speed: {(scoreData.details.speedScore * 100).toFixed(0)}%</span>
            </p>
            <p className="text-xs sm:text-sm opacity-70 mt-2 italic break-words">
              Heard: "{scoreData.details.transcript}"
            </p>
          </div>
        )}
      </div>

      {!autoStart && (
        <div className="mt-4">
          {!isRecording ? (
            <button
              onClick={() => mic.start()}
              disabled={mic.loading}
              className="py-4 px-8 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-2xl font-bold text-xl transition-all disabled:opacity-50 shadow-xl"
            >
              {mic.loading ? 'Loading...' : 'Start'}
            </button>
          ) : (
             <button
             onClick={() => mic.stop()}
             className="py-4 px-8 bg-red-500 hover:opacity-90 active:scale-95 text-white rounded-2xl font-bold text-xl transition-all disabled:opacity-50 shadow-xl"
           >
             Stop
           </button>
          )}
        </div>
      )}
    </div>
  );
}
