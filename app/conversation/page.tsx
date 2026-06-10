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
import { Settings2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { appState, sessionStarted, micSessionActive, setMicSessionActive, endSession } =
    useAppStore();
  const [isClient, setIsClient] = useState(false);

  const vad = useVAD();

  useEffect(() => {
    setIsClient(true);
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
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--background)]">
        <SetupScreen />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--background)] pb-20">
      <button
        type="button"
        onClick={endSession}
        className="fixed top-4 right-4 flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-[var(--surface)] opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-label="Change settings"
      >
        <Settings2 size={16} />
        Settings
      </button>

      <div className="flex flex-col items-center w-full max-w-4xl space-y-12 animate-fade-in">
        <ListeningIndicator
          isActive={micSessionActive}
          onStart={handleStartListening}
        />
        <QuestionDisplay sessionActive={micSessionActive} />
        <ResponseButtons />
        <TypeResponse />
      </div>
      <StatusBar />
    </main>
  );
}
