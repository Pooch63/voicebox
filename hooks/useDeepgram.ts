import { useEffect, useRef, useCallback } from 'react';
import { DeepgramClient } from '@deepgram/sdk';
import type { V1Socket } from '@deepgram/sdk/listen/v1';
import { useAppStore } from '@/store/appStore';

const float32ToInt16 = (audioData: Float32Array): Uint8Array => {
  const buffer = new ArrayBuffer(audioData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < audioData.length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
};

export const useDeepgram = () => {
  const { setLiveTranscript, setConnectionHealth } = useAppStore();
  const connectionRef = useRef<V1Socket | null>(null);
  const pendingFramesRef = useRef<Uint8Array[]>([]);
  const tokenRef = useRef<string | null>(null);

  // Fetch token
  useEffect(() => {
    let mounted = true;
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/deepgram/token');
        if (res.ok) {
          const data = await res.json();
          if (mounted) tokenRef.current = data.key;
        }
      } catch (err) {
        console.error('Failed to fetch deepgram token', err);
      }
    };
    fetchToken();
    return () => { mounted = false; };
  }, []);

  const connect = useCallback(() => {
    if (!tokenRef.current) return;
    if (connectionRef.current) return;

    try {
      const deepgram = new DeepgramClient({ apiKey: tokenRef.current });
      deepgram.listen.v1
        .connect({
          model: 'nova-2',
          punctuate: true,
          smart_format: true,
          interim_results: true,
          encoding: 'linear16',
          sample_rate: 16000,
          Authorization: tokenRef.current,
        })
        .then((connection) => {
          connection.on('open', () => {
            setConnectionHealth({ deepgram: true });

            for (const frame of pendingFramesRef.current) {
              connection.sendMedia(frame);
            }
            pendingFramesRef.current = [];
            
            // Keepalive every 8 seconds to prevent timeout
            const keepAlive = setInterval(() => {
              if (connection.readyState === 1 /* OPEN */) {
                connection.sendKeepAlive({ type: 'KeepAlive' });
              }
            }, 8000);

            connection.on('close', () => {
              clearInterval(keepAlive);
              setConnectionHealth({ deepgram: false });
              connectionRef.current = null;
              pendingFramesRef.current = [];
            });

            connection.on('message', (data) => {
              if ('channel' in data) {
                const transcript = data.channel?.alternatives?.[0]?.transcript;
                if (transcript) {
                  setLiveTranscript(transcript);
                  if (data.is_final) {
                    console.log('[VoiceBox] Live final segment:', transcript);
                  }
                }
              }
            });

            connection.on('error', (err) => {
              console.error('Deepgram socket error:', err);
            });
          });

          connectionRef.current = connection;
        })
        .catch((err) => {
          console.error('Failed to connect to Deepgram live:', err);
          setConnectionHealth({ deepgram: false });
        });
    } catch (err) {
      console.error('Failed to connect to Deepgram live:', err);
      setConnectionHealth({ deepgram: false });
    }
  }, [setLiveTranscript, setConnectionHealth]);

  const disconnect = useCallback(() => {
    pendingFramesRef.current = [];
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
  }, []);

  const sendAudioFrame = useCallback((frame: Float32Array) => {
    const pcm = float32ToInt16(frame);
    const connection = connectionRef.current;
    if (connection?.readyState === 1) {
      connection.sendMedia(pcm);
    } else {
      pendingFramesRef.current.push(pcm);
    }
  }, []);

  // Use this to get final transcript from the VAD buffer
  const getFinalTranscript = useCallback(async (audioData: Float32Array, sampleRate: number): Promise<string> => {
    if (!tokenRef.current) return '';
    try {
      const pcm = float32ToInt16(audioData);

      const res = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true&encoding=linear16&sample_rate=${sampleRate}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${tokenRef.current}`,
          'Content-Type': 'application/octet-stream',
        },
        body: pcm,
      });

      if (!res.ok) throw new Error('Deepgram REST error');
      const data = await res.json();
      return data.results?.channels[0]?.alternatives[0]?.transcript || '';
    } catch (err) {
      console.error('Failed to get final transcript:', err);
      return '';
    }
  }, []);

  return { connect, disconnect, sendAudioFrame, getFinalTranscript };
};
