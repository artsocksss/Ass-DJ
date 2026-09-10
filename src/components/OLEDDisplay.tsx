import React from 'react';
import { TransportState, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WaveformVisualizer } from './WaveformVisualizer';
import { ClubVUMeter } from './ClubVUMeter';

interface OLEDDisplayProps {
  transport: TransportState;
  bankName: string;
  lang: Language;
  onTapTempo: () => void;
  onBpmChange: (bpm: number) => void;
}

export const OLEDDisplay: React.FC<OLEDDisplayProps> = ({
  transport,
  bankName,
  lang,
  onTapTempo,
  onBpmChange,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex flex-col gap-2.5 bg-gradient-to-b from-[#0A0A0F] to-[#12121B] rounded-2xl p-2.5 sm:p-3 shadow-[0_5px_15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]">
      {/* Top Row: BPM, Key & Bank Status */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white/60 text-[10px] font-bold font-space uppercase tracking-widest">
              {t.tempo}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-space bg-[#161622] text-[#00F0FF] rounded-full border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
              {bankName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#00F0FF] font-space drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">
              {transport.bpm.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-white/50 font-space uppercase tracking-wider">
              {t.bpm}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-white/50 text-[10px] font-bold font-space uppercase tracking-widest mb-0.5">
            {t.key}
          </span>
          <span className="text-sm sm:text-base font-bold text-[#FF007F] font-space px-2.5 py-0.5 bg-[#18111E] rounded-lg border border-[#FF007F]/40 shadow-[0_0_10px_rgba(255,0,127,0.3)]">
            {transport.key}
          </span>
        </div>
      </div>

      {/* Middle Row: BPM Step Controls, Tap Tempo & Bar Counter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#12121B] rounded-full p-1 border border-white/15">
          <button
            onClick={() => onBpmChange(transport.bpm - 1)}
            className="w-7 h-7 rounded-full bg-[#1A1A28] border border-white/20 flex items-center justify-center text-sm font-bold active:scale-95 transition-transform text-white shadow-sm hover:bg-[#00F0FF] hover:text-black"
            aria-label="Decrease BPM"
          >
            -
          </button>
          <button
            onClick={onTapTempo}
            className="px-3 py-1 text-[11px] font-bold font-space text-[#FFE600] active:scale-95 transition-all tracking-wider uppercase hover:bg-[#FFE600]/20 rounded-full"
          >
            {t.tap}
          </button>
          <button
            onClick={() => onBpmChange(transport.bpm + 1)}
            className="w-7 h-7 rounded-full bg-[#1A1A28] border border-white/20 flex items-center justify-center text-sm font-bold active:scale-95 transition-transform text-white shadow-sm hover:bg-[#00F0FF] hover:text-black"
            aria-label="Increase BPM"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5 font-space tracking-tight bg-[#12121B] px-3 py-1.5 rounded-full border border-white/15 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-white/50 text-[10px] uppercase font-bold">{t.bar}</span>
            <span className="text-sm font-bold text-[#00FF66] drop-shadow-[0_0_6px_#00FF66]">
              {String(transport.currentBar).padStart(2, '0')}
            </span>
            <span className="text-white/30">:</span>
            <span className="text-sm font-bold text-[#FF007F] drop-shadow-[0_0_6px_#FF007F]">
              {transport.currentBeat}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Web Audio AnalyserNode Waveform Visualizer */}
      <WaveformVisualizer lang={lang} />

      {/* High-FPS GPU-Accelerated Club Stereo VU Meter */}
      <ClubVUMeter />
    </div>
  );
};
