import React, { useRef, useState, useEffect } from 'react';
import { Upload, Play, Pause, RotateCcw, Volume2, Trash2, Music, CheckCircle2 } from 'lucide-react';
import { Language, ThemeId } from '../types';
import { THEMES, ThemeConfig } from '../utils/theme';
import { audioEngine } from '../audio/AudioEngine';

interface TrackDeckProps {
  lang: Language;
  theme?: ThemeId;
  onTrackLoaded?: (name: string, duration: number) => void;
  onOpenGenerator: () => void;
}

export const TrackDeck: React.FC<TrackDeckProps> = ({
  lang,
  theme = 'onyx',
  onTrackLoaded,
  onOpenGenerator,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trackName, setTrackName] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;
  const isUk = lang === 'uk';

  // Sync state with audio engine
  useEffect(() => {
    const interval = setInterval(() => {
      const info = audioEngine.getUserTrackInfo();
      if (info.hasTrack) {
        setTrackName(info.name);
        setDuration(info.duration);
        setCurrentTime(info.currentTime);
        setIsPlaying(info.isPlaying);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const { name, duration: dur } = await audioEngine.loadUserTrackFile(file);
      setTrackName(name);
      setDuration(dur);
      setCurrentTime(0);
      setIsPlaying(false);
      onTrackLoaded?.(name, dur);
    } catch (err) {
      console.error('Failed to load audio file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!trackName) return;
    if (isPlaying) {
      audioEngine.pauseUserTrack();
      setIsPlaying(false);
    } else {
      audioEngine.playUserTrack();
      setIsPlaying(true);
    }
  };

  const handleCue = () => {
    audioEngine.pauseUserTrack();
    audioEngine.seekUserTrack(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sec = Number(e.target.value);
    setCurrentTime(sec);
    audioEngine.seekUserTrack(sec);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioEngine.setUserTrackVolume(val / 100);
  };

  const handleUnload = () => {
    audioEngine.unloadUserTrack();
    setTrackName('');
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      className="p-3 sm:p-4 rounded-2xl border flex flex-col gap-3 transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* Top Title & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: trackName ? '#22c55e' : '#71717a' }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-space">
            {isUk ? 'ДЕК АУДІОТРЕКУ' : 'BACKING TRACK DECK'}
          </span>
        </div>
        {trackName && (
          <button
            onClick={handleUnload}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-2 py-0.5 rounded bg-white/5"
            title={isUk ? 'Витягти трек' : 'Eject Track'}
          >
            <Trash2 className="w-3 h-3" />
            <span>{isUk ? 'Видалити' : 'Eject'}</span>
          </button>
        )}
      </div>

      {/* OLED Track Info Screen */}
      <div className="bg-black/70 rounded-xl p-3 border border-zinc-800 flex flex-col gap-2">
        {trackName ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <Music className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-zinc-200 truncate font-mono">
                  {trackName}
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold flex-shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Scrub Slider */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl py-4 sm:py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                dragOver
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60'
              }`}
            >
              <Upload className="w-5 h-5 text-zinc-400" />
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-300">
                  {isLoading
                    ? (isUk ? 'Декодування аудіофайлу...' : 'Decoding audio...')
                    : (isUk ? 'Торкніться або перетягніть трек' : 'Tap or drop audio file here')}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">MP3, WAV, AAC, M4A, FLAC</p>
              </div>
            </div>

            <button
              onClick={onOpenGenerator}
              className="w-full py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold font-space flex items-center justify-center gap-2 transition-colors"
            >
              <Music className="w-4 h-4" />
              {isUk ? 'Генерувати музику з Lyria' : 'Generate music with Lyria'}
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons & Volume */}
      {trackName && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCue}
              className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs font-bold font-mono transition-all active:scale-95"
            >
              CUE
            </button>
            <button
              onClick={handlePlayPause}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 active:scale-95 ${
                isPlaying
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-xl border border-zinc-800 flex-1 max-w-[180px]">
            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolume}
              className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-orange-500"
              title={isUk ? 'Гучність треку' : 'Track volume'}
            />
            <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">{volume}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
