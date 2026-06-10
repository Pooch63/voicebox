"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ListeningIndicator } from "@/components/ListeningIndicator";
import { useAppStore } from "@/store/appStore";

const WORDS = ["Apple", "Water", "Hello", "Yes", "No", "Please", "Thank you"];

export default function TherapyScreen() {
  const { appState, setAppState } = useAppStore();
  const [sessionActive, setSessionActive] = useState(false);
  
  const [targetIndex, setTargetIndex] = useState(0);
  const targetWord = WORDS[targetIndex];

  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [scoreData, setScoreData] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stopTimeout = useRef<NodeJS.Timeout | null>(null);
  const sessionActiveRef = useRef(sessionActive);
  
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
  };

  if (!sessionActive) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--background)]">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center animate-fade-in text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">Speech Therapy</h1>
            <p className="text-xl opacity-70">
              Practice your pronunciation word by word.
            </p>
          </div>
          <button
            onClick={handleStartSession}
            className="flex items-center justify-center gap-2 px-10 h-16 rounded-full font-bold transition-all duration-200 active:scale-95 text-white shadow-xl bg-primary-gradient shadow-[var(--primary)]/30 hover:scale-[1.05] text-2xl"
          >
            Start Session
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[var(--background)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--surface)] bg-[var(--surface)]/30 p-6 flex flex-col">
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
          className="mt-6 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface)]/80 transition-colors font-medium text-center border border-[var(--surface)] shadow-sm"
        >
          End Session
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="mb-12 flex flex-col items-center">
          <p className="text-2xl text-[var(--foreground)] opacity-50 mb-6">Please say</p>
          {iconUrl && (
            <img 
              src={iconUrl} 
              alt={`Icon for ${targetWord}`}
              className="w-40 h-40 mb-8 object-contain animate-fade-in drop-shadow-xl"
            />
          )}
          <h2 className="text-8xl font-bold text-[var(--primary)] animate-scale-in drop-shadow-md">{targetWord}</h2>
        </div>

        <div className="flex justify-center h-32 items-center">
          {isRecording ? (
            <ListeningIndicator onStart={() => {}} isActive={true} />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
               {appState === 'processing' && <span className="opacity-50 text-xl font-medium animate-pulse">Analyzing pronunciation...</span>}
            </div>
          )}
        </div>

        <div className="h-40 mt-8 flex flex-col items-center justify-center">
          {feedback && (
            <p className={`text-4xl font-bold animate-fade-in drop-shadow-md ${scoreData?.score > 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
              {feedback}
            </p>
          )}
          {scoreData && (
            <div className="mt-6 text-base text-[var(--foreground)] opacity-90 animate-fade-in text-center bg-[var(--surface)]/60 p-5 rounded-2xl shadow-sm border border-[var(--surface)]">
              <p className="font-bold mb-2 text-xl">Score: {(scoreData.score * 100).toFixed(0)}%</p>
              <p className="text-sm opacity-80 flex gap-4 justify-center">
                <span>Clarity: {(scoreData.details.clarityScore * 100).toFixed(0)}%</span>
                <span>Speed: {(scoreData.details.speedScore * 100).toFixed(0)}%</span>
              </p>
              <p className="text-sm opacity-70 mt-2 italic">
                Heard: "{scoreData.details.transcript}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
