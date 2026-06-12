"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ListeningIndicator } from "@/components/ListeningIndicator";
import { useAppStore } from "@/store/appStore";
import { getAppMode, type AppMode } from "@/lib/sessionPreferences";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const WORDS = ["Apple", "Water", "Hello", "Yes", "No", "Please", "Thank you"];

export default function TherapyScreen() {
  const router = useRouter();
  const { appState, setAppState } = useAppStore();
  const [sessionActive, setSessionActive] = useState(false);
  const [mode, setMode] = useState<AppMode>('caregiver');
  const [isClient, setIsClient] = useState(false);
  
  const [targetIndex, setTargetIndex] = useState(0);
  const targetWord = WORDS[targetIndex];

  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [scoreData, setScoreData] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stopTimeout = useRef<NodeJS.Timeout | null>(null);
  const sessionActiveRef = useRef(sessionActive);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    const currentMode = getAppMode();
    setMode(currentMode);
    // Auto-start in victim mode
    if (currentMode === 'victim') {
      setSessionActive(true);
    }
  }, []);
  
  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  useEffect(() => {
    fetch(`/api/icon?q=${encodeURIComponent(targetWord)}`)
      .then(res => res.json())
      .then(data => {
        if (data.url) setIconUrl(data.url);
        else setIconUrl(null);
      })
      .catch(() => setIconUrl(null));
  }, [targetWord]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    if (stopTimeout.current) {
      clearTimeout(stopTimeout.current);
    }
  }, []);

  const handleStartListening = useCallback(async () => {
    if (!sessionActiveRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorder.current = new MediaRecorder(stream, { mimeType });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setAppState('processing');
        
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('targetWord', targetWord);

        try {
          const res = await fetch('/api/therapy-score', { method: 'POST', body: formData });
          const data = await res.json();
          
          if (!sessionActiveRef.current) {
            setAppState('idle');
            return;
          }

          if (data.error) {
            setFeedback("Error: " + data.error);
            setScoreData(null);
            setTimeout(() => { if (sessionActiveRef.current) handleStartListening(); }, 2000);
          } else {
            setScoreData(data);
            if (data.score > 0.5) {
              setFeedback("Excellent!");
              setCompletedWords(prev => [...prev, targetWord]);
              setTimeout(() => {
                if (sessionActiveRef.current) {
                  setTargetIndex(prev => (prev + 1) % WORDS.length);
                }
              }, 1500);
            } else {
              setFeedback("Oops, let's try again.");
              setTimeout(() => {
                if (sessionActiveRef.current) {
                  setFeedback("");
                  setScoreData(null);
                  handleStartListening();
                }
              }, 2000);
            }
          }
        } catch (error) {
          setFeedback("Error analyzing audio.");
          setTimeout(() => { if (sessionActiveRef.current) handleStartListening(); }, 2000);
        }
        setAppState('idle');
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setAppState('listening');
      setFeedback("");
      setScoreData(null);

      if (stopTimeout.current) clearTimeout(stopTimeout.current);
      stopTimeout.current = setTimeout(() => {
        stopRecording();
      }, 4000);

    } catch (err) {
      console.error("Error accessing microphone", err);
      setFeedback("Microphone access denied.");
    }
  }, [targetWord, setAppState, stopRecording]);

  useEffect(() => {
    if (sessionActive) {
      setFeedback("");
      setScoreData(null);
      const t = setTimeout(() => {
        handleStartListening();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [targetIndex, sessionActive, handleStartListening]);

  const handleStartSession = () => {
    setCompletedWords([]);
    setTargetIndex(0);
    setSessionActive(true);
  };

  const handleEndSession = () => {
    setSessionActive(false);
    stopRecording();
    setAppState('idle');
    setFeedback("");
    setScoreData(null);
    // Return to home in victim mode
    if (mode === 'victim') {
      router.push('/');
    }
  };

  if (!isClient) return null;

  if (!isClient) return null;

  // Victim mode: Simplified session start
  if (!sessionActive && mode === 'victim') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6 bg-[var(--background)]">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center animate-fade-in text-center space-y-6 sm:space-y-8">
          <button
            onClick={() => router.push('/')}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 sm:p-4 bg-[var(--surface)] rounded-full hover:bg-white/10 transition-colors shadow-md touch-manipulation"
            aria-label="Go back"
          >
            <ArrowLeft size={28} className="sm:w-8 sm:h-8" />
          </button>
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">Practice</h1>
          </div>
          <button
            onClick={handleStartSession}
            className="w-full max-w-[280px] sm:max-w-xs aspect-square flex items-center justify-center rounded-3xl font-bold transition-all duration-200 active:scale-95 text-white shadow-2xl bg-green-500 hover:bg-green-600 text-4xl sm:text-5xl touch-manipulation"
          >
            Start
          </button>
        </div>
      </main>
    );
  }

  // Caregiver mode: Detailed session start
  if (!sessionActive) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6 bg-[var(--background)]">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center animate-fade-in text-center space-y-6 sm:space-y-8 px-4">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">Speech Therapy</h1>
            <p className="text-lg sm:text-xl opacity-70 px-4">
              Practice your pronunciation word by word.
            </p>
          </div>
          <button
            onClick={handleStartSession}
            className="flex items-center justify-center gap-2 px-8 sm:px-10 h-14 sm:h-16 rounded-full font-bold transition-all duration-200 active:scale-95 text-white shadow-xl bg-primary-gradient shadow-[var(--primary)]/30 hover:scale-[1.05] text-xl sm:text-2xl touch-manipulation"
          >
            Start Session
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen h-[100dvh] w-full bg-[var(--background)] overflow-hidden">
      {/* Sidebar - hide in victim mode and on mobile */}
      {mode === 'caregiver' && (
        <div className="hidden lg:flex w-64 border-r border-[var(--surface)] bg-[var(--surface)]/30 p-6 flex-col">
          <h3 className="text-xl font-bold mb-6 text-[var(--foreground)] opacity-80">Completed Words</h3>
          <ul className="space-y-3 overflow-y-auto flex-1 pr-2">
            {completedWords.map((word, i) => (
              <li key={i} className="flex items-center gap-3 text-lg font-medium text-green-500 animate-fade-in">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-sm">
                  ✓
                </span>
                {word}
              </li>
            ))}
          </ul>
          <button
            onClick={handleEndSession}
            className="mt-6 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface)]/80 transition-colors font-medium text-center border border-[var(--surface)] shadow-sm touch-manipulation"
          >
            End Session
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto">
        {/* Back/End button */}
        {mode === 'victim' ? (
          <button
            onClick={handleEndSession}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 sm:p-4 bg-[var(--surface)] rounded-full hover:bg-white/10 transition-colors shadow-md touch-manipulation z-10"
            aria-label="Go back"
          >
            <ArrowLeft size={28} className="sm:w-8 sm:h-8" />
          </button>
        ) : (
          <button
            onClick={handleEndSession}
            className="lg:hidden absolute top-4 right-4 px-4 py-2 rounded-xl bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface)]/80 transition-colors font-medium shadow-sm touch-manipulation z-10 text-sm"
          >
            End Session
          </button>
        )}

        <div className="mb-8 sm:mb-12 flex flex-col items-center">
          <p className={`text-[var(--foreground)] opacity-50 mb-4 sm:mb-6 ${mode === 'victim' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
            {mode === 'victim' ? 'Say' : 'Please say'}
          </p>
          {iconUrl && (
            <img 
              src={iconUrl} 
              alt={`Icon for ${targetWord}`}
              className={`mb-6 sm:mb-8 object-contain animate-fade-in drop-shadow-xl ${mode === 'victim' ? 'w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56' : 'w-32 h-32 sm:w-40 sm:h-40'}`}
            />
          )}
          <h2 className={`font-bold text-[var(--primary)] animate-scale-in drop-shadow-md text-center px-4 ${mode === 'victim' ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl' : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'}`}>
            {targetWord}
          </h2>
        </div>

        <div className="flex justify-center h-24 sm:h-32 items-center">
          {isRecording ? (
            <ListeningIndicator onStart={() => {}} isActive={true} />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
               {appState === 'processing' && <span className={`opacity-50 font-medium animate-pulse ${mode === 'victim' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                 {mode === 'victim' ? 'Listening...' : 'Analyzing pronunciation...'}
               </span>}
            </div>
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
        
        {/* Mobile completed words indicator */}
        {mode === 'caregiver' && completedWords.length > 0 && (
          <div className="lg:hidden mt-6 text-center">
            <p className="text-sm opacity-70 mb-2">Completed</p>
            <div className="flex gap-2 flex-wrap justify-center max-w-md">
              {completedWords.map((word, i) => (
                <span key={i} className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                  ✓ {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
