import React from 'react';
import { Download, Play, Square, Trash2, Mic, Settings2, Sparkles, Volume2, Clock, Music } from 'lucide-react';
import { RecordingConfig, RecordedTake, Language, ThemeId } from '../types';
import { THEMES, ThemeConfig } from '../utils/theme';

interface TakesViewProps {
  takes: RecordedTake[];
  isRecording: boolean;
  recordingDuration: number;
  config: RecordingConfig;
  onUpdateConfig: (cfg: Partial<RecordingConfig>) => void;
  onToggleRecord: () => void;
  onPlayTake: (take: RecordedTake) => void;
  onStopTake: () => void;
  onDownloadTake: (take: RecordedTake) => void;
  onDeleteTake: (takeId: string) => void;
  playingTakeId: string | null;
  lang: Language;
  theme?: ThemeId;
}

export const TakesView: React.FC<TakesViewProps> = ({
  takes,
  isRecording,
  recordingDuration,
  config,
  onUpdateConfig,
  onToggleRecord,
  onPlayTake,
  onStopTake,
  onDownloadTake,
  onDeleteTake,
  playingTakeId,
  lang,
  theme = 'onyx',
}) => {
  const isUk = lang === 'uk';
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full pb-4 select-none">
      {/* Recording Control Banner */}
      <div
        className="rounded-3xl p-4 border flex flex-col gap-3.5 transition-all"
        style={{
          backgroundColor: themeConfig.bgPanel,
          borderColor: isRecording ? '#FF003C' : themeConfig.borderSubtle,
          boxShadow: isRecording ? '0 0 25px rgba(255, 0, 60, 0.4)' : '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-white/20'}`}
              style={{ backgroundColor: isRecording ? '#FF003C' : undefined }}
            />
            <span className="font-space font-bold text-xs uppercase tracking-wider text-white">
              {isRecording ? (isUk ? 'Йде прямий запис міксу' : 'Recording Master Mix') : (isUk ? 'Студійний запис' : 'Master Recorder')}
            </span>
          </div>
          <span
            className="font-mono text-sm sm:text-base font-bold px-2.5 py-0.5 rounded-lg border transition-all"
            style={{
              backgroundColor: isRecording ? 'rgba(255,0,60,0.15)' : themeConfig.bgCard,
              borderColor: isRecording ? '#FF003C' : themeConfig.borderSubtle,
              color: isRecording ? '#FF003C' : 'rgba(255,255,255,0.7)',
            }}
          >
            {formatSec(recordingDuration)}
          </span>
        </div>

        {/* Big Pro Trigger Button */}
        <button
          type="button"
          onClick={onToggleRecord}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-space font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.98] border"
          style={{
            backgroundColor: isRecording ? '#FF003C' : themeConfig.bgCard,
            borderColor: isRecording ? '#FF003C' : '#FF003C80',
            color: isRecording ? '#FFFFFF' : '#FF003C',
            boxShadow: isRecording ? '0 0 20px rgba(255,0,60,0.6)' : 'none',
          }}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4 fill-white text-white" />
              <span>{isUk ? 'Зупинити та зберегти (WAV)' : 'Stop & Save Take (WAV)'}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#FF003C]" />
              <span>{isUk ? 'Почати запис сесії' : 'Start Recording Session'}</span>
            </>
          )}
        </button>

        {/* Quick Settings Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Routing Mode */}
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-space text-white/50 uppercase">
              {isUk ? 'Джерело запису' : 'Source Routing'}
            </span>
            <div className="flex gap-1">
              {(['master', 'drums_only'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdateConfig({ mode: m })}
                  className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-space font-bold border transition-all"
                  style={{
                    backgroundColor: config.mode === m ? themeConfig.accent : themeConfig.bgCard,
                    borderColor: config.mode === m ? themeConfig.accent : themeConfig.borderSubtle,
                    color: config.mode === m ? '#000000' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {m === 'master' ? (isUk ? 'Майстер' : 'Master') : (isUk ? 'Лише Драми' : 'Drums')}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-roll Count-in */}
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-space text-white/50 uppercase">
              {isUk ? 'Зворотний відлік' : 'Count-in (1 Bar)'}
            </span>
            <button
              type="button"
              onClick={() => onUpdateConfig({ countIn: !config.countIn, preCount: !config.countIn })}
              className="py-1.5 px-2 rounded-xl text-[10px] font-space font-bold border transition-all text-center"
              style={{
                backgroundColor: config.countIn ? themeConfig.accentSecondary : themeConfig.bgCard,
                borderColor: config.countIn ? themeConfig.accentSecondary : themeConfig.borderSubtle,
                color: config.countIn ? '#000000' : 'rgba(255,255,255,0.7)',
              }}
            >
              {config.countIn ? (isUk ? 'Увімкнено (4 долі)' : 'Enabled (4 beats)') : (isUk ? 'Вимкнено (Миттєво)' : 'Disabled (Instant)')}
            </button>
          </div>
        </div>
      </div>

      {/* Recorded Takes List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-[11px] font-space font-bold text-white/70">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
            <span className="uppercase tracking-wider">
              {isUk ? 'Бібліотека записів' : 'Takes Library'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40">
            {takes.length} {isUk ? 'записів' : 'takes'}
          </span>
        </div>

        {takes.length === 0 ? (
          <div
            className="rounded-2xl p-6 border text-center flex flex-col items-center justify-center gap-2"
            style={{
              backgroundColor: themeConfig.bgCard,
              borderColor: themeConfig.borderSubtle,
            }}
          >
            <Mic className="w-8 h-8 text-white/20" />
            <p className="text-xs text-white/50 font-inter">
              {isUk
                ? 'Ще немає збережених записів. Натисніть кнопку "Почати запис" для збереження свого виступу!'
                : 'No recordings saved yet. Tap "Start Recording" to capture your live performance!'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {takes.map((take) => {
              const isPlaying = playingTakeId === take.id;
              const dur = take.duration || take.durationSeconds || 0;

              return (
                <div
                  key={take.id}
                  className="p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all"
                  style={{
                    backgroundColor: isPlaying ? `${themeConfig.accent}15` : themeConfig.bgCard,
                    borderColor: isPlaying ? themeConfig.accent : themeConfig.borderSubtle,
                  }}
                >
                  {/* Play / Stop Button */}
                  <button
                    type="button"
                    onClick={() => (isPlaying ? onStopTake() : onPlayTake(take))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all active:scale-95"
                    style={{
                      backgroundColor: isPlaying ? themeConfig.accent : 'rgba(255,255,255,0.06)',
                      borderColor: isPlaying ? themeConfig.accent : themeConfig.borderSubtle,
                      color: isPlaying ? '#000000' : '#FFFFFF',
                    }}
                    title={isPlaying ? 'Stop' : 'Play'}
                  >
                    {isPlaying ? <Square className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-space font-bold text-xs text-white truncate">
                      {take.name || take.title || 'Recorded Take'}
                    </span>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-white/50 mt-0.5">
                      <span>{formatSec(dur)}</span>
                      <span>•</span>
                      <span>{take.bpm || 128} BPM</span>
                      <span>•</span>
                      <span className="uppercase text-emerald-400 font-bold">WAV 16-bit</span>
                    </div>
                  </div>

                  {/* Actions: Download WAV & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDownloadTake(take)}
                      className="p-2 rounded-xl border flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderColor: themeConfig.borderSubtle,
                      }}
                      title={isUk ? 'Завантажити WAV' : 'Download WAV'}
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTake(take.id)}
                      className="p-2 rounded-xl border flex items-center justify-center text-white/50 hover:text-red-400 transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderColor: themeConfig.borderSubtle,
                      }}
                      title={isUk ? 'Видалити' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
