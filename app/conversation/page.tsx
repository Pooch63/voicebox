"use client";

import { useEffect, useState } from "react";
import { useVAD } from "@/hooks/useVAD";
import { ListeningIndicator } from "@/components/ListeningIndicator";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { ResponseButtons } from "@/components/ResponseButtons";
import { TypeResponse } from "@/components/TypeResponse";
import { SetupScreen } from "@/components/SetupScreen";
import { StatusBar } from "@/components/StatusBar";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Settings2, ArrowLeft } from "lucide-react";
import { getAppMode, type AppMode } from "@/lib/sessionPreferences";

export default function Home() {
  const router = useRouter();
  const { appState, sessionStarted, micSessionActive, setMicSessionActive, endSession } =
    useAppStore();
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<AppMode>('caregiver');

  const vad = useVAD();

  useEffect(() => {
    setIsClient(true);
    const currentMode = getAppMode();
    setMode(currentMode);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          router.push('/permission');
        }
      })
      .catch(() => {
        // Permission API unsupported — mic will be requested when user taps start
      });
  }, [isClient, router]);

  const handleStartListening = () => {
    if (!micSessionActive && appState !== 'listening' && appState !== 'processing') {
      setMicSessionActive(true);
      vad.start();
    }
  };

  if (!isClient) return null;

  if (!sessionStarted) {
    // Auto-start in victim mode
    if (mode === 'victim') {
      return (
        <main className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6 bg-[var(--background)]">
          <button
            onClick={() => router.push('/')}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 sm:p-4 bg-[var(--surface)] rounded-full hover:bg-white/10 transition-colors shadow-md touch-manipulation"
            aria-label="Go back"
          >
            <ArrowLeft size={28} className="sm:w-8 sm:h-8" />
          </button>
          <SetupScreen />
        </main>
      );
    }
    
    return (
      <main className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6 bg-[var(--background)]">
        <SetupScreen />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6 bg-[var(--background)] pb-16 sm:pb-20">
      {mode === 'victim' ? (
        <button
          type="button"
          onClick={() => {
            endSession();
            router.push('/');
          }}
          className="fixed top-3 left-3 sm:top-4 sm:left-4 p-3 sm:p-4 rounded-full bg-[var(--surface)] opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation z-10"
          aria-label="Go back"
        >
          <ArrowLeft size={22} className="sm:w-6 sm:h-6" />
        </button>
      ) : (
        <button
          type="button"
          onClick={endSession}
          className="fixed top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-[var(--surface)] opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation z-10"
          aria-label="Change settings"
        >
          <Settings2 size={14} className="sm:w-4 sm:h-4" />
          Settings
        </button>
      )}

      <div className="flex flex-col items-center w-full max-w-4xl space-y-8 sm:space-y-12 animate-fade-in px-2">
        <ListeningIndicator
          isActive={micSessionActive}
          onStart={handleStartListening}
        />
        <QuestionDisplay sessionActive={micSessionActive} />
        <ResponseButtons />
        {mode === 'caregiver' && <TypeResponse />}
      </div>
      <StatusBar />
    </main>
  );
}
