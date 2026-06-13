import { useCallback, useRef, useState, useMemo } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';

/**
 * Unified microphone hook using VAD for automatic speech detection.
 * 
 * Replaces all inline MediaRecorder implementations. The microphone
 * listens until the user stops speaking — no manual stop needed.
 * 
 * Usage:
 *   const mic = useMicrophone({ onSpeechEnd: (blob) => { ... } });
 *   mic.start();  // Begin listening
 *   mic.stop();   // Cancel listening
 */

type UseMicrophoneConfig = {
  /** Called when speech ends with the captured audio as a Blob */
  onSpeechEnd: (audioBlob: Blob, rawAudio: Float32Array) => void;
  /** Called when speech starts */
  onSpeechStart?: () => void;
  /** Called on VAD misfire (speech too short) */
  onMisfire?: () => void;
  /** Whether to start listening immediately on mount (default: false) */
  startOnLoad?: boolean;
};

/**
 * Convert Float32 PCM samples (from VAD) to a WAV Blob suitable for API upload.
 */
function float32ToWavBlob(audioData: Float32Array, sampleRate: number = 16000): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const dataLength = audioData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useMicrophone({
  onSpeechEnd,
  onSpeechStart,
  onMisfire,
  startOnLoad = false,
}: UseMicrophoneConfig) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const callbacksRef = useRef({ onSpeechEnd, onSpeechStart, onMisfire });
  callbacksRef.current = { onSpeechEnd, onSpeechStart, onMisfire };

  const options = useMemo(() => ({
    startOnLoad,
    baseAssetPath: '/',
    onnxWASMBasePath: '/',
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.4,
    preSpeechPadMs: 300,
    redemptionMs: 600,
    onSpeechStart: () => {
      console.log('[useMicrophone] Speech started');
      setIsListening(true);
      callbacksRef.current.onSpeechStart?.();
    },
    onSpeechEnd: (audio: Float32Array) => {
      const durationSec = (audio.length / 16000).toFixed(2);
      console.log(`[useMicrophone] Speech ended (${audio.length} samples, ~${durationSec}s)`);
      setIsListening(false);
      setIsProcessing(true);

      const wavBlob = float32ToWavBlob(audio, 16000);
      callbacksRef.current.onSpeechEnd(wavBlob, audio);
    },
    onVADMisfire: () => {
      console.log('[useMicrophone] VAD misfire — speech too short');
      setIsListening(false);
      callbacksRef.current.onMisfire?.();
    },
  }), [startOnLoad]);

  const vad = useMicVAD(options);

  const start = useCallback(() => {
    setIsListening(false);
    setIsProcessing(false);
    vad.start();
  }, [vad]);

  const stop = useCallback(() => {
    vad.pause();
    setIsListening(false);
    setIsProcessing(false);
  }, [vad]);

  const clearProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  return {
    /** Start the VAD — mic will listen for speech automatically */
    start,
    /** Stop/pause the VAD */
    stop,
    /** Whether VAD has detected active speech right now */
    isListening,
    /** Whether audio is being processed after speech ended */
    isProcessing,
    /** Clear the processing state (call after your API response completes) */
    clearProcessing,
    /** Whether the VAD model is still loading */
    loading: vad.loading,
    /** Whether the VAD errored */
    errored: vad.errored,
  };
}

export { float32ToWavBlob };
