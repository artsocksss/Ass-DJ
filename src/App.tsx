import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BankId,
  EQState,
  FXState,
  PerformanceMacroState,
  MacroProfile,
  TransportState,
  QuantizeMode,
  Language,
  ThemeId,
  ActiveTab,
  RecordingConfig,
  RecordedTake,
} from './types';
import { audioEngine } from './audio/AudioEngine';
import { sequencerClock } from './audio/SequencerClock';
import { createEmptyPattern, PRESET_LIBRARY } from './audio/presetPatterns';
import { PRESET_GROOVES, BANKS } from './audio/soundPresets';
import { webMidiService } from './utils/WebMidiService';
import { usePersistentPatternAndBpm } from './utils/usePersistentPatternAndBpm';
import { TRANSLATIONS } from './utils/translations';
import { THEMES, ThemeConfig } from './utils/theme';

import { OLEDDisplay } from './components/OLEDDisplay';
import { PreviewGroovesBar } from './components/PreviewGroovesBar';
import { TransportDeck } from './components/TransportDeck';
import { TempoSlider } from './components/TempoSlider';
import { PerformancePads } from './components/PerformancePads';
import { StepSequencer } from './components/StepSequencer';
import { SoundColorFXDeck } from './components/SoundColorFXDeck';
import { BankSelector } from './components/BankSelector';
import { SettingsModal } from './components/SettingsModal';
import { TrackDeck } from './components/TrackDeck';
import { RecordingModal } from './components/RecordingModal';
import { TakesView } from './components/TakesView';

// Lightweight vector icons for Pro Pioneer Tab Bar
const IconPads = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
  </svg>
);
const IconSeq = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);
const IconTrack = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);
const IconFX = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);
const IconTakes = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);
const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const App: React.FC = () => {
  // 1. Language state (default: 'uk')
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('soundmix_lang_v2');
      if (saved === 'uk' || saved === 'en') return saved;
    } catch {
      // Fallback
    }
    return 'uk';
  });

  const handleSelectLang = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('soundmix_lang_v2', newLang);
    } catch {
      // Fallback
    }
  };

  const toggleLanguage = () => {
    handleSelectLang(lang === 'uk' ? 'en' : 'uk');
  };

  // 2. Theme State (default: 'onyx')
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('soundmix_theme_pref');
      if (saved && (saved in THEMES)) return saved as ThemeId;
    } catch {
      // Fallback
    }
    return 'onyx';
  });

  const handleSelectTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    try {
      localStorage.setItem('soundmix_theme_pref', themeId);
    } catch {
      // Fallback
    }
  };

  const cycleTheme = () => {
    const themeIds: ThemeId[] = ['onyx', 'amber', 'acid', 'titanium', 'tokyo'];
    const curIdx = themeIds.indexOf(currentTheme);
    const nextIdx = (curIdx + 1) % themeIds.length;
    handleSelectTheme(themeIds[nextIdx]);
  };

  // 3. Eco Mode for weaker devices
  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('soundmix_eco_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleEcoMode = () => {
    setEcoMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('soundmix_eco_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const t = TRANSLATIONS[lang];
  const activeThemeConfig: ThemeConfig = THEMES[currentTheme] || THEMES.onyx;

  // Dedicated persistent hook for pattern, BPM and bank
  const {
    currentBank,
    setCurrentBank,
    pattern,
    setPattern,
    bpm,
    setBpm,
    patternName,
    setPatternName,
    resetToFactoryPreset,
  } = usePersistentPatternAndBpm('A');

  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(0);
  const [activePadIndices, setActivePadIndices] = useState<Set<number>>(new Set());
  const [lastQuantizeSnap, setLastQuantizeSnap] = useState<{ division: string; offsetMs: number; time: number } | null>(null);
  const lastPadTapTimesRef = useRef<Map<number, number>>(new Map());

  const [transport, setTransport] = useState<TransportState>({
    playbackState: 'stopped',
    bpm: bpm,
    pitchRange: 10,
    pitchBend: 0,
    masterTempo: true,
    quantize: 'SMART',
    currentBar: 1,
    currentBeat: 1,
    currentSixteenth: 1,
    key: '8A',
  });

  useEffect(() => {
    setTransport((prev) => ({ ...prev, bpm }));
  }, [bpm]);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSequencerStepRecording, setIsSequencerStepRecording] = useState<boolean>(false);
  const [fxState, setFxState] = useState<FXState>({
    activeFX: 'FILTER',
    param: 0,
    resonance: 3.5,
    echoTime: 0.25,
    echoFeedback: 0.45,
  });
  const [eqState, setEqState] = useState<EQState>({
    low: 0,
    mid: 0,
    high: 0,
    killLow: false,
    killMid: false,
    killHigh: false,
  });
  const [macroState, setMacroState] = useState<PerformanceMacroState>({
    value: 0,
    profile: 'RAVE_BUILD',
    latch: false,
  });
  const [masterVolume, setMasterVolume] = useState<number>(0.9);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pads');
  const [activeGrooveId, setActiveGrooveId] = useState<string | null>(null);

  // ----------------------------------------------------
  // RECORDING & TAKES STATE
  // ----------------------------------------------------
  const [isRecordingMaster, setIsRecordingMaster] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isRecModalOpen, setIsRecModalOpen] = useState<boolean>(false);
  const [recConfig, setRecConfig] = useState<RecordingConfig>({
    format: 'wav',
    mode: 'master',
    quantizeBars: 0,
    countIn: false,
    sampleRate: 44100,
    bitDepth: 16,
  });
  const [recordedTakes, setRecordedTakes] = useState<RecordedTake[]>(() => {
    try {
      const saved = localStorage.getItem('soundmix_takes_meta_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const isSeqRecRef = useRef(isSequencerStepRecording);
  isSeqRecRef.current = isSequencerStepRecording;
  const tapTimesRef = useRef<number[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const activeAudioTakeRef = useRef<HTMLAudioElement | null>(null);

  // ----------------------------------------------------
  // AUDIO-CLOCK SYNCED KICK GLOW & PULSE ENGINE
  // ----------------------------------------------------
  const [kickPulseEnabled, setKickPulseEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('soundmix_kick_pulse_v1');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [_isKickPulseActive, setIsKickPulseActive] = useState<boolean>(false);
  const kickPulseEnabledRef = useRef(kickPulseEnabled);
  kickPulseEnabledRef.current = kickPulseEnabled;
  const kickTimersRef = useRef<Set<number>>(new Set());
  const kickRemovalTimeoutRef = useRef<number | null>(null);

  const toggleKickPulse = useCallback(() => {
    setKickPulseEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('soundmix_kick_pulse_v1', String(next));
      } catch {}
      if (!next) {
        document.querySelectorAll('.sync-kick-pulse').forEach((el) => {
          el.classList.remove('kick-pulse-active');
        });
        setIsKickPulseActive(false);
      }
      return next;
    });
  }, []);

  const triggerKickPulseImmediate = useCallback((_velocity: number = 1.0) => {
    if (!kickPulseEnabledRef.current) return;

    // Direct DOM class toggling for 0-latency 120 FPS response
    const targets = document.querySelectorAll('.sync-kick-pulse');
    targets.forEach((el) => {
      el.classList.remove('kick-pulse-active');
      // Force CSS reflow to cleanly restart the transition on rapid successive kicks
      void (el as HTMLElement).offsetWidth;
      el.classList.add('kick-pulse-active');
    });

    setIsKickPulseActive(true);

    if (kickRemovalTimeoutRef.current !== null) {
      window.clearTimeout(kickRemovalTimeoutRef.current);
    }

    // Decay matches kick drum punch transient (~110ms)
    kickRemovalTimeoutRef.current = window.setTimeout(() => {
      targets.forEach((el) => {
        el.classList.remove('kick-pulse-active');
      });
      setIsKickPulseActive(false);
      kickRemovalTimeoutRef.current = null;
    }, 110);
  }, []);

  const handleAudioClockKick = useCallback(
    (audioTime: number, velocity: number) => {
      if (!kickPulseEnabledRef.current) return;
      const ctx = audioEngine.getContext();
      const currentCtxTime = ctx.currentTime;
      const delayMs = Math.max(0, (audioTime - currentCtxTime) * 1000);

      if (delayMs <= 3) {
        triggerKickPulseImmediate(velocity);
      } else {
        const timerId = window.setTimeout(() => {
          kickTimersRef.current.delete(timerId);
          triggerKickPulseImmediate(velocity);
        }, delayMs);
        kickTimersRef.current.add(timerId);
      }
    },
    [triggerKickPulseImmediate]
  );

  useEffect(() => {
    // Automatic AudioContext unlock for iOS / Safari on first user gesture
    const unlockAudio = () => {
      audioEngine.init();
      const ctx = audioEngine.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    };

    window.addEventListener('touchstart', unlockAudio, { passive: true, once: false });
    window.addEventListener('touchend', unlockAudio, { passive: true, once: false });
    window.addEventListener('pointerdown', unlockAudio, { passive: true, once: false });
    window.addEventListener('click', unlockAudio, { passive: true, once: false });
    window.addEventListener('keydown', unlockAudio, { passive: true, once: false });

    // Register audio-clock synced kick drum trigger listener
    audioEngine.setKickTriggerListener(handleAudioClockKick);

    // Set high-precision clock callbacks
    sequencerClock.setCallbacks(
      (step, time) => {
        const activePattern = patternRef.current;
        for (let pad = 0; pad < 16; pad++) {
          if (activePattern[pad] && activePattern[pad][step]) {
            audioEngine.triggerPad(pad, 0.95, time);
          }
        }
      },
      (step, bar, beat, sixteenth) => {
        setCurrentStep(step);
        setTransport((prev) => ({ ...prev, currentBar: bar, currentBeat: beat, currentSixteenth: sixteenth }));
      }
    );

    // Initialize Web MIDI service
    webMidiService.init((event) => {
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) {
        handleTriggerPad(event.padIndex, event.velocity);
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('touchend', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      audioEngine.setKickTriggerListener(undefined);
      kickTimersRef.current.forEach((t) => window.clearTimeout(t));
      kickTimersRef.current.clear();
      if (kickRemovalTimeoutRef.current !== null) {
        window.clearTimeout(kickRemovalTimeoutRef.current);
      }
      sequencerClock.stopAndCue();
    };
  }, []);

  useEffect(() => {
    audioEngine.currentBank = currentBank;
  }, [currentBank]);

  useEffect(() => {
    const semitones = transport.pitchBend;
    const pitchFactor = Math.pow(2, semitones / 12);
    sequencerClock.setBpm(bpm * (transport.masterTempo ? 1.0 : pitchFactor));
    audioEngine.pitchShiftMultiplier = pitchFactor;
  }, [bpm, transport.pitchBend, transport.masterTempo]);

  const handleTriggerPad = useCallback(
    (padIndex: number, velocity: number = 1.0) => {
      const ctx = audioEngine.getContext();
      const now = ctx.currentTime;
      const lastTap = lastPadTapTimesRef.current.get(padIndex);
      lastPadTapTimesRef.current.set(padIndex, now);

      const qResult = sequencerClock.getQuantizedTime(now, transport.quantize, lastTap);
      audioEngine.triggerPad(padIndex, velocity, qResult.scheduledTime);

      if (qResult.isSmartQuantized && transport.quantize !== 'OFF') {
        setLastQuantizeSnap({
          division: qResult.division,
          offsetMs: qResult.offsetMs,
          time: Date.now(),
        });
      }

      setActivePadIndices((prev) => new Set(prev).add(padIndex));
      setTimeout(() => {
        setActivePadIndices((prev) => {
          const next = new Set(prev);
          next.delete(padIndex);
          return next;
        });
      }, 120);

      if (isSeqRecRef.current) {
        const step = qResult.isSmartQuantized ? qResult.targetStep : currentStepRef.current;
        setPattern((prev) => {
          const next = prev.map((row) => [...row]);
          if (!next[padIndex]) next[padIndex] = Array(16).fill(false);
          next[padIndex][step] = true;
          return next;
        });
      }
    },
    [setPattern, transport.quantize]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      let padIdx = -1;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
        return;
      }
      if (e.shiftKey) {
        const bankKeys: Record<string, BankId> = {
          a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G',
          '!': 'A', '@': 'B', '#': 'C', '$': 'D', '%': 'E', '^': 'F', '&': 'G',
        };
        if (key in bankKeys) {
          setCurrentBank(bankKeys[key]);
          return;
        }
      }

      const KEYMAP: Record<string, number> = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'q': 4, 'w': 5, 'e': 6, 'r': 7,
        'a': 8, 's': 9, 'd': 10, 'f': 11,
        'z': 12, 'x': 13, 'c': 14, 'v': 15,
      };

      if (key in KEYMAP && !e.repeat) {
        padIdx = KEYMAP[key];
      }

      if (padIdx !== -1) {
        e.preventDefault();
        setSelectedPadIndex(padIdx);
        handleTriggerPad(padIdx, 1.0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerPad, setCurrentBank]);

  const handlePlayPause = () => {
    audioEngine.getContext();
    if (transport.playbackState === 'playing') {
      sequencerClock.pause();
      kickTimersRef.current.forEach((t) => window.clearTimeout(t));
      kickTimersRef.current.clear();
      document.querySelectorAll('.sync-kick-pulse').forEach((el) => el.classList.remove('kick-pulse-active'));
      setIsKickPulseActive(false);
      setTransport((prev) => ({ ...prev, playbackState: 'paused' }));
    } else {
      sequencerClock.start();
      setTransport((prev) => ({ ...prev, playbackState: 'playing' }));
    }
  };

  const handleSelectGroove = (groove: typeof PRESET_GROOVES[0]) => {
    if (activeGrooveId === groove.id && transport.playbackState === 'playing') {
      handlePlayPause();
      setActiveGrooveId(null);
    } else {
      setCurrentBank(groove.bank);
      setBpm(groove.bpm);
      if (groove.pattern) {
        setPattern(groove.pattern.map((r) => [...r]));
      } else {
        const preset = PRESET_LIBRARY[groove.bank];
        if (preset) {
          setPattern(preset.pattern.map((r) => [...r]));
        }
      }
      setPatternName(groove.name);
      setActiveGrooveId(groove.id);
      if (transport.playbackState !== 'playing') {
        audioEngine.getContext();
        sequencerClock.start();
        setTransport((prev) => ({ ...prev, playbackState: 'playing' }));
      }
    }
  };

  const handleCue = () => {
    audioEngine.getContext();
    sequencerClock.stopAndCue();
    kickTimersRef.current.forEach((t) => window.clearTimeout(t));
    kickTimersRef.current.clear();
    document.querySelectorAll('.sync-kick-pulse').forEach((el) => el.classList.remove('kick-pulse-active'));
    setIsKickPulseActive(false);
    setTransport((prev) => ({
      ...prev,
      playbackState: 'stopped',
      currentBar: 1,
      currentBeat: 1,
      currentSixteenth: 1,
    }));
    setCurrentStep(0);
  };

  const handleToggleSync = () => {
    setTransport((prev) => ({ ...prev, pitchBend: 0 }));
    setBpm(128);
  };

  const handleToggleQuantize = () =>
    setTransport((prev) => {
      const cycle: Record<string, QuantizeMode> = {
        SMART: '1/16',
        '1/16': '1/32',
        '1/32': '1/8',
        '1/8': 'OFF',
        OFF: 'SMART',
      };
      return { ...prev, quantize: cycle[prev.quantize] || 'SMART' };
    });

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);
    if (times.length > 4) times.shift();
    if (times.length > 1) {
      let intervalSum = 0;
      for (let i = 1; i < times.length; i++) intervalSum += times[i] - times[i - 1];
      const calculatedBpm = Math.round(60000 / (intervalSum / (times.length - 1)));
      if (calculatedBpm >= 40 && calculatedBpm <= 240) handleBpmChange(calculatedBpm);
    }
  };

  const handleToggleStep = (padIndex: number, stepIndex: number) => {
    setPattern((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[padIndex]) next[padIndex] = Array(16).fill(false);
      next[padIndex][stepIndex] = !next[padIndex][stepIndex];
      return next;
    });
  };

  const handleClearPattern = () => setPattern(createEmptyPattern());

  const handleFXChange = (fxUpdate: Partial<FXState>) =>
    setFxState((prev) => {
      const updated = { ...prev, ...fxUpdate };
      audioEngine.setFX(updated);
      return updated;
    });

  const handleEQChange = (eqUpdate: Partial<EQState>) =>
    setEqState((prev) => {
      const updated = { ...prev, ...eqUpdate };
      audioEngine.setEQ(updated);
      return updated;
    });

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    audioEngine.setMasterVolume(vol);
  };

  const handleMacroChange = (value: number, profile?: MacroProfile, latch?: boolean) => {
    setMacroState((prev) => {
      const updated: PerformanceMacroState = {
        value,
        profile: profile ?? prev.profile,
        latch: latch !== undefined ? latch : prev.latch,
      };
      audioEngine.setPerformanceMacro(updated.value, updated.profile);
      return updated;
    });
  };

  const handleDropTrigger = () => {
    audioEngine.triggerDropImpact();
    setMacroState((prev) => ({ ...prev, value: 0 }));
  };

  // ----------------------------------------------------
  // MASTER RECORDING CONTROLS
  // ----------------------------------------------------
  const handleToggleMasterRecord = async () => {
    audioEngine.getContext();

    if (isRecordingMaster) {
      // STOP RECORDING
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
        recTimerRef.current = null;
      }
      setIsRecordingMaster(false);

      const result = await audioEngine.stopRecording();
      if (result && result.blob) {
        const takeName = `Take ${recordedTakes.length + 1} • ${BANKS[currentBank]?.name || 'Mix'}`;
        const newTake: RecordedTake = {
          id: `take_${Date.now()}`,
          name: takeName,
          title: takeName,
          duration: recordingSeconds,
          durationSeconds: recordingSeconds,
          url: result.url,
          blobUrl: result.url,
          blob: result.blob,
          createdAt: Date.now(),
          bpm,
          bank: currentBank,
          mode: recConfig.mode,
        };
        const updated = [newTake, ...recordedTakes];
        setRecordedTakes(updated);
        try {
          localStorage.setItem(
            'soundmix_takes_meta_v1',
            JSON.stringify(updated.map((t) => ({ ...t, blob: undefined })))
          );
        } catch {}
      }
      setRecordingSeconds(0);
    } else {
      // START RECORDING
      if (recConfig.countIn) {
        for (let b = 1; b <= 4; b++) {
          audioEngine.playMetronomeClick(b);
        }
      }
      audioEngine.startRecording(recConfig);
      setIsRecordingMaster(true);
      setRecordingSeconds(0);

      const startTime = performance.now();
      recTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((performance.now() - startTime) / 1000);
      }, 100);
    }
  };

  const handlePlayTake = (take: RecordedTake) => {
    if (activeAudioTakeRef.current) {
      activeAudioTakeRef.current.pause();
      activeAudioTakeRef.current = null;
    }
    if (playingTakeId === take.id) {
      setPlayingTakeId(null);
      return;
    }
    const targetUrl = take.url || take.blobUrl;
    if (!targetUrl) return;

    const audio = new Audio(targetUrl);
    audio.onended = () => setPlayingTakeId(null);
    audio.play().catch((e) => console.error(e));
    activeAudioTakeRef.current = audio;
    setPlayingTakeId(take.id);
  };

  const handleStopTake = () => {
    if (activeAudioTakeRef.current) {
      activeAudioTakeRef.current.pause();
      activeAudioTakeRef.current = null;
    }
    setPlayingTakeId(null);
  };

  const handleDownloadTake = (take: RecordedTake) => {
    if (take.blob) {
      audioEngine.downloadRecordedTake(take.blob, `${take.name.replace(/\s+/g, '_')}.wav`);
    } else if (take.url || take.blobUrl) {
      const a = document.createElement('a');
      a.href = take.url || take.blobUrl!;
      a.download = `${take.name.replace(/\s+/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 500);
    }
  };

  const handleDeleteTake = (takeId: string) => {
    setRecordedTakes((prev) => {
      const filtered = prev.filter((t) => t.id !== takeId);
      try {
        localStorage.setItem(
          'soundmix_takes_meta_v1',
          JSON.stringify(filtered.map((t) => ({ ...t, blob: undefined })))
        );
      } catch {}
      return filtered;
    });
    if (playingTakeId === takeId) {
      handleStopTake();
    }
  };

  const currentBankConfig = BANKS[currentBank];

  return (
    <div
      className="h-[100dvh] w-full text-white flex flex-col items-center justify-center overflow-hidden font-inter select-none transition-colors duration-500"
      style={{ backgroundColor: activeThemeConfig.bgMain }}
      onPointerDown={() => audioEngine.getContext()}
    >
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onSelectLang={handleSelectLang}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        kickPulseEnabled={kickPulseEnabled}
        onToggleKickPulse={toggleKickPulse}
      />

      {/* Recording Settings Modal */}
      <RecordingModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        config={recConfig}
        onUpdateConfig={(c) => setRecConfig((prev) => ({ ...prev, ...c }))}
        takes={recordedTakes}
        onPlayTake={handlePlayTake}
        onStopTake={handleStopTake}
        onDownloadTake={handleDownloadTake}
        onDeleteTake={handleDeleteTake}
        playingTakeId={playingTakeId}
        lang={lang}
        theme={currentTheme}
      />

      {/* Top Desktop Helper Bar */}
      <div className="w-full max-w-[420px] hidden sm:flex items-center justify-between px-3 py-1.5 text-xs text-white/70 z-30 font-space">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeThemeConfig.accent }}
          />
          <span className="font-bold tracking-wider text-[11px]" style={{ color: activeThemeConfig.accent }}>
            {t.appName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Quick Kick Pulse Audio-Clock Sync Toggle */}
          <button
            onClick={toggleKickPulse}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
              kickPulseEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 text-white/50 border-white/10'
            }`}
            title="Toggle Audio Clock Synced Kick Drum Glow"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                kickPulseEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-white/30'
              }`}
            />
            <span>{kickPulseEnabled ? '⚡ KICK GLOW' : 'GLOW OFF'}</span>
          </button>
          {/* Quick Eco Mode */}
          <button
            onClick={toggleEcoMode}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
              ecoMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-white/60 border-white/10'
            }`}
            title="Eco Mode for weaker devices"
          >
            <span>{ecoMode ? '⚡ ECO 30fps' : '60fps'}</span>
          </button>
          {/* Quick Theme Cycle */}
          <button
            onClick={cycleTheme}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/15 text-[10px] font-bold transition-all border border-white/10 flex items-center gap-1"
            title="Cycle Theme"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeThemeConfig.accent }} />
            <span>{lang === 'uk' ? activeThemeConfig.nameUk : activeThemeConfig.nameEn}</span>
          </button>
          {/* Quick Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/15 text-[10px] font-bold transition-all border border-white/10"
            title="Toggle Language"
          >
            {lang === 'uk' ? '🇺🇦 UA' : '🇬🇧 EN'}
          </button>
        </div>
      </div>

      {/* Main iPhone Container with Dynamic Theme Accents & Kick Sync Target */}
      <div
        id="phone-chassis"
        className={`w-full h-full flex flex-col relative overflow-hidden transition-all duration-300 sm:max-w-[390px] sm:h-[844px] sm:max-h-[94dvh] sm:rounded-[44px] sm:border-2 ${
          kickPulseEnabled ? 'sync-kick-pulse kick-pulse-chassis' : ''
        }`}
        style={{
          backgroundColor: activeThemeConfig.bgPanel,
          borderColor: activeThemeConfig.borderSubtle,
          boxShadow: ecoMode ? 'none' : `0 0 50px ${activeThemeConfig.accentGlow}`,
          ['--theme-accent' as any]: activeThemeConfig.accent,
          ['--theme-accent-glow' as any]: activeThemeConfig.accentGlow,
          ['--theme-border-subtle' as any]: activeThemeConfig.borderSubtle,
        }}
      >
        {/* Ambient warehouse halo backdrop that pulses on kick drum triggers */}
        {kickPulseEnabled && (
          <div
            id="kick-ambient-halo"
            className="sync-kick-pulse kick-pulse-ambient pointer-events-none"
            style={{
              ['--theme-accent-glow' as any]: activeThemeConfig.accentGlow,
            }}
          />
        )}
        {/* Sleek Minimalist Top Navigation Header inside Device */}
        <header
          className="flex items-center justify-between px-3.5 pt-3 pb-1.5 z-20 border-b transition-all"
          style={{
            borderColor: activeThemeConfig.borderSubtle,
            backgroundColor: `${activeThemeConfig.bgPanel}F0`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              id="kick-sync-beacon"
              className={`w-2 h-2 rounded-full ${
                kickPulseEnabled ? 'sync-kick-pulse kick-pulse-beacon' : 'animate-pulse'
              }`}
              style={{ backgroundColor: activeThemeConfig.accent }}
              title={kickPulseEnabled ? 'Audio Clock Synced Kick Pulse' : 'Pulse'}
            />
            <div className="flex flex-col">
              <span className="font-space font-bold text-xs uppercase tracking-wider text-white">
                {t.appName}
              </span>
              <span className="text-[9px] font-mono text-white/40">
                {lang === 'uk' ? activeThemeConfig.nameUk : activeThemeConfig.nameEn} • {ecoMode ? 'ECO 30fps' : '96kHz DSP'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Master REC Quick Button */}
            <button
              onClick={handleToggleMasterRecord}
              className="px-2.5 h-7 rounded-xl flex items-center gap-1.5 border transition-all active:scale-95 select-none"
              style={{
                backgroundColor: isRecordingMaster ? '#FF003C' : activeThemeConfig.bgCard,
                borderColor: isRecordingMaster ? '#FF003C' : 'rgba(255,0,60,0.5)',
                color: isRecordingMaster ? '#FFFFFF' : '#FF003C',
                boxShadow: isRecordingMaster ? '0 0 14px rgba(255,0,60,0.8)' : 'none',
              }}
              title={isRecordingMaster ? 'Stop & Save Take' : 'Start Master Recording'}
            >
              <span
                className={`w-2 h-2 rounded-full ${isRecordingMaster ? 'bg-white animate-ping' : 'bg-red-500'}`}
              />
              <span className="font-space font-bold text-[10px] tracking-tight">
                {isRecordingMaster ? `${recordingSeconds.toFixed(1)}s` : 'REC'}
              </span>
            </button>

            {/* Quick Kick Pulse Toggle for Mobile */}
            <button
              onClick={toggleKickPulse}
              className="w-7 h-7 rounded-xl flex items-center justify-center border transition-all active:scale-95 text-[10px] font-bold"
              style={{
                backgroundColor: kickPulseEnabled ? `${activeThemeConfig.accent}20` : activeThemeConfig.bgCard,
                borderColor: kickPulseEnabled ? activeThemeConfig.accent : activeThemeConfig.borderSubtle,
                color: kickPulseEnabled ? activeThemeConfig.accent : 'rgba(255,255,255,0.3)',
                boxShadow: kickPulseEnabled ? `0 0 8px ${activeThemeConfig.accentGlow}` : 'none',
              }}
              title="Toggle Kick Drum Audio Pulse"
            >
              ⚡
            </button>

            {/* Quick Eco Mode Toggle for Mobile */}
            <button
              onClick={toggleEcoMode}
              className="w-7 h-7 rounded-xl flex items-center justify-center border transition-all active:scale-95 text-[10px] font-bold"
              style={{
                backgroundColor: ecoMode ? 'rgba(16, 185, 129, 0.2)' : activeThemeConfig.bgCard,
                borderColor: ecoMode ? '#10B981' : activeThemeConfig.borderSubtle,
                color: ecoMode ? '#10B981' : 'rgba(255,255,255,0.4)',
              }}
              title="Toggle Eco Performance Mode"
            >
              🌱
            </button>

            {/* Quick Theme Button */}
            <button
              onClick={cycleTheme}
              className="w-7 h-7 rounded-xl flex items-center justify-center border transition-all active:scale-95"
              style={{
                backgroundColor: activeThemeConfig.bgCard,
                borderColor: activeThemeConfig.borderSubtle,
              }}
              title="Theme"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeThemeConfig.accent }} />
            </button>

            {/* Quick Language Button */}
            <button
              onClick={toggleLanguage}
              className="px-2 h-7 rounded-xl text-[9.5px] font-space font-bold flex items-center justify-center border transition-all active:scale-95"
              style={{
                backgroundColor: activeThemeConfig.bgCard,
                borderColor: activeThemeConfig.borderSubtle,
                color: '#FFF',
              }}
              title="Language"
            >
              {lang === 'uk' ? 'UA' : 'EN'}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white/70 hover:text-white border transition-all active:scale-95"
              style={{
                backgroundColor: activeThemeConfig.bgCard,
                borderColor: activeThemeConfig.borderSubtle,
              }}
              title="Settings"
            >
              <IconSettings />
            </button>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-24 no-scrollbar flex flex-col gap-2.5 pt-2">
          {/* Universal Header OLED Display (Always Visible) */}
          <OLEDDisplay
            transport={transport}
            bankName={currentBankConfig.name}
            lang={lang}
            theme={currentTheme}
            onTapTempo={handleTapTempo}
            onBpmChange={handleBpmChange}
            onToggleQuantize={handleToggleQuantize}
            lastQuantizeSnap={lastQuantizeSnap}
          />

          {/* Tab 1: Performance Pads & Curated Grooves */}
          {activeTab === 'pads' && (
            <>
              <PreviewGroovesBar
                currentBank={currentBank}
                isPlaying={transport.playbackState === 'playing'}
                activeGrooveId={activeGrooveId}
                onSelectGroove={handleSelectGroove}
                lang={lang}
                theme={currentTheme}
              />
              <BankSelector
                currentBank={currentBank}
                lang={lang}
                theme={currentTheme}
                onSelectBank={setCurrentBank}
              />
              <div className="flex-1 flex flex-col justify-end">
                <PerformancePads
                  pads={currentBankConfig.pads}
                  currentBank={currentBank}
                  lang={lang}
                  theme={currentTheme}
                  onTriggerPad={handleTriggerPad}
                  activePadIndices={activePadIndices}
                />
              </div>
            </>
          )}

          {/* Tab 2: Step Sequencer */}
          {activeTab === 'sequencer' && (
            <>
              <TransportDeck
                transport={transport}
                isRecording={isSequencerStepRecording}
                lang={lang}
                theme={currentTheme}
                onPlayPause={handlePlayPause}
                onCue={handleCue}
                onToggleSync={handleToggleSync}
                onToggleQuantize={handleToggleQuantize}
                onToggleRecord={() => setIsSequencerStepRecording((p) => !p)}
              />
              <StepSequencer
                pattern={pattern}
                currentStep={currentStep}
                selectedPadIndex={selectedPadIndex}
                pads={currentBankConfig.pads}
                currentBank={currentBank}
                lang={lang}
                theme={currentTheme}
                onToggleStep={handleToggleStep}
                onSelectPad={setSelectedPadIndex}
                onClearPattern={handleClearPattern}
                onResetPreset={resetToFactoryPreset}
              />
            </>
          )}

          {/* Tab 3: Backing Track Deck */}
          {activeTab === 'track' && (
            <TrackDeck
              lang={lang}
              theme={currentTheme}
              onTrackLoaded={(name) => {
                console.log('Loaded track:', name);
              }}
            />
          )}

          {/* Tab 4: Performance Mixer & Color FX */}
          {activeTab === 'fx' && (
            <>
              <TempoSlider
                pitchBend={transport.pitchBend}
                lang={lang}
                theme={currentTheme}
                onPitchChange={(p) => setTransport((prev) => ({ ...prev, pitchBend: p }))}
                onResetPitch={() => setTransport((prev) => ({ ...prev, pitchBend: 0 }))}
              />
              <SoundColorFXDeck
                fxState={fxState}
                eqState={eqState}
                macroState={macroState}
                masterVolume={masterVolume}
                lang={lang}
                theme={currentTheme}
                onFXChange={handleFXChange}
                onEQChange={handleEQChange}
                onMacroChange={handleMacroChange}
                onDropTrigger={handleDropTrigger}
                onMasterVolumeChange={handleMasterVolumeChange}
              />
            </>
          )}

          {/* Tab 5: Master Recordings & Takes Library */}
          {activeTab === 'takes' && (
            <TakesView
              takes={recordedTakes}
              isRecording={isRecordingMaster}
              recordingDuration={recordingSeconds}
              config={recConfig}
              onUpdateConfig={(cfg) => setRecConfig((prev) => ({ ...prev, ...cfg }))}
              onToggleRecord={handleToggleMasterRecord}
              onPlayTake={handlePlayTake}
              onStopTake={handleStopTake}
              onDownloadTake={handleDownloadTake}
              onDeleteTake={handleDeleteTake}
              playingTakeId={playingTakeId}
              lang={lang}
              theme={currentTheme}
            />
          )}
        </div>

        {/* Native Bottom Tab Bar & Home Indicator */}
        <footer
          className="absolute bottom-0 left-0 right-0 h-[68px] backdrop-blur-lg border-t flex flex-col justify-between px-2 pt-1 pb-1.5 z-20 transition-all"
          style={{
            backgroundColor: `${activeThemeConfig.bgPanel}F5`,
            borderColor: activeThemeConfig.borderSubtle,
          }}
        >
          <div className="flex items-center justify-around w-full">
            {/* Pads Tab */}
            <button
              onClick={() => setActiveTab('pads')}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all"
              style={{
                color: activeTab === 'pads' ? activeThemeConfig.accent : 'rgba(255, 255, 255, 0.4)',
                transform: activeTab === 'pads' ? 'scale(1.05)' : 'scale(1)',
                fontWeight: activeTab === 'pads' ? 'bold' : 'normal',
              }}
            >
              <IconPads />
              <span className="text-[9.5px] font-space tracking-tight">{t.tabs.pads}</span>
            </button>

            {/* Sequencer Tab */}
            <button
              onClick={() => setActiveTab('sequencer')}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all"
              style={{
                color: activeTab === 'sequencer' ? activeThemeConfig.accentSecondary : 'rgba(255, 255, 255, 0.4)',
                transform: activeTab === 'sequencer' ? 'scale(1.05)' : 'scale(1)',
                fontWeight: activeTab === 'sequencer' ? 'bold' : 'normal',
              }}
            >
              <IconSeq />
              <span className="text-[9.5px] font-space tracking-tight">{t.tabs.sequencer}</span>
            </button>

            {/* Track Backing Deck Tab */}
            <button
              onClick={() => setActiveTab('track')}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all"
              style={{
                color: activeTab === 'track' ? '#00F0FF' : 'rgba(255, 255, 255, 0.4)',
                transform: activeTab === 'track' ? 'scale(1.05)' : 'scale(1)',
                fontWeight: activeTab === 'track' ? 'bold' : 'normal',
              }}
            >
              <IconTrack />
              <span className="text-[9.5px] font-space tracking-tight">{t.tabs.track || 'Track'}</span>
            </button>

            {/* FX / EQ Tab */}
            <button
              onClick={() => setActiveTab('fx')}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all"
              style={{
                color: activeTab === 'fx' ? activeThemeConfig.accentTertiary : 'rgba(255, 255, 255, 0.4)',
                transform: activeTab === 'fx' ? 'scale(1.05)' : 'scale(1)',
                fontWeight: activeTab === 'fx' ? 'bold' : 'normal',
              }}
            >
              <IconFX />
              <span className="text-[9.5px] font-space tracking-tight">{t.tabs.fx}</span>
            </button>

            {/* Takes / Record Tab */}
            <button
              onClick={() => setActiveTab('takes')}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all relative"
              style={{
                color: activeTab === 'takes' ? '#FF003C' : 'rgba(255, 255, 255, 0.4)',
                transform: activeTab === 'takes' ? 'scale(1.05)' : 'scale(1)',
                fontWeight: activeTab === 'takes' ? 'bold' : 'normal',
              }}
            >
              <div className="relative">
                <IconTakes />
                {isRecordingMaster && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <span className="text-[9.5px] font-space tracking-tight">{t.tabs.takes || 'Takes'}</span>
            </button>
          </div>

          {/* iPhone Home Indicator Pill */}
          <div
            className="w-28 h-1 rounded-full mx-auto transition-all"
            style={{ backgroundColor: `${activeThemeConfig.accent}50` }}
          />
        </footer>
      </div>
    </div>
  );
};
