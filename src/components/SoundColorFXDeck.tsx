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
  fxState,
  eqState,
  masterVolume,
  onFXChange,
  onEQChange,
  onMasterVolumeChange,
}) => {
  const fxList: { type: FXType; label: string; desc: string; color: string }[] = [
    { type: 'FILTER', label: 'FILTER', desc: 'HPF / LPF Sweep', color: '#0a84ff' },
    { type: 'CRUSH', label: 'CRUSH', desc: 'Bitcrush & Lofi', color: '#ff375f' },
    { type: 'ECHO', label: 'ECHO', desc: 'Tape Delay', color: '#ffd60a' },
    { type: 'SPACE', label: 'SPACE', desc: 'Lush Reverb', color: '#bf5af2' },
    { type: 'NOISE', label: 'NOISE', desc: 'Riser Sweep', color: '#30d158' },
  ];

  return (
    <div
      id="sound-color-fx-deck"
      className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 bg-[#0e1015] border border-neutral-800/80 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
    >
      {/* Left: Sound Color FX Section */}
      <div className="lg:col-span-7 flex flex-col justify-between gap-3 bg-[#12151d] p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              SOUND COLOR FX
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            PIONEER DJM ENGINE
          </span>
        </div>

        {/* 5 FX Select Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {fxList.map((fx) => {
            const isActive = fxState.activeFX === fx.type;
            return (
              <button
                key={fx.type}
                id={`btn-color-fx-${fx.type}`}
                type="button"
                onClick={() => onFXChange({ activeFX: fx.type })}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer select-none ${
                  isActive
                    ? 'shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                    : 'bg-[#181c26] border-neutral-800 hover:border-neutral-700 text-neutral-400'
                }`}
                style={{
                  backgroundColor: isActive ? `${fx.color}22` : undefined,
                  borderColor: isActive ? fx.color : undefined,
                }}
              >
                <span
                  className="text-xs font-black font-mono tracking-wider"
                  style={{ color: isActive ? fx.color : undefined }}
                >
                  {fx.label}
                </span>
                <span className="text-[8px] font-mono text-neutral-500 hidden sm:inline truncate">
                  {fx.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* FX Parameter Knob / Slider */}
        <div className="flex flex-col gap-1.5 bg-[#171a24] p-2.5 rounded-lg border border-neutral-800">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-400">
              {fxState.activeFX === 'FILTER'
                ? 'LOW-PASS (LPF) ← CENTER → HIGH-PASS (HPF)'
                : `${fxState.activeFX} DEPTH / WET MIX`}
            </span>
            <span className="font-bold text-cyan-400">
              {fxState.param >= 0 ? `+${(fxState.param * 100).toFixed(0)}%` : `${(fxState.param * 100).toFixed(0)}%`}
            </span>
          </div>

          <div className="relative flex items-center">
            {/* Center zero detent marker */}
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3.5 bg-cyan-400/60 pointer-events-none" />

            <input
              id="input-color-fx-param"
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={fxState.param}
              onChange={(e) => onFXChange({ param: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Reset FX parameter button */}
          <div className="flex justify-end">
            <button
              id="btn-reset-fx-param"
              type="button"
              onClick={() => onFXChange({ param: 0 })}
              className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors"
            >
              [RESET CENTER]
            </button>
          </div>
        </div>
      </div>

      {/* Right: 3-Band Isolator EQ & Master Volume */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-3 bg-[#12151d] p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              3-BAND ISOLATOR EQ
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            -∞ TO +6dB
          </span>
        </div>

        {/* 3 Bands: HI, MID, LOW */}
        <div className="grid grid-cols-3 gap-2">
          {/* HI BAND */}
          <div className="flex flex-col items-center gap-1.5 bg-[#171a24] p-2 rounded-lg border border-neutral-800">
            <div className="text-[10px] font-mono font-bold text-neutral-300">HI (13k)</div>
            <input
              id="input-eq-hi"
              type="range"
              min={-24}
              max={6}
              step={0.5}
              value={eqState.high}
              onChange={(e) => onEQChange({ high: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[9px] font-mono text-amber-400">
              {eqState.high > 0 ? `+${eqState.high.toFixed(0)}dB` : `${eqState.high.toFixed(0)}dB`}
            </span>
            <button
              id="btn-eq-kill-hi"
              type="button"
              onClick={() => onEQChange({ killHigh: !eqState.killHigh })}
              className={`w-full py-1 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer ${
                eqState.killHigh
                  ? 'bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              KILL
            </button>
          </div>

          {/* MID BAND */}
          <div className="flex flex-col items-center gap-1.5 bg-[#171a24] p-2 rounded-lg border border-neutral-800">
            <div className="text-[10px] font-mono font-bold text-neutral-300">MID (1k)</div>
            <input
              id="input-eq-mid"
              type="range"
              min={-24}
              max={6}
              step={0.5}
              value={eqState.mid}
              onChange={(e) => onEQChange({ mid: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[9px] font-mono text-amber-400">
              {eqState.mid > 0 ? `+${eqState.mid.toFixed(0)}dB` : `${eqState.mid.toFixed(0)}dB`}
            </span>
            <button
              id="btn-eq-kill-mid"
              type="button"
              onClick={() => onEQChange({ killMid: !eqState.killMid })}
              className={`w-full py-1 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer ${
                eqState.killMid
                  ? 'bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              KILL
            </button>
          </div>

          {/* LOW BAND */}
          <div className="flex flex-col items-center gap-1.5 bg-[#171a24] p-2 rounded-lg border border-neutral-800">
            <div className="text-[10px] font-mono font-bold text-neutral-300">LOW (100)</div>
            <input
              id="input-eq-low"
              type="range"
              min={-24}
              max={6}
              step={0.5}
              value={eqState.low}
              onChange={(e) => onEQChange({ low: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[9px] font-mono text-amber-400">
              {eqState.low > 0 ? `+${eqState.low.toFixed(0)}dB` : `${eqState.low.toFixed(0)}dB`}
            </span>
            <button
              id="btn-eq-kill-low"
              type="button"
              onClick={() => onEQChange({ killLow: !eqState.killLow })}
              className={`w-full py-1 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer ${
                eqState.killLow
                  ? 'bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              KILL
            </button>
          </div>
        </div>

        {/* Master Volume */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              MASTER LEVEL:
            </span>
            <span className="text-[11px] font-mono font-bold text-white">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <input
            id="input-master-volume"
            type="range"
            min={0}
            max={1.2}
            step={0.02}
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-32 sm:w-44 h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
};
