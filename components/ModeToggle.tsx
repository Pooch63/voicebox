"use client";

import { useEffect, useState } from "react";
import { User, UserCog } from "lucide-react";
import { getAppMode, setAppMode, type AppMode } from "@/lib/sessionPreferences";

export function ModeToggle() {
  const [mode, setMode] = useState<AppMode>('caregiver');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setMode(getAppMode());
  }, []);

  const toggleMode = () => {
    const newMode = mode === 'caregiver' ? 'victim' : 'caregiver';
    setMode(newMode);
    setAppMode(newMode);
    // Reload to apply mode changes
    window.location.reload();
  };

  if (!isClient) return null;

  return (
    <button
      onClick={toggleMode}
      className={`flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full font-medium transition-all duration-200 shadow-md touch-manipulation active:scale-95 ${
        mode === 'victim'
          ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-600'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-300'
      }`}
      title={mode === 'victim' ? 'Switch to Caregiver Mode' : 'Switch to Simple Mode'}
    >
      {mode === 'victim' ? (
        <>
          <User size={20} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Simple Mode</span>
        </>
      ) : (
        <>
          <UserCog size={20} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Caregiver Mode</span>
        </>
      )}
    </button>
  );
}
