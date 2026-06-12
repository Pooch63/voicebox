import { useState, useEffect, useCallback, useRef } from 'react';

export type HeartbeatPromptType = 'hunger_check' | 'therapy_prompt';

export type HeartbeatPrompt = {
  id: string;
  type: HeartbeatPromptType;
  question: string;
  therapyWord?: string;
  timestamp: number;
};

type HeartbeatConfig = {
  enabled: boolean;
  intervalMinutes: number;
  onPrompt: (prompt: HeartbeatPrompt) => void;
};

/**
 * Client-side heartbeat system that alternates between hunger checks and therapy prompts
 */
export function useHeartbeat({ enabled, intervalMinutes, onPrompt }: HeartbeatConfig) {
  const [lastPrompt, setLastPrompt] = useState<HeartbeatPrompt | null>(null);
  const [nextPromptAt, setNextPromptAt] = useState<number | null>(null);
  const [therapyWords, setTherapyWords] = useState<string[]>([
    'Apple', 'Water', 'Hello', 'Yes', 'No', 'Please', 'Thank you', 'Help', 'Good', 'Food'
  ]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypeRef = useRef<HeartbeatPromptType>('hunger_check');

  // Load therapy words from API
  useEffect(() => {
    const loadTherapyWords = async () => {
      try {
        const res = await fetch('/api/therapy-words');
        if (res.ok) {
          const data = await res.json();
          const activeList = data.wordLists?.find((list: any) => list.is_active);
          if (activeList && activeList.words.length > 0) {
            setTherapyWords(activeList.words);
          }
        }
      } catch (error) {
        console.log('Could not load therapy words, using defaults');
      }
    };
    
    if (enabled) {
      loadTherapyWords();
    }
  }, [enabled]);

  const generatePrompt = useCallback((typeOverride?: HeartbeatPromptType): HeartbeatPrompt => {
    // Alternate between hunger check and therapy prompt if no override
    let nextType: HeartbeatPromptType;
    if (typeOverride) {
      nextType = typeOverride;
    } else {
      nextType = lastTypeRef.current === 'hunger_check' ? 'therapy_prompt' : 'hunger_check';
      lastTypeRef.current = nextType;
    }

    if (nextType === 'hunger_check') {
      return {
        id: `heartbeat-${Date.now()}`,
        type: 'hunger_check',
        question: 'Are you hungry?',
        timestamp: Date.now()
      };
    } else {
      // Pick a random therapy word
      const randomWord = therapyWords[Math.floor(Math.random() * therapyWords.length)];
      return {
        id: `heartbeat-${Date.now()}`,
        type: 'therapy_prompt',
        question: `Please say the word: ${randomWord}`,
        therapyWord: randomWord,
        timestamp: Date.now()
      };
    }
  }, [therapyWords]);

  const triggerPrompt = useCallback((typeOverride?: HeartbeatPromptType, isManual: boolean = false) => {
    if (!enabled && !isManual) return;
    
    const prompt = generatePrompt(typeOverride);
    setLastPrompt(prompt);
    onPrompt(prompt);
    
    // Schedule next prompt if enabled
    if (enabled) {
      const nextTime = Date.now() + (intervalMinutes * 60 * 1000);
      setNextPromptAt(nextTime);
    }
  }, [enabled, intervalMinutes, generatePrompt, onPrompt]);

  // Start/stop heartbeat
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setNextPromptAt(null);
      return;
    }

    // Set initial next prompt time if not set
    if (!nextPromptAt) {
      const initialTime = Date.now() + (intervalMinutes * 60 * 1000);
      setNextPromptAt(initialTime);
    }

    // Check every 10 seconds if it's time for a prompt
    intervalRef.current = setInterval(() => {
      if (nextPromptAt && Date.now() >= nextPromptAt) {
        triggerPrompt();
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMinutes, nextPromptAt, triggerPrompt]);

  const resetTimer = useCallback(() => {
    const nextTime = Date.now() + (intervalMinutes * 60 * 1000);
    setNextPromptAt(nextTime);
  }, [intervalMinutes]);

  const triggerManualPrompt = useCallback((typeOverride?: HeartbeatPromptType) => {
    triggerPrompt(typeOverride, true);
  }, [triggerPrompt]);

  return {
    lastPrompt,
    nextPromptAt,
    resetTimer,
    triggerManualPrompt
  };
}
