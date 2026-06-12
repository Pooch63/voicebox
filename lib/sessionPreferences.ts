export type InputMode = 'type' | 'select';
export type ChoiceInteraction = 'tap' | 'cycle';
export type AppMode = 'caregiver' | 'victim';

export interface SessionPreferences {
  inputMode: InputMode;
  choiceInteraction: ChoiceInteraction;
  showImages: boolean;
  showText: boolean;
  language: string;
}

export const DEFAULT_SESSION_PREFERENCES: SessionPreferences = {
  inputMode: 'select',
  choiceInteraction: 'tap',
  showImages: true,
  showText: true,
  language: 'en',
};

// Mode management utilities
const MODE_STORAGE_KEY = 'voiceback-app-mode';

export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'caregiver';
  return (localStorage.getItem(MODE_STORAGE_KEY) as AppMode) || 'caregiver';
}

export function setAppMode(mode: AppMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}
