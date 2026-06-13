import { useEffect, useRef, useMemo } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { useAppStore } from '@/store/appStore';
import { useDeepgram } from './useDeepgram';
import { useResponseEngine } from './useResponseEngine';

function shouldSuppressCaregiverVad(): boolean {
  const { appState, awaitingUserResponse } = useAppStore.getState();
  return (
    awaitingUserResponse ||
    appState === 'processing' ||
    appState === 'speaking'
  );
}

export const useVAD = () => {
  const micSessionActive = useAppStore((state) => state.micSessionActive);
  const appState = useAppStore((state) => state.appState);
  const awaitingUserResponse = useAppStore((state) => state.awaitingUserResponse);
  const {
    setAppState,
    setConnectionHealth,
    setFinalTranscript,
    clearDisplayTranscript,
    addConversationTurn,
    setResponseOptions,
  } = useAppStore();
  const { connect, disconnect, sendAudioFrame, getFinalTranscript } = useDeepgram();
  const { generateResponses } = useResponseEngine();

  const fnsRef = useRef({
    sendAudioFrame, connect, disconnect, getFinalTranscript, generateResponses,
    setAppState, setFinalTranscript, clearDisplayTranscript, addConversationTurn, setResponseOptions
  });
  fnsRef.current = {
    sendAudioFrame, connect, disconnect, getFinalTranscript, generateResponses,
    setAppState, setFinalTranscript, clearDisplayTranscript, addConversationTurn, setResponseOptions
  };

  const options = useMemo(() => ({
    startOnLoad: false,
    baseAssetPath: '/',
    onnxWASMBasePath: '/',
    positiveSpeechThreshold: 0.5, // Reduced for better sensitivity
    negativeSpeechThreshold: 0.4,
    preSpeechPadMs: 300,
    redemptionMs: 600,              // Don't snap shut mid-sentence
    onFrameProcessed: (_probs: any, frame: Float32Array) => {
      fnsRef.current.sendAudioFrame(frame);
    },
    onSpeechStart: () => {
      if (shouldSuppressCaregiverVad()) {
        console.log('[VoiceBox] Speech ignored — awaiting user response or busy');
        return;
      }
      console.log('[VoiceBox] Speech started');
      fnsRef.current.clearDisplayTranscript();
      fnsRef.current.setResponseOptions([]);
      fnsRef.current.setAppState('listening');
      fnsRef.current.connect();
    },
    onSpeechEnd: async (audio: Float32Array) => {
      const durationSec = (audio.length / 16000).toFixed(2);
      console.log(`[VoiceBox] Speech ended (${audio.length} samples, ~${durationSec}s)`);
      fnsRef.current.disconnect();
      fnsRef.current.setAppState('processing');

      const finalTranscript = await fnsRef.current.getFinalTranscript(audio, 16000);
      console.log('[VoiceBox] Final transcript:', finalTranscript || '(empty)');

      if (finalTranscript) {
        fnsRef.current.setFinalTranscript(finalTranscript);
        fnsRef.current.addConversationTurn('caregiver', finalTranscript);
        await fnsRef.current.generateResponses();
      } else {
        fnsRef.current.setAppState('idle');
      }
    },
    onVADMisfire: () => {
      console.log('[VoiceBox] VAD misfire — speech too short, discarding');
      fnsRef.current.disconnect();
      fnsRef.current.clearDisplayTranscript();
      fnsRef.current.setAppState('idle');
    },
  }), []);

  const vad = useMicVAD(options);

  const { pause: pauseVad, start: startVad, loading: vadLoading, errored: vadErrored } = vad;

  // Pause while a question is posed or the user is answering; resume for next caregiver turn
  useEffect(() => {
    if (!micSessionActive || vadLoading || vadErrored) return;

    const suppress = shouldSuppressCaregiverVad();
    if (suppress) {
      void pauseVad();
    } else {
      void startVad();
    }
  }, [micSessionActive, appState, awaitingUserResponse, vadLoading, vadErrored, pauseVad, startVad]);

  // Track mic health - only mark as errored when VAD actually fails
  useEffect(() => {
    if (vad.errored) {
      setConnectionHealth({ mic: false });
      setAppState('error');
    } else if (micSessionActive && !vad.loading) {
      // Only set to true once we've successfully started
      setConnectionHealth({ mic: true });
    }
  }, [vad.errored, vad.loading, micSessionActive, setConnectionHealth, setAppState]);

  return vad;
};
