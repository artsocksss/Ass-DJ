import React from 'react';
import { EQState, FXState, FXType } from '../types';

interface SoundColorFXDeckProps {
  fxState: FXState;
  eqState: EQState;
  masterVolume: number;
  onFXChange: (fx: Partial<FXState>) => void;
  onEQChange: (eq: Partial<EQState>) => void;
  onMasterVolumeChange: (vol: number) => void;
}

export const SoundColorFXDeck: React.FC<SoundColorFXDeckProps> = ({
  fxState, eqState, masterVolume, onFXChange, onEQChange, onMasterVolumeChange
}) => {
  const fxList: FXType[] = ['FILTER', 'CRUSH', 'ECHO', 'SPACE', 'NOISE'];

  return (
    <div className="bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-8 w-full">
      {/* FX Section */}
      <div className="flex flex-col gap-5">
         <span className="text-white font-bold text-lg tracking-tight">Color FX</span>
         <div className="flex bg-[#2C2C2E] p-1 rounded-xl">
           {fxList.map(fx => (
             <button
               key={fx}
               onClick={() => onFXChange({ activeFX: fx })}
               className={`flex-1 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${fxState.activeFX === fx ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-neutral-400'}`}
             >
               {fx}
             </button>
           ))}
         </div>
         <div className="flex items-center pt-2">
            <input type="range" min={-1} max={1} step={0.01} value={fxState.param} onChange={(e) => onFXChange({ param: parseFloat(e.target.value) })} className="w-full" />
         </div>
      </div>

      {/* EQ Section */}
      <div className="flex flex-col gap-5">
         <span className="text-white font-bold text-lg tracking-tight">3-Band EQ</span>
         <div className="flex flex-col gap-6">
           {[
             { label: 'High', val: eqState.high, key: 'high' },
             { label: 'Mid', val: eqState.mid, key: 'mid' },
             { label: 'Low', val: eqState.low, key: 'low' }
           ].map(band => (
             <div key={band.key} className="flex items-center gap-4">
               <span className="w-10 text-sm font-semibold text-neutral-400">{band.label}</span>
               <input type="range" min={-24} max={6} step={0.5} value={band.val} onChange={(e) => onEQChange({ [band.key]: parseFloat(e.target.value) })} className="flex-1" />
               <span className="w-12 text-right text-sm font-semibold text-white">{band.val > 0 ? `+${band.val}` : band.val}</span>
             </div>
           ))}
         </div>
      </div>

      {/* Master Volume */}
      <div className="flex flex-col gap-5 pt-4 border-t border-white/5">
         <span className="text-white font-bold text-lg tracking-tight">Master Volume</span>
         <input type="range" min={0} max={1.2} step={0.02} value={masterVolume} onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))} className="w-full mb-2" />
      </div>
    </div>
  );
};
