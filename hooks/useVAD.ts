import { useEffect } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { useAppStore } from '@/store/appStore';
import { useDeepgram } from './useDeepgram';
import { useResponseEngine } from './useResponseEngine';

export const useVAD = () => {
  const {
    setAppState,
    setConnectionHealth,
    setFinalTranscript,
    setLiveTranscript,
    clearDisplayTranscript,
    addConversationTurn,
    setResponseOptions,
  } = useAppStore();
  const { connect, disconnect, sendAudioFrame, getFinalTranscript } = useDeepgram();
  const { generateResponses } = useResponseEngine();

  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath: '/',
    onnxWASMBasePath: '/',
    positiveSpeechThreshold: 0.85, // High threshold for home environments
    negativeSpeechThreshold: 0.4,
    preSpeechPadMs: 300,
    redemptionMs: 600,              // Don't snap shut mid-sentence
    onFrameProcessed: (_probs, frame) => {
      sendAudioFrame(frame);
    },
    onSpeechStart: () => {
      console.log('[VoiceBox] Speech started');
      clearDisplayTranscript();
      setResponseOptions([]);
      setAppState('listening');
      connect();
    },
    onSpeechEnd: async (audio) => {
      const durationSec = (audio.length / 16000).toFixed(2);
      console.log(`[VoiceBox] Speech ended (${audio.length} samples, ~${durationSec}s)`);
      disconnect();
      setAppState('processing');

      const finalTranscript = await getFinalTranscript(audio, 16000);
      console.log('[VoiceBox] Final transcript:', finalTranscript || '(empty)');

      if (finalTranscript) {
        setFinalTranscript(finalTranscript);
        addConversationTurn('caregiver', finalTranscript);
        await generateResponses();
      } else {
        setAppState('idle');
      }
    },
    onVADMisfire: () => {
      console.log('[VoiceBox] VAD misfire — speech too short, discarding');
      disconnect();
      clearDisplayTranscript();
      setAppState('idle');
    },
  });

  // Track mic health
  useEffect(() => {
    if (vad.errored) {
      setConnectionHealth({ mic: false });
      setAppState('error');
    } else {
      setConnectionHealth({ mic: true });
    }
  }, [vad.errored, setConnectionHealth, setAppState]);

  return vad;
};
