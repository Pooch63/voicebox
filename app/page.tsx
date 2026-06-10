"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, HeartPulse, BellRing, Settings2 } from "lucide-react";
import { IncomingCallOverlay } from "@/components/IncomingCallOverlay";

export default function Dashboard() {
  const [showPing, setShowPing] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-[var(--background)] relative pb-24">
      {/* Header Area */}
      <div className="pt-12 pb-8 px-6 bg-gradient-to-b from-[var(--surface)] to-transparent">
        <div className="flex justify-between items-start max-w-4xl mx-auto w-full">
          <div>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Good morning</h1>
            <p className="text-xl text-[var(--foreground)] opacity-60">Ready for a great day?</p>
          </div>
          <button className="p-3 bg-[var(--surface)] rounded-full text-[var(--foreground)] hover:bg-white/10 transition-colors shadow-sm">
            <Settings2 size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* AI Conversation Card */}
          <Link href="/conversation" className="group relative overflow-hidden bg-[var(--surface)] rounded-3xl p-8 shadow-md border border-[var(--border)]/50 hover:shadow-xl hover:border-[var(--primary)]/50 transition-all duration-300">
            <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">AI Assistant</h2>
            <p className="text-[var(--foreground)] opacity-60 text-lg">Practice conversation or ask for help with your daily tasks.</p>
          </Link>

          {/* Therapy Practice Card */}
          <Link href="/therapy" className="group relative overflow-hidden bg-[var(--surface)] rounded-3xl p-8 shadow-md border border-[var(--border)]/50 hover:shadow-xl hover:border-green-500/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform duration-300">
              <HeartPulse size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Therapy Practice</h2>
            <p className="text-[var(--foreground)] opacity-60 text-lg">Continue your speech exercises to improve your communication.</p>
          </Link>
        </div>
      </div>

      {/* Groundwork: Bottom prominent ping button for testing/simulation */}
      <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={() => setShowPing(true)}
          className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-[var(--surface)] border border-[var(--primary)] rounded-full text-[var(--foreground)] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1 group"
        >
          <BellRing size={24} className="text-[var(--primary)] group-hover:animate-ping" />
          <span className="font-semibold text-lg">Simulate Caregiver Ping</span>
        </button>
      </div>

      <IncomingCallOverlay 
        isVisible={showPing} 
        onDismiss={() => setShowPing(false)} 
      />
    </main>
  );
}
