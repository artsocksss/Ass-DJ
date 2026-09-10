import React from 'react';
import { Language, ThemeId } from '../types';
import { THEMES, ThemeConfig } from '../utils/theme';
import { TRANSLATIONS } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectLang,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[lang];
  const activeThemeConfig: ThemeConfig = THEMES[currentTheme] || THEMES.onyx;

  const themeList: ThemeConfig[] = Object.values(THEMES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4 shadow-2xl border transition-all"
        style={{
          backgroundColor: activeThemeConfig.bgPanel,
          borderColor: activeThemeConfig.borderActive,
          boxShadow: `0 0 40px ${activeThemeConfig.accentGlow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: activeThemeConfig.borderSubtle }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: activeThemeConfig.accent }} />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase text-white">
              {t.settings}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-all active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 1. Theme Palette Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
            🎨 {t.theme}
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {themeList.map((thm) => {
              const isSelected = thm.id === currentTheme;
              return (
                <button
                  key={thm.id}
                  onClick={() => onSelectTheme(thm.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl transition-all border text-left"
                  style={{
                    backgroundColor: isSelected ? `${thm.accent}18` : thm.bgCard,
                    borderColor: isSelected ? thm.accent : thm.borderSubtle,
                    boxShadow: isSelected ? `0 0 12px ${thm.accentGlow}` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Color dot trio */}
                    <div className="flex items-center -space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: thm.accent }} />
                      <span className="w-3 h-3 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: thm.accentSecondary }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white font-space">
                        {lang === 'uk' ? thm.nameUk : thm.nameEn}
                      </span>
                      <span className="text-[9px] text-white/40 font-mono">
                        {thm.tag}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span 
                      className="text-[10px] font-bold font-space px-2 py-0.5 rounded-full border"
                      style={{ 
                        color: thm.accent,
                        borderColor: thm.accent,
                        backgroundColor: `${thm.accent}20` 
                      }}
                    >
                      ✓ ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Language Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
            🌐 {t.language}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectLang('uk')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all"
              style={{
                backgroundColor: lang === 'uk' ? `${activeThemeConfig.accent}20` : activeThemeConfig.bgCard,
                borderColor: lang === 'uk' ? activeThemeConfig.accent : activeThemeConfig.borderSubtle,
                boxShadow: lang === 'uk' ? `0 0 10px ${activeThemeConfig.accentGlow}` : 'none',
              }}
            >
              <span className="text-sm">🇺🇦</span>
              <span className={`text-xs font-bold font-space ${lang === 'uk' ? 'text-white' : 'text-white/70'}`}>
                Українська
              </span>
            </button>
            <button
              onClick={() => onSelectLang('en')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all"
              style={{
                backgroundColor: lang === 'en' ? `${activeThemeConfig.accent}20` : activeThemeConfig.bgCard,
                borderColor: lang === 'en' ? activeThemeConfig.accent : activeThemeConfig.borderSubtle,
                boxShadow: lang === 'en' ? `0 0 10px ${activeThemeConfig.accentGlow}` : 'none',
              }}
            >
              <span className="text-sm">🇬🇧</span>
              <span className={`text-xs font-bold font-space ${lang === 'en' ? 'text-white' : 'text-white/70'}`}>
                English
              </span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center text-[10px] text-white/40 font-mono">
          SOUNDMIX STUDIO • 96kHz 24-bit DSP
        </div>
      </div>
    </div>
  );
};
