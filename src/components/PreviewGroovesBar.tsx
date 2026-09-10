import React from 'react';
import { BankId, Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { Play, Square, Sparkles } from 'lucide-react';
import { PRESET_GROOVES } from '../audio/soundPresets';
import { THEMES, ThemeConfig } from '../utils/theme';

interface PreviewGroovesBarProps {
  currentBank: BankId;
  isPlaying: boolean;
  activeGrooveId: string | null;
  onSelectGroove: (groove: typeof PRESET_GROOVES[0]) => void;
  lang: Language;
  theme?: ThemeId;
}

export const PreviewGroovesBar: React.FC<PreviewGroovesBarProps> = ({
  currentBank,
  isPlaying,
  activeGrooveId,
  onSelectGroove,
  lang,
  theme = 'onyx',
}) => {
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  return (
    <div className="flex flex-col gap-2 w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-1 text-[11px] font-space font-bold">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
          <span 
            className="uppercase tracking-widest text-[10px]"
            style={{ color: themeConfig.accent }}
          >
            {t.previewTitle}
          </span>
        </div>
        <span className="text-[9px] font-mono text-white/40">12 DEMOS</span>
      </div>

      {/* Horizontal Scrollable Presets List */}
      <div className="flex overflow-x-auto gap-2 pb-1.5 px-0.5 no-scrollbar snap-x snap-mandatory">
        {PRESET_GROOVES.map((g) => {
          const isActive = activeGrooveId === g.id && isPlaying;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGroove(g)}
              className="snap-center shrink-0 w-[130px] flex flex-col justify-between p-2.5 rounded-2xl border text-left transition-all active:scale-95 relative overflow-hidden"
              style={{
                backgroundColor: isActive ? `${g.color}18` : themeConfig.bgCard,
                borderColor: isActive ? g.color : themeConfig.borderSubtle,
                boxShadow: isActive ? `0 0 16px ${g.color}40` : 'none',
              }}
            >
              {/* Vertical left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: g.color }}
              />

              <div className="flex flex-col w-full pl-1.5">
                <span className="text-[11px] font-space font-bold tracking-tight truncate text-white uppercase">
                  {g.name}
                </span>
                <div className="flex items-center justify-between text-[8.5px] font-mono text-white/50 mt-0.5">
                  <span className="truncate">{g.genre}</span>
                  <span className="font-bold" style={{ color: g.color }}>{g.bpm} BPM</span>
                </div>
              </div>

              {/* Play / Stop Action Badge */}
              <div
                className="mt-2 w-full h-6 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                style={{
                  backgroundColor: isActive ? g.color : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isActive ? g.color : 'rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {isActive ? (
                  <div className="flex items-center gap-1 font-bold text-[9px] font-space">
                    <Square className="w-2.5 h-2.5 fill-black" />
                    <span>{t.previewStop}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 font-bold text-[9px] font-space">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{t.previewPlay}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
