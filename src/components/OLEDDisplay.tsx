import React from 'react';
import { TransportState, VUMeterData } from '../types';

interface OLEDDisplayProps {
  transport: TransportState;
  bankName: string;
  vuData: VUMeterData;
  onTapTempo: () => void;
  onBpmChange: (bpm: number) => void;
}

export const OLEDDisplay: React.FC<OLEDDisplayProps> = ({
  transport,
  onTapTempo,
  onBpmChange,
  vuData
}) => {
  return (
    <div className="bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-5 w-full shadow-sm">
      {/* Top Row: BPM & Key */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-1">Tempo</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">{transport.bpm.toFixed(1)}</span>
            <span className="text-sm font-medium text-neutral-500">BPM</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-1">Key</span>
          <span className="text-xl font-bold text-white tracking-tight">{transport.key}</span>
        </div>
      </div>

      {/* Middle Row: BPM Controls & Bar */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-1.5 bg-[#2C2C2E] rounded-full p-1.5">
            <button onClick={() => onBpmChange(transport.bpm - 1)} className="w-8 h-8 rounded-full bg-[#3A3A3C] flex items-center justify-center text-sm font-semibold active:scale-95 transition-transform text-white">-</button>
            <button onClick={onTapTempo} className="px-4 text-xs font-bold text-white active:opacity-70 tracking-wide uppercase">Tap</button>
            <button onClick={() => onBpmChange(transport.bpm + 1)} className="w-8 h-8 rounded-full bg-[#3A3A3C] flex items-center justify-center text-sm font-semibold active:scale-95 transition-transform text-white">+</button>
         </div>
         <div className="flex items-baseline gap-1 font-medium tracking-tight">
            <span className="text-lg text-white">{String(transport.currentBar).padStart(2, '0')}</span>
            <span className="text-neutral-500">:</span>
            <span className="text-lg text-white">{transport.currentBeat}</span>
         </div>
      </div>

      {/* VU Meters */}
      <div className="flex flex-col gap-1.5 w-full mt-2">
         <div className="h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-75 ease-out" style={{ width: `${vuData.left * 100}%` }} />
         </div>
         <div className="h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-75 ease-out" style={{ width: `${vuData.right * 100}%` }} />
         </div>
      </div>
    </div>
  );
};
