"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, HeartPulse, BellRing } from "lucide-react";
import { HeartbeatPromptOverlay } from "@/components/HeartbeatPrompt";
import { ModeToggle } from "@/components/ModeToggle";
import { getAppMode, type AppMode } from "@/lib/sessionPreferences";
import { useHeartbeat, type HeartbeatPrompt } from "@/hooks/useHeartbeat";
import UserMenu from "@/components/UserMenu";

export default function Dashboard() {
  const [mode, setMode] = useState<AppMode>('caregiver');
  const [isClient, setIsClient] = useState(false);
  const [currentHeartbeatPrompt, setCurrentHeartbeatPrompt] = useState<HeartbeatPrompt | null>(null);
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const currentMode = getAppMode();
    setMode(currentMode);
    
    // Auto-enable heartbeat in victim mode
    if (currentMode === 'victim') {
      setHeartbeatEnabled(true);
    }
  }, []);

  const { triggerManualPrompt } = useHeartbeat({
    enabled: heartbeatEnabled,
    intervalMinutes: 2, // Change this to desired interval (e.g., 60 for hourly)
    onPrompt: (prompt) => {
      setCurrentHeartbeatPrompt(prompt);
    }
  });

  if (!isClient) return null;

  // Victim Mode: Simplified UI with large buttons and icons
  if (mode === 'victim') {
    return (
      <main className="flex flex-col min-h-screen min-h-[100dvh] bg-[var(--background)] relative overflow-hidden">
        {/* Simple header with mode toggle */}
        <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 px-4 sm:px-6 flex justify-between items-center safe-top max-w-4xl mx-auto w-full">
          <Image src="/logo.png" alt="VoiceBack Logo" width={40} height={40} className="rounded-xl drop-shadow-sm" />
          <ModeToggle />
        </div>
        
        {/* Heartbeat Prompt Overlay */}
        {currentHeartbeatPrompt && (
          <HeartbeatPromptOverlay
            prompt={currentHeartbeatPrompt}
            onDismiss={() => setCurrentHeartbeatPrompt(null)}
            onComplete={() => setCurrentHeartbeatPrompt(null)}
          />
        )}

        {/* Large, simple buttons - optimized for mobile */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 gap-4 sm:gap-6 pb-28 sm:pb-32">
          
          {/* Talk Button */}
          <Link 
            href="/conversation" 
            className="w-full max-w-[420px] aspect-[1.1/1] sm:aspect-square flex flex-col items-center justify-center gap-4 sm:gap-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] sm:rounded-3xl shadow-[0_8px_30px_rgb(59,130,246,0.5)] active:shadow-[0_4px_20px_rgb(59,130,246,0.4)] hover:shadow-[0_12px_40px_rgb(59,130,246,0.6)] transition-all duration-200 active:scale-[0.98] touch-manipulation"
          >
            <MessageSquare size={100} strokeWidth={1.5} className="text-white sm:w-[120px] sm:h-[120px]" />
            <span className="text-4xl sm:text-5xl font-bold text-white">Talk</span>
          </Link>

          {/* Practice Button */}
          <Link 
            href="/therapy" 
            className="w-full max-w-[420px] aspect-[1.1/1] sm:aspect-square flex flex-col items-center justify-center gap-4 sm:gap-6 bg-gradient-to-br from-green-500 to-green-600 rounded-[2rem] sm:rounded-3xl shadow-[0_8px_30px_rgb(34,197,94,0.5)] active:shadow-[0_4px_20px_rgb(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgb(34,197,94,0.6)] transition-all duration-200 active:scale-[0.98] touch-manipulation"
          >
            <HeartPulse size={100} strokeWidth={1.5} className="text-white sm:w-[120px] sm:h-[120px]" />
            <span className="text-4xl sm:text-5xl font-bold text-white">Practice</span>
          </Link>
        </div>

        {/* Bottom ping button - mobile optimized */}
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6 flex justify-center z-40 pointer-events-none safe-bottom">
          <button 
            onClick={() => triggerManualPrompt()}
            className="pointer-events-auto flex items-center justify-center p-4 sm:p-5 bg-[var(--surface)] border border-[var(--primary)] rounded-full text-[var(--foreground)] shadow-[0_0_20px_rgba(16,185,129,0.3)] active:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 touch-manipulation group aspect-square"
            aria-label="Simulate Caregiver Ping"
          >
            <BellRing size={24} className="text-[var(--primary)] sm:w-7 sm:h-7 group-active:animate-ping" />
          </button>
        </div>
      </main>
    );
  }

  // Caregiver Mode: Full UI with all features - mobile first
  return (
    <main className="flex flex-col min-h-screen min-h-[100dvh] bg-[var(--background)] relative pb-20 sm:pb-24">
      {/* Heartbeat Prompt Overlay */}
      {currentHeartbeatPrompt && (
        <HeartbeatPromptOverlay
          prompt={currentHeartbeatPrompt}
          onDismiss={() => setCurrentHeartbeatPrompt(null)}
          onComplete={() => setCurrentHeartbeatPrompt(null)}
        />
      )}
      
      {/* Header Area - mobile optimized */}
      <div className="pt-6 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 bg-gradient-to-b from-[var(--surface)] to-transparent safe-top">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image src="/logo.png" alt="VoiceBack Logo" width={192} height={192} className="rounded-xl drop-shadow-sm" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">Good morning</h1>
              <p className="text-lg sm:text-xl text-[var(--foreground)] opacity-60">Ready for a great day?</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content - mobile optimized grid */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 space-y-4 sm:space-y-6">
        
        <div className="flex flex-col mt-2 sm:mt-4">
          {/* AI Conversation Row */}
          <Link href="/conversation" className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-[var(--foreground)]/5 rounded-2xl transition-colors duration-200 active:bg-[var(--foreground)]/10 touch-manipulation">
            <div className="shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform duration-300">
              <MessageSquare size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">AI Assistant</h2>
              <p className="text-[var(--foreground)] opacity-60 text-base sm:text-lg leading-snug">Practice conversation or ask for help with your daily tasks.</p>
            </div>
          </Link>

          <div className="px-4 sm:px-6 py-2">
            <hr className="border-[var(--border)]/50" />
          </div>

          {/* Therapy Practice Row */}
          <Link href="/therapy" className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-[var(--foreground)]/5 rounded-2xl transition-colors duration-200 active:bg-[var(--foreground)]/10 touch-manipulation">
            <div className="shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-105 transition-transform duration-300">
              <HeartPulse size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">Therapy Practice</h2>
              <p className="text-[var(--foreground)] opacity-60 text-base sm:text-lg leading-snug">Continue your speech exercises to improve your communication.</p>
            </div>
          </Link>

          <div className="px-4 sm:px-6 py-2">
            <hr className="border-[var(--border)]/50" />
          </div>

          {/* Caregiver View Row */}
          <Link href="/caregiver" className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-[var(--foreground)]/5 rounded-2xl transition-colors duration-200 active:bg-[var(--foreground)]/10 touch-manipulation">
            <div className="shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-105 transition-transform duration-300">
              <BellRing size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">Caregiver Dashboard</h2>
              <p className="text-[var(--foreground)] opacity-60 text-base sm:text-lg leading-snug">View and manage patient requests and notifications.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom ping button - mobile optimized */}
      <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6 flex justify-center z-40 pointer-events-none safe-bottom">
        <button 
          onClick={() => triggerManualPrompt()}
          className="pointer-events-auto flex items-center justify-center p-4 sm:p-5 bg-[var(--surface)] border border-[var(--primary)] rounded-full text-[var(--foreground)] shadow-[0_0_20px_rgba(16,185,129,0.3)] active:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 touch-manipulation group aspect-square"
          aria-label="Simulate Caregiver Ping"
        >
          <BellRing size={24} className="text-[var(--primary)] sm:w-7 sm:h-7 group-active:animate-ping" />
        </button>
      </div>


    </main>
  );
}
