import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Sparkles } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  onShakeTrigger?: () => void;
  isShaking?: boolean;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  onShakeTrigger,
  isShaking = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 select-none font-sans">
      {/* Controls above phone on larger screens */}
      <div className="hidden sm:flex items-center gap-3 mb-3 text-xs text-neutral-400">
        <span className="font-semibold text-neutral-300">iPhone 12 Pro (390 × 844)</span>
        <span className="w-1 h-1 rounded-full bg-neutral-600" />
        <button
          onClick={onShakeTrigger}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Струсити телефон (Shake to Pay)</span>
        </button>
      </div>

      {/* Phone Body Container */}
      <div
        className={`w-full sm:w-[390px] h-screen sm:h-[844px] bg-black sm:rounded-[50px] sm:ring-12 sm:ring-neutral-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden transition-transform duration-200 ${
          isShaking ? 'animate-bounce ring-amber-500/50' : ''
        }`}
      >
        {/* iOS Notch / Dynamic Island */}
        <div className="relative z-50 w-full pt-3 px-7 flex items-center justify-between text-white text-xs font-semibold select-none bg-transparent">
          {/* Clock */}
          <span className="tracking-tight text-sm font-medium">{currentTime}</span>

          {/* Notch geometry */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160px] h-[30px] bg-black rounded-b-2xl flex items-center justify-center pointer-events-none">
            {/* Speaker bar */}
            <div className="w-12 h-1 bg-neutral-800 rounded-full mb-1" />
            {/* Camera dot */}
            <div className="absolute right-9 top-2.5 w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-800" />
          </div>

          {/* Status icons */}
          <div className="flex items-center gap-1.5 text-white">
            {/* Cell signal */}
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.5 h-1 bg-white rounded-2xs" />
              <div className="w-0.5 h-1.5 bg-white rounded-2xs" />
              <div className="w-0.5 h-2 bg-white rounded-2xs" />
              <div className="w-0.5 h-2.5 bg-white rounded-2xs" />
            </div>
            <Wifi className="w-3.5 h-3.5 text-white" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold">100%</span>
              <BatteryMedium className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
          {children}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="w-full pb-2 pt-1 flex justify-center bg-black/80 backdrop-blur-md">
          <div className="w-36 h-1 bg-neutral-500/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
