import React from 'react';
import { TransportState } from '../types';

interface TransportDeckProps {
  transport: TransportState;
  isRecording: boolean;
  onPlayPause: () => void;
  onCue: () => void;
  onToggleSync: () => void;
  onToggleQuantize: () => void;
  onToggleRecord: () => void;
}

export const TransportDeck: React.FC<TransportDeckProps> = ({
  transport, isRecording, onPlayPause, onCue, onToggleSync, onToggleQuantize, onToggleRecord
}) => {
  const isPlaying = transport.playbackState === 'playing';

  return (
    <div className="bg-[#1C1C1E] rounded-3xl p-4 flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center px-4">
         <button onClick={onCue} className="w-14 h-14 rounded-full bg-[#2C2C2E] text-white flex items-center justify-center font-bold active:scale-95 transition-transform text-xs tracking-wider">
           CUE
         </button>
         <button onClick={onPlayPause} className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 ${isPlaying ? 'bg-white text-black' : 'bg-emerald-500 text-white'}`}>
           {isPlaying ? '❚❚' : '▶'}
         </button>
         <button onClick={onToggleRecord} className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold active:scale-95 transition-transform tracking-wider ${isRecording ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'bg-[#2C2C2E] text-white'}`}>
           REC
         </button>
      </div>

      {/* Utility Toggles */}
      <div className="flex gap-2">
         <button onClick={onToggleSync} className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-colors tracking-wide ${transport.bpm === 128 ? 'bg-blue-500 text-white' : 'bg-[#2C2C2E] text-neutral-400'}`}>SYNC</button>
         <button onClick={onToggleQuantize} className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-colors tracking-wide ${transport.quantize !== 'OFF' ? 'bg-white text-black' : 'bg-[#2C2C2E] text-neutral-400'}`}>Q: {transport.quantize}</button>
      </div>
    </div>
  );
};
