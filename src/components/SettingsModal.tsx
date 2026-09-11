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
  djName: string;
  onDjNameChange: (name: string) => void;
  customAccent: string | null;
  onSelectCustomAccent: (color: string | null) => void;
  soundProfile: 'CLUB_BASS' | 'STUDIO_FLAT' | 'CRYSTAL_HIGHS' | 'ANALOG_TAPE';
  onSelectSoundProfile: (profile: 'CLUB_BASS' | 'STUDIO_FLAT' | 'CRYSTAL_HIGHS' | 'ANALOG_TAPE') => void;
  kickPulseEnabled?: boolean;
  onToggleKickPulse?: () => void;
  ecoMode?: boolean;
  onToggleEcoMode?: () => void;
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectLang,
  currentTheme,
  onSelectTheme,
  djName,
  onDjNameChange,
  customAccent,
  onSelectCustomAccent,
  soundProfile,
  onSelectSoundProfile,
  kickPulseEnabled = true,
  onToggleKickPulse,
  ecoMode = false,
  onToggleEcoMode,
  user,
  onLogin,
  onLogout,
}) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[lang];
  const activeThemeConfig: ThemeConfig = THEMES[currentTheme] || THEMES.onyx;

  const themeList: ThemeConfig[] = Object.values(THEMES);

  const accentPresets = [
    { name: 'Default', hex: null },
    { name: 'Cyan', hex: '#00f0ff' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Gold', hex: '#f59e0b' },
    { name: 'Hot Pink', hex: '#ec4899' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Crimson', hex: '#ef4444' },
  ];

  const soundProfiles: { id: 'CLUB_BASS' | 'STUDIO_FLAT' | 'CRYSTAL_HIGHS' | 'ANALOG_TAPE'; labelUk: string; labelEn: string; descUk: string; descEn: string }[] = [
    { id: 'CLUB_BASS', labelUk: '🔊 Club Bass Boost', labelEn: '🔊 Club Bass Boost', descUk: '+6dB низьких частот для сабвуферів', descEn: '+6dB sub bass punch for club systems' },
    { id: 'STUDIO_FLAT', labelUk: '🎧 Studio Reference', labelEn: '🎧 Studio Reference', descUk: 'Лінійна студійна АЧХ', descEn: 'Flat linear reference response' },
    { id: 'CRYSTAL_HIGHS', labelUk: '✨ Crystal Highs', labelEn: '✨ Crystal Highs', descUk: 'Чіткі верхи та прозорий вокал', descEn: 'Crisp highs & vocal clarity' },
    { id: 'ANALOG_TAPE', labelUk: '📼 Warm Analog Tape', labelEn: '📼 Warm Analog Tape', descUk: 'Тепле аналогове насичення', descEn: 'Warm tape saturation' },
  ];

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

        {/* Firebase Account & Cloud Sync */}
        <div className="flex flex-col gap-2 p-3 rounded-2xl border" style={{ backgroundColor: activeThemeConfig.bgCard, borderColor: activeThemeConfig.borderSubtle }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-space uppercase font-bold text-white/70 tracking-wider flex items-center gap-1.5">
              🔥 {lang === 'uk' ? 'Хмарний профіль Firebase' : 'Firebase Cloud Account'}
            </span>
            {user && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ONLINE
              </span>
            )}
          </div>

          {user ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                    {user.displayName ? user.displayName[0] : 'U'}
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold font-space text-white truncate">
                    {user.displayName || 'DJ Producer'}
                  </span>
                  <span className="text-[9px] font-mono text-white/50 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 text-[10px] font-mono font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-all shrink-0 active:scale-95"
              >
                {lang === 'uk' ? 'Вийти' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-[10px] text-white/60 font-inter leading-relaxed">
                {lang === 'uk' 
                  ? 'Увійдіть з Google для автоматичної синхронізації ваших пресетів та аудіо-записів через Firestore' 
                  : 'Sign in with Google to auto-sync your patterns and session recordings via Firestore'}
              </p>
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-space font-bold text-xs text-black transition-all active:scale-98 shadow-lg"
                style={{ backgroundColor: activeThemeConfig.accent }}
              >
                <span>🔑</span>
                <span>{lang === 'uk' ? 'Увійти через Google' : 'Sign In with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 0. DJ Alias & Personalization */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
            🎧 {lang === 'uk' ? 'Ваш псевдонім DJ / Артиста' : 'DJ / Stage Alias'}
          </label>
          <input
            type="text"
            value={djName}
            onChange={(e) => onDjNameChange(e.target.value)}
            placeholder="DJ ART SOCKS"
            className="w-full bg-black/60 border rounded-xl px-3 py-2 text-xs font-space text-white focus:outline-none transition-all"
            style={{ borderColor: activeThemeConfig.borderSubtle }}
          />
        </div>

        {/* 0.1 Custom Accent Color Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
            ✨ {lang === 'uk' ? 'Кастомний підсвічуваний колір (Neon Accent)' : 'Custom Neon Glow Color'}
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {accentPresets.map((preset) => {
              const isSelected = customAccent === preset.hex;
              return (
                <button
                  key={preset.name}
                  onClick={() => onSelectCustomAccent(preset.hex)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center transition-all active:scale-95"
                  style={{
                    backgroundColor: preset.hex || activeThemeConfig.accent,
                    borderColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    boxShadow: isSelected ? `0 0 12px ${preset.hex || activeThemeConfig.accent}` : 'none',
                  }}
                  title={preset.name}
                >
                  {isSelected && <span className="text-[10px] text-black font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 0.2 Sound Profile DSP Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
            🎛️ {lang === 'uk' ? 'Профіль звукового майстерингу' : 'DSP Master Sound Profile'}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {soundProfiles.map((p) => {
              const isSelected = soundProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectSoundProfile(p.id)}
                  className="p-2 rounded-xl border text-left flex flex-col transition-all"
                  style={{
                    backgroundColor: isSelected ? `${activeThemeConfig.accent}20` : activeThemeConfig.bgCard,
                    borderColor: isSelected ? activeThemeConfig.accent : activeThemeConfig.borderSubtle,
                  }}
                >
                  <span className="text-[11px] font-bold font-space text-white truncate">
                    {lang === 'uk' ? p.labelUk : p.labelEn}
                  </span>
                  <span className="text-[9px] text-white/40 truncate">
                    {lang === 'uk' ? p.descUk : p.descEn}
                  </span>
                </button>
              );
            })}
          </div>
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

        {/* 2. Kick Drum Audio-Clock Pulse Sync */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider flex items-center justify-between">
            <span>⚡ {t.kickPulse}</span>
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all"
              style={{
                backgroundColor: kickPulseEnabled ? `${activeThemeConfig.accent}20` : 'rgba(255,255,255,0.05)',
                borderColor: kickPulseEnabled ? activeThemeConfig.accent : activeThemeConfig.borderSubtle,
                color: kickPulseEnabled ? activeThemeConfig.accent : 'rgba(255,255,255,0.4)',
              }}
            >
              {kickPulseEnabled ? t.kickPulseOn : t.kickPulseOff}
            </span>
          </label>
          <button
            onClick={onToggleKickPulse}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all border text-left active:scale-98"
            style={{
              backgroundColor: kickPulseEnabled ? `${activeThemeConfig.accent}12` : activeThemeConfig.bgCard,
              borderColor: kickPulseEnabled ? activeThemeConfig.accent : activeThemeConfig.borderSubtle,
              boxShadow: kickPulseEnabled ? `0 0 15px ${activeThemeConfig.accentGlow}` : 'none',
            }}
          >
            <div className="flex flex-col pr-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: kickPulseEnabled ? activeThemeConfig.accent : '#555566',
                    boxShadow: kickPulseEnabled ? `0 0 8px ${activeThemeConfig.accent}` : 'none',
                  }}
                />
                <span className="text-xs font-bold font-space text-white">
                  {lang === 'uk' ? 'Синхронізація підсвітки з бочкою' : 'Kick Drum Pulse & Ambient Glow'}
                </span>
              </div>
              <span className="text-[9px] text-white/50 font-inter mt-0.5 leading-tight">
                {t.kickPulseDesc}
              </span>
            </div>
            {/* Custom Toggle Switch */}
            <div
              className="w-11 h-6 rounded-full p-0.5 flex items-center transition-colors shrink-0"
              style={{
                backgroundColor: kickPulseEnabled ? activeThemeConfig.accent : '#2A2A38',
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  kickPulseEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* 3. Performance & Eco Mode */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider flex items-center justify-between">
            <span>⚡ {lang === 'uk' ? 'Режим енергозбереження' : 'Eco Performance Mode'}</span>
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all"
              style={{
                backgroundColor: ecoMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: ecoMode ? '#10B981' : activeThemeConfig.borderSubtle,
                color: ecoMode ? '#10B981' : 'rgba(255,255,255,0.4)',
              }}
            >
              {ecoMode ? '30 FPS ECO' : '60 FPS ULTRA'}
            </span>
          </label>
          <button
            onClick={onToggleEcoMode}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all border text-left active:scale-98"
            style={{
              backgroundColor: ecoMode ? 'rgba(16, 185, 129, 0.12)' : activeThemeConfig.bgCard,
              borderColor: ecoMode ? '#10B981' : activeThemeConfig.borderSubtle,
            }}
          >
            <div className="flex flex-col pr-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: ecoMode ? '#10B981' : '#555566',
                    boxShadow: ecoMode ? '0 0 8px #10B981' : 'none',
                  }}
                />
                <span className="text-xs font-bold font-space text-white">
                  {lang === 'uk' ? 'Обмеження кадрів для слабких пристроїв' : 'Battery & Performance Optimization'}
                </span>
              </div>
              <span className="text-[9px] text-white/50 font-inter mt-0.5 leading-tight">
                {lang === 'uk' ? 'Зменшує навантаження на GPU та батарею під час гри' : 'Caps visual render loop to 30 FPS to save CPU/battery'}
              </span>
            </div>
            {/* Custom Toggle Switch */}
            <div
              className="w-11 h-6 rounded-full p-0.5 flex items-center transition-colors shrink-0"
              style={{
                backgroundColor: ecoMode ? '#10B981' : '#2A2A38',
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  ecoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* 4. Language Selector */}
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
