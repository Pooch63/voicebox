"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { getAppMode, type AppMode } from "@/lib/sessionPreferences";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { TherapyMicGrader } from "@/components/TherapyMicGrader";

const DEFAULT_WORDS = ["Apple", "Water", "Hello", "Yes", "No", "Please", "Thank you"];

export default function TherapyScreen() {
  const router = useRouter();
  const { appState, setAppState } = useAppStore();
  const [sessionActive, setSessionActive] = useState(false);
  const [mode, setMode] = useState<AppMode>('caregiver');
  const [isClient, setIsClient] = useState(false);
  
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);
  const [targetIndex, setTargetIndex] = useState(0);
  const targetWord = words[targetIndex];

  const [completedWords, setCompletedWords] = useState<string[]>([]);
  
  const sessionActiveRef = useRef(sessionActive);

  // Load therapy words from the database
  useEffect(() => {
    const loadWords = async () => {
      try {
        const res = await fetch('/api/therapy-words');
        if (!res.ok) {
          console.warn(`[Therapy] Words API returned ${res.status}`);
          return;
        }
        const data = await res.json();
        const activeList = data.wordLists?.find((list: any) => list.is_active);
        if (activeList && activeList.words.length > 0) {
          console.log('[Therapy] Loaded words from DB:', activeList.words);
          setWords(activeList.words);
        } else {
          console.log('[Therapy] No active word list, using defaults');
        }
      } catch (error) {
        console.warn('[Therapy] Could not load therapy words:', error);
      }
    };
    loadWords();
  }, []);

  const handleSuccess = useCallback((word: string, data: any) => {
    setCompletedWords(prev => [...prev, word]);
    setTimeout(() => {
      if (sessionActiveRef.current) {
        setTargetIndex(prev => (prev + 1) % words.length);
      }
    }, 1500);
  }, [words.length]);


  useEffect(() => {
    setIsClient(true);
    const currentMode = getAppMode();
    setMode(currentMode);
    if (currentMode === 'victim') {
      setSessionActive(true);
    }
  }, []);
  
  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);





  const handleStartSession = () => {
    setCompletedWords([]);
    setTargetIndex(0);
    setSessionActive(true);
  };

  const handleEndSession = () => {
    setSessionActive(false);
    setAppState('idle');
    // Return to home in victim mode
    if (mode === 'victim') {
      router.push('/');
    }
  };

  if (!isClient) return null;

  // Victim mode: Simplified session start
  const renderVictimStart = () => (
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

  // Caregiver mode: Detailed session start
  const renderCaregiverStart = () => (
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

  return (
    <>
      {!sessionActive ? (
        mode === 'victim' ? renderVictimStart() : renderCaregiverStart()
      ) : (
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
          <h2 className={`font-bold text-[var(--primary)] animate-scale-in drop-shadow-md text-center px-4 ${mode === 'victim' ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl' : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'}`}>
            {targetWord}
          </h2>
        </div>

        <TherapyMicGrader 
          targetWord={targetWord}
          mode={mode}
          autoStart={true}
          sessionActive={sessionActive}
          onSuccess={handleSuccess}
        />
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
      )}
    </>
  );
}
