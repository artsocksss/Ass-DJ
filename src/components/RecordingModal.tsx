import React from 'react';
import { Download, Play, Square, Trash2, X, Settings2, Disc, Mic, Volume2 } from 'lucide-react';
import { RecordingConfig, RecordedTake, Language, ThemeId } from '../types';
import { THEMES, ThemeConfig } from '../utils/theme';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecordingConfig;
  onUpdateConfig: (config: Partial<RecordingConfig>) => void;
  takes: RecordedTake[];
  onPlayTake: (take: RecordedTake) => void;
  onStopTake: () => void;
  onDownloadTake: (take: RecordedTake) => void;
  onDeleteTake: (takeId: string) => void;
  playingTakeId: string | null;
  lang: Language;
  theme?: ThemeId;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  takes,
  onPlayTake,
  onStopTake,
  onDownloadTake,
  onDeleteTake,
  playingTakeId,
  lang,
  theme = 'onyx',
}) => {
  if (!isOpen) return null;
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;
  const isUk = lang === 'uk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: themeConfig.bgPanel,
          borderColor: themeConfig.borderSubtle,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: themeConfig.borderSubtle }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <Mic className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-space tracking-tight">
                {isUk ? 'Запис треку & Налаштування' : 'Track Recording & Settings'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isUk ? 'Безвтратний 16-біт 44.1/96kHz WAV майстеринг' : 'Lossless 16-bit 44.1/96kHz WAV Mastering'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Section */}
        <div className="space-y-3 bg-black/40 p-3 rounded-xl border" style={{ borderColor: themeConfig.borderSubtle }}>
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
            <Settings2 className="w-3.5 h-3.5 text-orange-400" />
            <span>{isUk ? 'Параметри запису' : 'Recording Options'}</span>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
              {isUk ? 'Джерело запису' : 'Audio Routing Source'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'master', label: isUk ? 'Майстер (все)' : 'Master Mix' },
                { id: 'drums_only', label: isUk ? 'Тільки драмс' : 'Drums Only' },
                { id: 'track_and_drums', label: isUk ? 'Трек + Пади' : 'Track + Pads' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateConfig({ mode: m.id as any })}
                  className="py-1.5 px-2 text-[11px] rounded-lg font-semibold border transition-all text-center"
                  style={{
                    backgroundColor: config.mode === m.id ? themeConfig.accent : 'rgba(255,255,255,0.03)',
                    borderColor: config.mode === m.id ? themeConfig.accent : themeConfig.borderSubtle,
                    color: config.mode === m.id ? '#000000' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantized Auto-Stop */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                {isUk ? 'Авто-стоп по тактах' : 'Quantized Bars (Auto-Stop)'}
              </label>
              <select
                value={config.quantizeBars}
                onChange={(e) => onUpdateConfig({ quantizeBars: Number(e.target.value) })}
                className="w-full bg-zinc-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-zinc-700 outline-none focus:border-orange-500"
              >
                <option value={0}>{isUk ? 'Вільний (вручну)' : 'Manual (No Limit)'}</option>
                <option value={4}>4 {isUk ? 'Такти' : 'Bars'}</option>
                <option value={8}>8 {isUk ? 'Тактів' : 'Bars'}</option>
                <option value={16}>16 {isUk ? 'Тактів' : 'Bars'}</option>
                <option value={32}>32 {isUk ? 'Такти' : 'Bars'}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                {isUk ? 'Метроном прерол' : 'Pre-roll Count-in'}
              </label>
              <button
                onClick={() => onUpdateConfig({ countIn: !config.countIn })}
                className="w-full py-1.5 px-2.5 text-xs rounded-lg font-semibold border transition-all flex items-center justify-between"
                style={{
                  backgroundColor: config.countIn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: config.countIn ? 'rgba(34, 197, 94, 0.4)' : themeConfig.borderSubtle,
                  color: config.countIn ? '#4ade80' : 'rgba(255,255,255,0.6)',
                }}
              >
                <span>{config.countIn ? (isUk ? '1 Такт (4 кліки)' : '1 Bar Count-in') : (isUk ? 'Вимкнено' : 'Disabled')}</span>
                <span className={`w-2 h-2 rounded-full ${config.countIn ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Takes Library */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Disc className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isUk ? 'Збережені записи' : 'Saved Takes Library'} ({takes.length})</span>
            </div>
          </div>

          {takes.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-xl border-zinc-800 text-zinc-500 text-xs">
              {isUk 
                ? 'Ще немає збережених записів. Натисніть REC на головній панелі для запису сесії!' 
                : 'No recorded takes yet. Hit REC on the top bar to record your performance!'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {takes.map((t) => {
                const isPlaying = playingTakeId === t.id;
                const durMin = Math.floor(t.duration / 60);
                const durSec = Math.floor(t.duration % 60).toString().padStart(2, '0');

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <button
                        onClick={() => (isPlaying ? onStopTake() : onPlayTake(t))}
                        className={`p-1.5 rounded-lg transition-all ${
                          isPlaying ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <div className="truncate">
                        <div className="font-semibold text-zinc-200 truncate">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{durMin}:{durSec}</span>
                          <span>•</span>
                          <span>{t.bpm} BPM</span>
                          <span>•</span>
                          <span className="uppercase text-zinc-400">{t.mode.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDownloadTake(t)}
                        title={isUk ? 'Завантажити WAV' : 'Download WAV'}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTake(t.id)}
                        title={isUk ? 'Видалити' : 'Delete'}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close footer button */}
        <div className="pt-2 border-t flex justify-end" style={{ borderColor: themeConfig.borderSubtle }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold font-space bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            {isUk ? 'Закрити' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
