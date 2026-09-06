import React from 'react';
import { TransportState, VUMeterData } from '../types';

interface OLEDDisplayProps {
  transport: TransportState;
  bankName: string;
  bankSubtitle: string;
  bankColor: string;
  vuData: VUMeterData;
  onTapTempo: () => void;
  onBpmChange: (bpm: number) => void;
  activePadName?: string | null;
}

export const OLEDDisplay: React.FC<OLEDDisplayProps> = ({
  transport,
  bankName,
  bankSubtitle,
  bankColor,
  vuData,
  onTapTempo,
  onBpmChange,
  activePadName,
}) => {
  // 12-segment VU Meter calculation
  const NUM_SEGMENTS = 12;
  const renderMeterSegments = (level: number, peak: number) => {
    return Array.from({ length: NUM_SEGMENTS }, (_, i) => {
      const threshold = (i + 1) / NUM_SEGMENTS;
      const isLit = level >= threshold;
      const isPeak = Math.abs(peak - threshold) < 0.08 && peak >= threshold;

      let colorClass = 'bg-emerald-500/20';
      if (i >= 9) {
        // Red zone
        colorClass = isLit ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : isPeak ? 'bg-red-400' : 'bg-red-950/40';
      } else if (i >= 6) {
        // Amber zone
        colorClass = isLit ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : isPeak ? 'bg-amber-300' : 'bg-amber-950/40';
      } else {
        // Green zone
        colorClass = isLit ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : isPeak ? 'bg-emerald-300' : 'bg-emerald-950/40';
      }

      return (
        <div
          key={i}
          className={`h-1.5 w-full rounded-xs transition-colors duration-75 ${colorClass}`}
        />
      );
    });
  };

  return (
    <div
      id="oled-main-display"
      className="relative rounded-2xl bg-[#08090c] border border-neutral-800/80 p-3 sm:p-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] text-slate-100 select-none overflow-hidden"
    >
      {/* Top Bar: Model Badge & Bank Tag */}
      <div className="flex items-center justify-between border-b border-neutral-850 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-750 text-[11px] font-mono tracking-wider font-semibold text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PIONEER MIXSOUND
          </div>
          <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">
            PRO-DJ ENGINE v4.2
          </span>
        </div>

        {/* Current Sound Trigger / Bank */}
        <div className="flex items-center gap-2">
          {activePadName ? (
            <div className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs font-semibold animate-pulse">
              TRIG: {activePadName}
            </div>
          ) : (
            <div className="text-[11px] font-mono text-neutral-400 truncate max-w-[140px] sm:max-w-none">
              {bankSubtitle}
            </div>
          )}
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider"
            style={{ backgroundColor: `${bankColor}22`, color: bankColor, border: `1px solid ${bankColor}66` }}
          >
            {bankName}
          </span>
        </div>
      </div>

      {/* Main Grid: Beat Counter, Large BPM, Key & VU Meters */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Left: Bar & Beat Counter */}
        <div className="col-span-4 sm:col-span-3 flex flex-col justify-center bg-[#0d0f14] p-2.5 rounded-xl border border-neutral-850">
          <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 mb-1">
            BAR / BEAT
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              {String(transport.currentBar).padStart(2, '0')}
            </span>
            <span className="text-sm font-bold text-neutral-500">:</span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {transport.currentBeat}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              .{transport.currentSixteenth}
            </span>
          </div>

          {/* 4 LED Beat Sync Dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {[1, 2, 3, 4].map((beatNum) => (
              <div
                key={beatNum}
                className={`h-2 flex-1 rounded-full transition-all duration-100 ${
                  transport.playbackState === 'playing' && transport.currentBeat === beatNum
                    ? beatNum === 1
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-110'
                      : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] scale-105'
                    : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center: High-Precision BPM Readout */}
        <div className="col-span-5 sm:col-span-6 flex flex-col items-center justify-center bg-[#0d0f14] p-2.5 rounded-xl border border-neutral-850">
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-0.5">
            <span className="tracking-widest uppercase text-neutral-400">TEMPO MASTER</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400">PITCH</span>
              <span className="text-amber-400 font-bold font-mono">
                {transport.pitchBend >= 0 ? `+${transport.pitchBend.toFixed(1)}%` : `${transport.pitchBend.toFixed(1)}%`}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              {transport.bpm.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-amber-400 font-mono">BPM</span>
          </div>

          {/* Quick BPM Nudge and Tap Tempo */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              id="btn-bpm-minus"
              type="button"
              onClick={() => onBpmChange(transport.bpm - 1)}
              className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 transition-colors"
            >
              -1
            </button>
            <button
              id="btn-tap-tempo"
              type="button"
              onClick={onTapTempo}
              className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 text-amber-300 border border-amber-500/40 transition-all active:scale-95"
            >
              TAP
            </button>
            <button
              id="btn-bpm-plus"
              type="button"
              onClick={() => onBpmChange(transport.bpm + 1)}
              className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 transition-colors"
            >
              +1
            </button>
          </div>
        </div>

        {/* Right: Key & Stereo VU Meters */}
        <div className="col-span-3 flex items-center justify-between bg-[#0d0f14] p-2.5 rounded-xl border border-neutral-850">
          <div className="flex flex-col justify-between h-full py-0.5">
            <div>
              <div className="text-[9px] uppercase font-mono text-neutral-400">KEY</div>
              <div className="text-sm font-black font-mono text-cyan-400 tracking-wider">
                {transport.key}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-neutral-400">QUANTIZE</div>
              <div className="text-[11px] font-bold font-mono text-emerald-400">
                {transport.quantize}
              </div>
            </div>
          </div>

          {/* L/R Vertical VU Meters */}
          <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
            <div className="flex flex-col gap-0.5 w-2 sm:w-2.5">
              {renderMeterSegments(vuData.left, vuData.peakLeft)}
              <span className="text-[8px] font-mono text-neutral-400 text-center mt-0.5">L</span>
            </div>
            <div className="flex flex-col gap-0.5 w-2 sm:w-2.5">
              {renderMeterSegments(vuData.right, vuData.peakRight)}
              <span className="text-[8px] font-mono text-neutral-400 text-center mt-0.5">R</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
