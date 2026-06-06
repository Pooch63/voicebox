export type InputMode = 'type' | 'select';
export type ChoiceInteraction = 'tap' | 'cycle';

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
