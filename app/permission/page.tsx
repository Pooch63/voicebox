"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PermissionScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If successful, stop the tracks right away just to release the mic
      stream.getTracks().forEach((track) => track.stop());
      // Go back to main screen
      router.push("/");
    } catch (err) {
      setError("We couldn't access your microphone. Please check your browser settings to allow microphone access, then try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[var(--background)]">
      <div className="w-24 h-24 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--primary)] mb-8">
        <Mic size={48} />
      </div>
      
      <h1 className="text-4xl font-bold mb-6 text-[var(--foreground)]">We need to hear you</h1>
      
      <p className="text-xl mb-12 max-w-lg text-[var(--foreground)] opacity-80 leading-relaxed">
        VoiceBack uses your microphone to listen to questions and suggest answers. 
        Everything stays private and is only used to help you communicate.
      </p>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 max-w-md">
          {error}
        </div>
      )}

      <button 
        onClick={requestPermission}
        className="px-8 py-4 bg-[var(--primary)] text-[var(--background)] text-2xl font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-[var(--primary)]/20"
      >
        Allow Microphone
      </button>
    </div>
  );
}
