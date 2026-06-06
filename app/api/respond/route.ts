import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildRespondPrompt } from '@/lib/buildRespondPrompt';
import {
  DEFAULT_SESSION_PREFERENCES,
  type SessionPreferences,
} from '@/lib/sessionPreferences';
import type { ConversationTurn } from '@/store/appStore';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RespondRequestBody {
  transcript?: string;
  conversationHistory?: ConversationTurn[];
  inputMode?: SessionPreferences['inputMode'];
  choiceInteraction?: SessionPreferences['choiceInteraction'];
  showImages?: boolean;
  showText?: boolean;
  language?: string;
}

function getLatestCaregiverText(history: ConversationTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'caregiver') return history[i].text;
  }
  return '';
}

function resolveConversationHistory(body: RespondRequestBody): ConversationTurn[] {
  if (body.conversationHistory?.length) {
    return body.conversationHistory;
  }
  if (body.transcript?.trim()) {
    return [{ role: 'caregiver', text: body.transcript.trim() }];
  }
  return [];
}

function resolvePreferences(body: RespondRequestBody): SessionPreferences {
  return {
    inputMode: body.inputMode ?? DEFAULT_SESSION_PREFERENCES.inputMode,
    choiceInteraction: body.choiceInteraction ?? DEFAULT_SESSION_PREFERENCES.choiceInteraction,
    showImages: body.showImages ?? DEFAULT_SESSION_PREFERENCES.showImages,
    showText: body.showText ?? DEFAULT_SESSION_PREFERENCES.showText,
    language: body.language ?? DEFAULT_SESSION_PREFERENCES.language,
  };
}

function defaultResponses(prefs: SessionPreferences) {
  const isEnglish = prefs.language === 'en';
  return [
    { label: isEnglish ? 'Yes' : 'Sí', spoken: isEnglish ? 'Yes.' : 'Sí.', emoji: '✅' },
    { label: isEnglish ? 'No' : 'No', spoken: isEnglish ? 'No.' : 'No.', emoji: '❌' },
    { label: isEnglish ? 'Help' : 'Ayuda', spoken: isEnglish ? 'I need some help please.' : 'Necesito ayuda, por favor.', emoji: '🙋' },
    { label: isEnglish ? 'Say again' : 'Otra vez', spoken: isEnglish ? 'Could you say that again?' : '¿Podría repetir eso?', emoji: '🔄' },
  ];
}

export async function POST(req: Request) {
  let conversationHistory: ConversationTurn[] = [];
  let prefs = DEFAULT_SESSION_PREFERENCES;

  try {
    const body: RespondRequestBody = await req.json();
    conversationHistory = resolveConversationHistory(body);
    prefs = resolvePreferences(body);

    const latestCaregiver = getLatestCaregiverText(conversationHistory);
    console.log(
      '[VoiceBox] /api/respond received history:',
      conversationHistory.length,
      'turns, latest:',
      latestCaregiver,
      'prefs:',
      prefs,
    );

    if (!latestCaregiver) {
      return NextResponse.json({ error: 'Conversation history is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
    }

    const prompt = buildRespondPrompt(conversationHistory, prefs);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: prefs.inputMode === 'type' ? 200 : 400,
      temperature: 0.2,
      system: 'Return only valid JSON. Do not wrap in markdown or backticks.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const contentBlock = message.content[0];
    let responseText = '';

    if (contentBlock.type === 'text') {
      responseText = contentBlock.text;
    } else {
      throw new Error('Unexpected response type from Anthropic');
    }

    const data = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));

    return NextResponse.json({
      question: data.question ?? latestCaregiver,
      questionOriginal: data.questionOriginal ?? latestCaregiver,
      responses: prefs.inputMode === 'type' ? [] : (data.responses ?? []),
    });
  } catch (error) {
    console.error('Error in /api/respond:', error);
    const fallback = getLatestCaregiverText(conversationHistory);
    return NextResponse.json({
      question: fallback || 'What would you like to say?',
      questionOriginal: fallback,
      responses: prefs.inputMode === 'type' ? [] : defaultResponses(prefs),
    });
  }
}
