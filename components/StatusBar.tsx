import { useAppStore } from '@/store/appStore';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export const StatusBar = () => {
  const { connectionHealth, errorMsg } = useAppStore();

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-center bg-[var(--background)]/80 backdrop-blur-sm border-t border-white/5 z-50">
      <div className="flex items-center space-x-6 text-sm">
        {/* Deepgram connection status */}
        <div className={`flex items-center space-x-2 ${connectionHealth.deepgram ? 'text-[var(--primary)]' : 'text-yellow-500'}`}>
          {connectionHealth.deepgram ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{connectionHealth.deepgram ? 'STT Connected' : 'STT Disconnected'}</span>
        </div>

        {/* Global Error Message */}
        {errorMsg && (
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="text-xs opacity-40">VoiceBack System</div>
    </div>
  );
};
