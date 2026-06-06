import { create } from 'zustand';
import type { SessionPreferences } from '@/lib/sessionPreferences';

export type AppState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface ResponseOption {
  label: string;
  spoken: string;
  emoji: string;
}

export interface ConversationTurn {
  role: 'caregiver' | 'user';
  text: string;
}

export interface AppStoreState {
  appState: AppState;
  sessionStarted: boolean;
  sessionPreferences: SessionPreferences | null;
  conversationHistory: ConversationTurn[];
  transcript: {
    live: string;
    final: string;
    question: string;
    questionOriginal: string;
  };
  responseOptions: ResponseOption[];
  connectionHealth: {
    deepgram: boolean;
    mic: boolean;
  };
  errorMsg: string | null;

  // Actions
  startSession: (prefs: SessionPreferences) => void;
  endSession: () => void;
  setAppState: (state: AppState) => void;
  setLiveTranscript: (text: string) => void;
  setFinalTranscript: (text: string) => void;
  clearDisplayTranscript: () => void;
  addConversationTurn: (role: ConversationTurn['role'], text: string) => void;
  setQuestion: (question: string, questionOriginal?: string) => void;
  setResponseOptions: (options: ResponseOption[]) => void;
  setConnectionHealth: (health: Partial<AppStoreState['connectionHealth']>) => void;
  setErrorMsg: (msg: string | null) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  appState: 'idle',
  sessionStarted: false,
  sessionPreferences: null,
  conversationHistory: [],
  transcript: {
    live: '',
    final: '',
    question: '',
    questionOriginal: '',
  },
  responseOptions: [],
  connectionHealth: {
    deepgram: true,
    mic: true,
  },
  errorMsg: null,

  startSession: (prefs) =>
    set({
      sessionStarted: true,
      sessionPreferences: prefs,
      appState: 'idle',
      conversationHistory: [],
      transcript: { live: '', final: '', question: '', questionOriginal: '' },
      responseOptions: [],
      errorMsg: null,
    }),
  endSession: () =>
    set({
      sessionStarted: false,
      sessionPreferences: null,
      appState: 'idle',
      conversationHistory: [],
      transcript: { live: '', final: '', question: '', questionOriginal: '' },
      responseOptions: [],
      errorMsg: null,
    }),
  setAppState: (state) => set({ appState: state }),
  setLiveTranscript: (text) =>
    set((state) => ({ transcript: { ...state.transcript, live: text } })),
  setFinalTranscript: (text) =>
    set((state) => ({ transcript: { ...state.transcript, final: text } })),
  clearDisplayTranscript: () =>
    set((state) => ({
      transcript: { ...state.transcript, live: '', final: '' },
    })),
  addConversationTurn: (role, text) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, { role, text }],
    })),
  setQuestion: (question, questionOriginal) =>
    set((state) => ({
      transcript: {
        ...state.transcript,
        question,
        questionOriginal: questionOriginal ?? question,
      },
    })),
  setResponseOptions: (options) => set({ responseOptions: options }),
  setConnectionHealth: (health) =>
    set((state) => ({ connectionHealth: { ...state.connectionHealth, ...health } })),
  setErrorMsg: (msg) => set({ errorMsg: msg }),
}));
