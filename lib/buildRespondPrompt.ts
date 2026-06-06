import { getLanguageLabel } from '@/lib/languages';
import type { SessionPreferences } from '@/lib/sessionPreferences';
import type { ConversationTurn } from '@/store/appStore';

function formatConversationHistory(history: ConversationTurn[]): string {
  return history
    .map((turn) =>
      turn.role === 'caregiver' ? `Caregiver: "${turn.text}"` : `User: "${turn.text}"`,
    )
    .join('\n');
}

function getLatestCaregiverText(history: ConversationTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'caregiver') return history[i].text;
  }
  return '';
}

export function buildRespondPrompt(
  conversationHistory: ConversationTurn[],
  prefs: Pick<SessionPreferences, 'inputMode' | 'showImages' | 'showText' | 'language'>,
): string {
  const langName = getLanguageLabel(prefs.language);
  const needsTranslation = prefs.language !== 'en';
  const latestCaregiver = getLatestCaregiverText(conversationHistory);
  const historyBlock = formatConversationHistory(conversationHistory);

  const translationNote = needsTranslation
    ? `The caregiver spoke in English. Translate the latest question into ${langName} for the "question" field. Also include "questionOriginal" with the exact English transcript of the latest caregiver message.`
    : `Set "question" to the latest caregiver message. You may omit "questionOriginal".`;

  if (prefs.inputMode === 'type') {
    return `You are the core intelligence for VoiceBack, a communication aid for stroke survivors with expressive aphasia.
A caregiver has just spoken to the user. Use the full conversation for context. The latest caregiver message is the new question to address.

Conversation so far:
${historyBlock}

Latest caregiver message: "${latestCaregiver}"

The user will TYPE their own response using an on-screen keyboard in ${langName}.
${translationNote}
Do not generate response buttons. Return an empty responses array.

Return only valid JSON matching this schema:
{
  "question": "The question shown to the user (translated if needed)",
  "questionOriginal": "The English caregiver transcript",
  "responses": []
}
Do not return markdown formatting, only the raw JSON.`;
  }

  const buttonRules: string[] = [
    'Analyze what the caregiver said and provide exactly 3-4 possible response buttons for the user to tap.',
    'The user understands speech perfectly, but has trouble speaking.',
    'Always include a polite opt-out or help option if appropriate.',
  ];

  if (needsTranslation) {
    buttonRules.push(
      `Translate all button labels and spoken text into ${langName}.`,
      translationNote,
    );
  } else {
    buttonRules.push('Set "question" to the caregiver\'s transcript.');
  }

  if (prefs.showImages && prefs.showText) {
    buttonRules.push('Labels must be 1-2 words. Include a relevant single emoji for each option.');
  } else if (prefs.showImages && !prefs.showText) {
    buttonRules.push(
      'The user only wants emoji images, no text labels. Set every "label" to an empty string.',
      'Choose very clear, distinct emojis that communicate each option on their own.',
    );
  } else if (!prefs.showImages && prefs.showText) {
    buttonRules.push(
      'The user only wants text labels, no images. Set every "emoji" to an empty string.',
      'Labels must be 1-2 words and very clear.',
    );
  }

  buttonRules.push('The spoken text must sound natural when read aloud in the user\'s language.');

  return `You are the core intelligence for VoiceBack, a communication aid for stroke survivors with expressive aphasia.
A caregiver has just spoken to the user. Use the full conversation for context when choosing response buttons. The latest caregiver message is the new question to address.

Conversation so far:
${historyBlock}

Latest caregiver message: "${latestCaregiver}"

${buttonRules.join('\n')}

Return only valid JSON matching this schema:
{
  "question": "The question shown to the user (translated if needed)",
  "questionOriginal": "The English caregiver transcript (optional if English)",
  "responses": [
    {
      "label": "Button label (empty string if images only)",
      "spoken": "The full sentence TTS will read aloud",
      "emoji": "Relevant single emoji (empty string if text only)"
    }
  ]
}
Do not return markdown formatting, only the raw JSON.`;
}
