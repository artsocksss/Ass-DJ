import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { ThemeId } from '../types';
import { THEMES, ThemeConfig } from '../utils/theme';

interface ClubVUMeterProps {
  compact?: boolean;
  theme?: ThemeId;
}

export const ClubVUMeter: React.FC<ClubVUMeterProps> = ({
  compact = false,
  theme = 'onyx',
}) => {
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;
  const barLeftRef = useRef<HTMLDivElement>(null);
  const barRightRef = useRef<HTMLDivElement>(null);
  const peakLeftRef = useRef<HTMLDivElement>(null);
  const peakRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }
      const vu = audioEngine.getVUData();
      const lPct = Math.min(100, Math.max(0, vu.left * 100));
      const rPct = Math.min(100, Math.max(0, vu.right * 100));
      const pLPct = Math.min(100, Math.max(0, vu.peakLeft * 100));
      const pRPct = Math.min(100, Math.max(0, vu.peakRight * 100));

      if (barLeftRef.current) {
        barLeftRef.current.style.width = `${lPct}%`;
      }
      if (barRightRef.current) {
        barRightRef.current.style.width = `${rPct}%`;
      }
      if (peakLeftRef.current) {
        peakLeftRef.current.style.left = `calc(${pLPct}% - 2px)`;
        peakLeftRef.current.style.opacity = pLPct > 5 ? '1' : '0.2';
      }
      if (peakRightRef.current) {
        peakRightRef.current.style.left = `calc(${pRPct}% - 2px)`;
        peakRightRef.current.style.opacity = pRPct > 5 ? '1' : '0.2';
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (compact) {
    return (
      <div 
        className="flex flex-col gap-1 w-7 h-4 p-0.5 rounded border"
        style={{
          backgroundColor: themeConfig.bgMain,
          borderColor: themeConfig.borderSubtle,
        }}
      >
        <div className="h-1 w-full bg-white/10 rounded-[1px] overflow-hidden relative">
          <div
            ref={barLeftRef}
            className="h-full rounded-[1px] will-change-[width]"
            style={{ width: '0%', backgroundColor: themeConfig.accent }}
          />
        </div>
        <div className="h-1 w-full bg-white/10 rounded-[1px] overflow-hidden relative">
          <div
            ref={barRightRef}
            className="h-full rounded-[1px] will-change-[width]"
            style={{ width: '0%', backgroundColor: themeConfig.accentSecondary }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-1.5 w-full p-2.5 rounded-2xl border transition-all"
      style={{
        backgroundColor: themeConfig.bgCard,
        borderColor: themeConfig.borderSubtle,
      }}
    >
      <div className="flex justify-between items-center px-0.5 text-[9px] font-space font-bold">
        <span style={{ color: themeConfig.accent }}>VU STEREO</span>
        <div className="flex gap-3 text-[8px] font-mono text-white/50">
          <span style={{ color: themeConfig.accentSecondary }}>-12dB</span>
          <span className="text-[#FFB703]">-3dB</span>
          <span className="text-[#FF003C]">CLIP</span>
        </div>
      </div>

      {/* L Channel */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-space font-bold w-2.5" style={{ color: themeConfig.accent }}>L</span>
        <div className="h-2 flex-1 bg-black/40 rounded-full overflow-hidden relative border border-white/5">
          <div
            ref={barLeftRef}
            className="h-full rounded-full will-change-[width] transition-[width] duration-75"
            style={{ 
              width: '0%',
              background: `linear-gradient(to right, ${themeConfig.accentSecondary}, ${themeConfig.accent}, #FF003C)`
            }}
          />
          <div
            ref={peakLeftRef}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#FF003C] pointer-events-none will-change-[left]"
            style={{ left: '0%' }}
          />
        </div>
      </div>

      {/* R Channel */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-space font-bold w-2.5" style={{ color: themeConfig.accentTertiary }}>R</span>
        <div className="h-2 flex-1 bg-black/40 rounded-full overflow-hidden relative border border-white/5">
          <div
            ref={barRightRef}
            className="h-full rounded-full will-change-[width] transition-[width] duration-75"
            style={{ 
              width: '0%',
              background: `linear-gradient(to right, ${themeConfig.accentSecondary}, ${themeConfig.accentTertiary}, #FF003C)`
            }}
          />
          <div
            ref={peakRightRef}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#FF003C] pointer-events-none will-change-[left]"
            style={{ left: '0%' }}
          />
        </div>
      </div>
    </div>
  );
};
