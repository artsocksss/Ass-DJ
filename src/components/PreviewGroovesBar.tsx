import React from 'react';
import { BankId, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { Play, Square, Zap } from 'lucide-react';
import { PRESET_GROOVES } from '../audio/soundPresets';

interface PreviewGroovesBarProps {
  currentBank: BankId;
  isPlaying: boolean;
  activeGrooveId: string | null;
  onSelectGroove: (groove: typeof PRESET_GROOVES[0]) => void;
  lang: Language;
}

export const PreviewGroovesBar: React.FC<PreviewGroovesBarProps> = ({
  currentBank,
  isPlaying,
  activeGrooveId,
  onSelectGroove,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex flex-col gap-2 w-full select-none">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 text-[12px] font-space font-black">
        <Zap className="w-4 h-4 text-[#FF007F] fill-[#FF007F] animate-pulse" />
        <span className="uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] to-[#00F0FF] drop-shadow-[0_0_8px_rgba(255,0,127,0.5)]">
          {t.previewTitle}
        </span>
      </div>

      {/* Horizontal Scrollable Presets List */}
      <div className="flex overflow-x-auto gap-2 pb-2 px-1 scrollbar-hide hide-scrollbar snap-x snap-mandatory">
        {PRESET_GROOVES.map((g) => {
          const isActive = activeGrooveId === g.id && isPlaying;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGroove(g)}
              className={`snap-center shrink-0 w-[140px] flex flex-col gap-1 p-2.5 rounded-xl border-2 text-left transition-all active:scale-95 relative overflow-hidden group ${
                isActive
                  ? 'bg-gradient-to-br from-[#1A1A2A] to-[#12121B] shadow-lg'
                  : 'bg-[#12121B] border-white/5 hover:border-white/20 shadow-md'
              }`}
              style={{
                borderColor: isActive ? g.color : undefined,
                boxShadow: isActive ? `0 0 20px ${g.color}40, inset 0 0 15px ${g.color}20` : undefined
              }}
            >
              {/* Highlight bar inside button */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 opacity-90"
                style={{ backgroundColor: g.color }}
              />

              <div className="flex flex-col w-full pl-2">
                <span className="text-[12px] font-space font-black tracking-tight truncate text-white uppercase drop-shadow-sm">
                  {g.name}
                </span>
                <span className="text-[9px] text-white/50 font-mono truncate uppercase tracking-widest mt-0.5">
                  {g.genre} • {g.bpm}
                </span>
              </div>

              {/* Play / Stop Button Area */}
              <div
                className={`mt-1.5 w-full h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  isActive
                    ? 'text-black border-transparent shadow-[0_0_8px_currentColor]'
                    : 'bg-[#181824] text-white/60 border-white/10'
                }`}
                style={{ backgroundColor: isActive ? g.color : undefined, color: isActive ? '#000' : undefined }}
              >
                {isActive ? (
                  <div className="flex items-center gap-1.5 font-bold text-[10px]">
                    <Square className="w-3 h-3 fill-black text-black" /> STOP
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold text-[10px]">
                    <Play className="w-3 h-3 fill-current" /> MAGIC
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
