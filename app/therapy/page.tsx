"use client";

import { useEffect, useState } from "react";
import { useVAD } from "@/hooks/useVAD";
import { Mic } from "lucide-react";
import { useAppStore } from "@/store/appStore";

export default function TherapyScreen() {
  const vad = useVAD();
  const { appState } = useAppStore();
  const [targetWord, setTargetWord] = useState("Apple");
  const [feedback, setFeedback] = useState("");

  const words = ["Apple", "Water", "Hello", "Yes", "No", "Please", "Thank you"];

  const nextWord = () => {
    setFeedback("");
    const currentIndex = words.indexOf(targetWord);
    const nextIndex = (currentIndex + 1) % words.length;
    setTargetWord(words[nextIndex]);
  };

  const handleTapMic = () => {
    if (vad.listening) {
      vad.pause();
    } else {
      vad.start();
    }
  };

  // We intercept the transcript state changes to provide feedback for therapy
  const { transcript } = useAppStore();
  
  useEffect(() => {
    if (appState === 'processing' && transcript.final) {
      // In a real app, we would hit a specific /api/therapy-score endpoint.
      // For MVP, we provide hardcoded positive reinforcement based on prompt: "Never show failure."
      const encouragements = [
        "Great try!",
        "Getting closer!",
        "You said it!",
        "Keep it up!",
        "Wonderful effort!"
      ];
      const randomFeedback = encouragements[Math.floor(Math.random() * encouragements.length)];
      setFeedback(randomFeedback);
    }
  }, [appState, transcript.final]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[var(--background)] text-center">
      <h1 className="text-2xl font-medium text-[var(--foreground)] opacity-70 mb-4">Therapy Practice</h1>
      
      <div className="mb-12">
        <p className="text-xl text-[var(--foreground)] opacity-50 mb-2">Try saying</p>
        <h2 className="text-6xl font-bold text-[var(--primary)]">{targetWord}</h2>
      </div>

      <button 
        onClick={handleTapMic}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          vad.listening 
            ? 'bg-[var(--primary)] text-white scale-105 shadow-[var(--primary)]/50' 
            : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface)]/80'
        }`}
      >
        <Mic size={64} />
      </button>

      <div className="h-24 mt-12 flex items-center justify-center">
        {feedback && (
          <p className="text-3xl font-bold text-green-400 animate-fade-in">{feedback}</p>
        )}
      </div>

      <button 
        onClick={nextWord}
        className="mt-8 px-6 py-3 bg-[var(--surface)] rounded-xl text-[var(--foreground)] hover:bg-white/10"
      >
        Next Word
      </button>
    </div>
  );
}
