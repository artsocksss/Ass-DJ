import React, { useRef, useState, useEffect } from 'react';
import { MacroProfile, PerformanceMacroState, Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface PerformanceMacrosProps {
  macroState: PerformanceMacroState;
  lang: Language;
  theme?: ThemeId;
  onMacroChange: (value: number, profile?: MacroProfile, latch?: boolean) => void;
  onDropTrigger: () => void;
}

export const PerformanceMacros: React.FC<PerformanceMacrosProps> = ({
  macroState,
  lang,
  theme = 'onyx',
  onMacroChange,
  onDropTrigger,
}) => {
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const profiles: { id: MacroProfile; label: string; desc: string; icon: string }[] = [
    {
      id: 'RAVE_BUILD',
      label: t.macroProfiles.RAVE_BUILD,
      desc: 'HPF + Reso + Echo + Crush',
      icon: '⚡',
    },
    {
      id: 'SUB_DROP',
      label: t.macroProfiles.SUB_DROP,
      desc: 'LPF Slam + Sub Boost + Space',
      icon: '🌊',
    },
    {
      id: 'CYBER_CRUSH',
      label: t.macroProfiles.CYBER_CRUSH,
      desc: '3-Bit Crunch + Bandpass + Glitch',
      icon: '👾',
    },
    {
      id: 'TENSION_WASH',
      label: t.macroProfiles.TENSION_WASH,
      desc: 'Space Reverb + 3/8 Delay + Air',
      icon: '🌌',
    },
  ];

  // Calculate live telemetry values based on active profile and current slider value (0 to 1)
  const v = Math.max(0, Math.min(1, macroState.value));
  let liveReso = 'Q: 2.5';
  let liveEcho = '35% FB';
  let liveCrush = '16-bit Clean';
  let liveBass = '0 dB';

  if (macroState.profile === 'RAVE_BUILD') {
    liveReso = v <= 0.02 ? 'Q: 1.5' : `Q: ${(1.5 + v * 13.5).toFixed(1)} (Peak)`;
    liveEcho = v <= 0.02 ? '35% (Dry)' : `${Math.round((0.35 + v * 0.5) * 100)}% FB`;
    liveCrush = v <= 0.25 ? '16-bit' : `${Math.max(3, 16 - Math.round(v * 13))}-bit Crunch`;
    liveBass = v <= 0.02 ? '0 dB' : `-${(v * 24).toFixed(1)} dB (Ducked)`;
  } else if (macroState.profile === 'SUB_DROP') {
    liveReso = v <= 0.02 ? 'Q: 2.0' : `Q: ${(2.0 + v * 2.0).toFixed(1)}`;
    liveEcho = `${Math.round(v * 25)}% Reverb Dly`;
    liveCrush = 'Clean Bypass';
    liveBass = v <= 0.02 ? '0 dB' : `+${(v * 6).toFixed(1)} dB (Sub Slam)`;
  } else if (macroState.profile === 'CYBER_CRUSH') {
    liveReso = `Q: ${(3.0 + v * 5.5).toFixed(1)}`;
    liveEcho = `${Math.round((0.4 + v * 0.42) * 100)}% (Glitch)`;
    liveCrush = v <= 0.02 ? '16-bit' : `${Math.max(2, 16 - Math.round(v * 14))}-bit Heavy`;
    liveBass = v <= 0.02 ? '0 dB' : `+${(v * 4).toFixed(1)} dB Mid`;
  } else if (macroState.profile === 'TENSION_WASH') {
    liveReso = `Q: ${(2.0 + v * 1.5).toFixed(1)}`;
    liveEcho = `${Math.round((0.35 + v * 0.4) * 100)}% Dotted-8th`;
    liveCrush = 'Clean Space';
    liveBass = v <= 0.02 ? '0 dB' : `-${(v * 16).toFixed(1)} dB`;
  }

  // Pointer drag handling on slider track for 100% fluid mobile touch response
  const updateFromPointer = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, pos));
    onMacroChange(clamped, macroState.profile, macroState.latch);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Safely ignore if setPointerCapture is not supported in current environment
    }
    setIsDragging(true);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
      // If latch is OFF, smoothly spring back to 0 on finger release!
      if (!macroState.latch) {
        onMacroChange(0, macroState.profile, false);
      }
    }
  };

  return (
    <div
      className="rounded-3xl p-4 flex flex-col gap-3.5 w-full border transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Header & Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: v > 0.02 ? '#ff3b30' : themeConfig.accent }} />
          <div className="flex flex-col">
            <span className="text-white font-bold font-space text-xs uppercase tracking-wider">
              {t.performanceMacros}
            </span>
            <span className="text-[10px] text-white/50 hidden sm:inline">
              {t.macrosSubtitle}
            </span>
          </div>
        </div>

        {/* Current State Badge & Value */}
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all"
            style={{
              backgroundColor: v > 0.02 ? 'rgba(255, 59, 48, 0.15)' : `${themeConfig.accent}15`,
              borderColor: v > 0.02 ? 'rgba(255, 59, 48, 0.4)' : `${themeConfig.accent}40`,
              color: v > 0.02 ? '#ff3b30' : themeConfig.accent,
            }}
          >
            {v > 0.02 ? `${Math.round(v * 100)}% ${t.macroModulated}` : `0% ${t.macroClean}`}
          </span>
        </div>
      </div>

      {/* Profile Selector Pills */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl border"
        style={{
          backgroundColor: themeConfig.bgCard,
          borderColor: themeConfig.borderSubtle,
        }}
      >
        {profiles.map((p) => {
          const isSelected = macroState.profile === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onMacroChange(macroState.value, p.id, macroState.latch)}
              className="py-2 px-2 text-[10px] sm:text-[11px] font-space font-bold rounded-xl transition-all text-center flex flex-col items-center justify-center gap-0.5 border"
              style={{
                backgroundColor: isSelected ? themeConfig.accent : 'transparent',
                borderColor: isSelected ? themeConfig.accent : 'transparent',
                color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: isSelected ? `0 0 12px ${themeConfig.accentGlow}` : 'none',
              }}
            >
              <span className="truncate w-full font-bold">{p.label}</span>
              <span className={`text-[9px] truncate w-full ${isSelected ? 'text-black/70' : 'text-white/40'}`}>
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tactile Performance Slide Controller */}
      <div
        className="p-3.5 rounded-2xl border flex flex-col gap-3 transition-all relative overflow-hidden"
        style={{
          backgroundColor: themeConfig.bgCard,
          borderColor: v > 0.02 ? `${themeConfig.accent}60` : themeConfig.borderSubtle,
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-space font-bold text-white uppercase tracking-wider">
              {t.macroSlider}
            </span>
            <span className="text-[10px] font-mono text-white/40">
              {macroState.latch ? `[${t.macroLatchMode}]` : `[${t.macroSpringMode}]`}
            </span>
          </div>

          {/* Spring vs Latch Mode Switcher */}
          <button
            onClick={() => onMacroChange(macroState.value, macroState.profile, !macroState.latch)}
            className="text-[10px] font-space font-bold px-2 py-0.5 rounded-lg border transition-all"
            style={{
              backgroundColor: macroState.latch ? `${themeConfig.accentSecondary}20` : 'transparent',
              borderColor: macroState.latch ? themeConfig.accentSecondary : 'rgba(255,255,255,0.15)',
              color: macroState.latch ? themeConfig.accentSecondary : 'rgba(255,255,255,0.5)',
            }}
          >
            {macroState.latch ? `🔒 ${t.macroLatchMode}` : `🔄 ${t.macroSpringMode}`}
          </button>
        </div>

        {/* Custom Touch Slider Track */}
        <div
          ref={sliderRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="h-12 w-full rounded-xl bg-black/60 border border-white/10 relative cursor-pointer select-none touch-none flex items-center p-1.5 overflow-hidden"
          style={{
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {/* Dynamic Fill Gradient Track */}
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-75 pointer-events-none rounded-xl"
            style={{
              width: `${v * 100}%`,
              background: `linear-gradient(90deg, ${themeConfig.accent}60, ${themeConfig.accentSecondary}80, #ff3b30)`,
              boxShadow: v > 0.05 ? `0 0 16px ${themeConfig.accentGlow}` : 'none',
              opacity: v > 0.02 ? 1 : 0.1,
            }}
          />

          {/* Subtle tick markers for DJ cue precision */}
          <div className="absolute inset-0 flex justify-between px-3 items-center pointer-events-none opacity-20">
            <span className="w-0.5 h-3 bg-white" />
            <span className="w-0.5 h-2 bg-white" />
            <span className="w-0.5 h-4 bg-white" />
            <span className="w-0.5 h-2 bg-white" />
            <span className="w-0.5 h-5 bg-white" />
          </div>

          {/* Knurled Slider Thumb */}
          <div
            className="absolute top-1 bottom-1 w-8 rounded-lg bg-neutral-200 border border-white shadow-lg flex flex-col items-center justify-center gap-0.5 pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${v * 100}% - ${v * 32}px)`,
              boxShadow: v > 0.02 ? `0 0 14px ${themeConfig.accent}` : '0 2px 6px rgba(0,0,0,0.5)',
              backgroundColor: v > 0.5 ? '#ff3b30' : '#ffffff',
              color: v > 0.5 ? '#ffffff' : '#000000',
            }}
          >
            <div className="w-3.5 h-0.5 bg-black/40 rounded-full" />
            <div className="w-3.5 h-0.5 bg-black/40 rounded-full" />
            <div className="w-3.5 h-0.5 bg-black/40 rounded-full" />
          </div>
        </div>

        {/* Quick Percentage Jump Buttons & Instant Drop Slam */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {[0, 0.25, 0.5, 0.75, 1.0].map((step) => {
            const stepPercent = Math.round(step * 100);
            const isCurrent = Math.abs(v - step) < 0.03;
            return (
              <button
                key={step}
                onClick={() => onMacroChange(step, macroState.profile, true)}
                className="flex-1 py-1.5 text-[10px] font-mono font-bold rounded-lg border transition-all"
                style={{
                  backgroundColor: isCurrent ? `${themeConfig.accent}25` : 'rgba(255,255,255,0.04)',
                  borderColor: isCurrent ? themeConfig.accent : 'rgba(255,255,255,0.1)',
                  color: isCurrent ? themeConfig.accent : 'rgba(255,255,255,0.5)',
                }}
              >
                {stepPercent === 0 ? '0%' : `${stepPercent}%`}
              </button>
            );
          })}

          {/* Giant Instant DROP! Button */}
          <button
            onClick={onDropTrigger}
            className="px-4 py-1.5 text-[11px] font-space font-extrabold rounded-lg transition-all text-white border flex items-center justify-center gap-1 shadow-md active:scale-95"
            style={{
              backgroundColor: '#ff3b30',
              borderColor: '#ff6961',
              boxShadow: '0 0 12px rgba(255, 59, 48, 0.4)',
            }}
          >
            {t.macroDropButton}
          </button>
        </div>
      </div>

      {/* Live Multi-Parameter Modulation Telemetry (4 Simultaneous Parameters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Param 1: Filter Resonance (Q) */}
        <div
          className="p-2 rounded-xl border flex flex-col gap-1 transition-all"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-white/60 font-space font-medium truncate">{t.paramsResonance}</span>
            <span className="font-mono font-bold" style={{ color: themeConfig.accent }}>
              {liveReso}
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${v * 100}%`,
                backgroundColor: themeConfig.accent,
              }}
            />
          </div>
        </div>

        {/* Param 2: Echo Feedback */}
        <div
          className="p-2 rounded-xl border flex flex-col gap-1 transition-all"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-white/60 font-space font-medium truncate">{t.paramsEchoFeedback}</span>
            <span className="font-mono font-bold" style={{ color: themeConfig.accentTertiary }}>
              {liveEcho}
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${Math.min(100, v * 100)}%`,
                backgroundColor: themeConfig.accentTertiary,
              }}
            />
          </div>
        </div>

        {/* Param 3: Bitcrush */}
        <div
          className="p-2 rounded-xl border flex flex-col gap-1 transition-all"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-white/60 font-space font-medium truncate">{t.paramsBitcrush}</span>
            <span className="font-mono font-bold" style={{ color: themeConfig.accentSecondary }}>
              {liveCrush}
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${v > 0.2 ? ((v - 0.2) / 0.8) * 100 : 0}%`,
                backgroundColor: themeConfig.accentSecondary,
              }}
            />
          </div>
        </div>

        {/* Param 4: Bass Ducking / Low Boost */}
        <div
          className="p-2 rounded-xl border flex flex-col gap-1 transition-all"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-white/60 font-space font-medium truncate">{t.paramsBassDucking}</span>
            <span className="font-mono font-bold" style={{ color: v > 0.05 ? '#ff3b30' : 'rgba(255,255,255,0.7)' }}>
              {liveBass}
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${v * 100}%`,
                backgroundColor: '#ff3b30',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
