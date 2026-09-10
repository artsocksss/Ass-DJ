import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BankId, EQState, FXState, TransportState, MidiMappableParam, MidiMappings, Language, ActiveTab } from './types';
import { audioEngine } from './audio/AudioEngine';
import { sequencerClock } from './audio/SequencerClock';
import { createEmptyPattern, PRESET_LIBRARY } from './audio/presetPatterns';
import { PRESET_GROOVES, BANKS } from './audio/soundPresets';
import { webMidiService } from './utils/WebMidiService';
import { usePersistentPatternAndBpm } from './utils/usePersistentPatternAndBpm';
import { TRANSLATIONS } from './utils/translations';

import { OLEDDisplay } from './components/OLEDDisplay';
import { PreviewGroovesBar } from './components/PreviewGroovesBar';
import { TransportDeck } from './components/TransportDeck';
import { TempoSlider } from './components/TempoSlider';
import { PerformancePads } from './components/PerformancePads';
import { StepSequencer } from './components/StepSequencer';
import { SoundColorFXDeck } from './components/SoundColorFXDeck';
import { BankSelector } from './components/BankSelector';
import { ClubVUMeter } from './components/ClubVUMeter';

// SVG Icons for iOS Tab Bar
const IconPads = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
  </svg>
);
const IconSeq = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);
const IconFX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

export const App: React.FC = () => {
  // Ukrainian language state (default: 'uk', persisted in localStorage)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('soundmix_lang_v2');
      if (saved === 'uk' || saved === 'en') return saved;
    } catch {
      // Fallback
    }
    return 'uk';
  });

  const t = TRANSLATIONS[lang];

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'uk' ? 'en' : 'uk';
      try {
        localStorage.setItem('soundmix_lang_v2', next);
      } catch {
        // Fallback
      }
      return next;
    });
  };

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
    saveCurrentPattern,
    savedPatterns,
    loadSavedPattern,
    deleteSavedPattern,
    resetToFactoryPreset,
    hasCustomEdits,
  } = usePersistentPatternAndBpm('A');

  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(0);
  const [activePadIndices, setActivePadIndices] = useState<Set<number>>(new Set());

  const [transport, setTransport] = useState<TransportState>({
    playbackState: 'stopped',
    bpm: bpm,
    pitchRange: 10,
    pitchBend: 0,
    masterTempo: true,
    quantize: '1/16',
    currentBar: 1,
    currentBeat: 1,
    currentSixteenth: 1,
    key: '8A',
  });

  // Keep transport.bpm in sync with persistent bpm
  useEffect(() => {
    setTransport((prev) => ({ ...prev, bpm }));
  }, [bpm]);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
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
  const [masterVolume, setMasterVolume] = useState<number>(0.9);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pads');
  const [activeGrooveId, setActiveGrooveId] = useState<string | null>(null);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const tapTimesRef = useRef<number[]>([]);

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

    // Initialize Web MIDI service & listen for Note messages only (simplified)
    webMidiService.init((event) => {
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) {
        handleTriggerPad(event.padIndex, event.velocity);
      }
    });

    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('touchend', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      sequencerClock.stopAndCue();
    };
  }, []);

  useEffect(() => {
    audioEngine.currentBank = currentBank;
  }, [currentBank]);

  useEffect(() => {
    // Pitch shift multiplier based on +/- 12 semitones: 2^(semitones / 12)
    const semitones = transport.pitchBend;
    const pitchFactor = Math.pow(2, semitones / 12);
    sequencerClock.setBpm(bpm * (transport.masterTempo ? 1.0 : pitchFactor));
    audioEngine.pitchShiftMultiplier = pitchFactor;
  }, [bpm, transport.pitchBend, transport.masterTempo]);

  const handleTriggerPad = useCallback(
    (padIndex: number, velocity: number = 1.0) => {
      audioEngine.getContext();
      audioEngine.triggerPad(padIndex, velocity);
      setActivePadIndices((prev) => new Set(prev).add(padIndex));
      setTimeout(() => {
        setActivePadIndices((prev) => {
          const next = new Set(prev);
          next.delete(padIndex);
          return next;
        });
      }, 120);

      if (isRecordingRef.current) {
        const step = currentStepRef.current;
        setPattern((prev) => {
          const next = prev.map((row) => [...row]);
          if (!next[padIndex]) next[padIndex] = Array(16).fill(false);
          next[padIndex][step] = true;
          return next;
        });
      }
    },
    [setPattern]
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
        if (key === 'a' || key === '!') {
          setCurrentBank('A');
          return;
        }
        if (key === 'b' || key === '@') {
          setCurrentBank('B');
          return;
        }
        if (key === 'c' || key === '#') {
          setCurrentBank('C');
          return;
        }
        if (key === 'd' || key === '$') {
          setCurrentBank('D');
          return;
        }
      }

      const KEYMAP: Record<string, number> = {
        '1':0, '2':1, '3':2, '4':3,
        'q':4, 'w':5, 'e':6, 'r':7,
        'a':8, 's':9, 'd':10,'f':11,
        'z':12,'x':13,'c':14,'v':15
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
    setTransport((prev) => ({ ...prev, quantize: prev.quantize === '1/16' ? 'OFF' : '1/16' }));

  const handleToggleRecord = () => setIsRecording((prev) => !prev);

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

  const currentBankConfig = BANKS[currentBank];

  return (
    <div 
      className="h-[100dvh] w-full bg-[#07070A] text-white flex flex-col items-center justify-center overflow-hidden font-inter select-none"
      onPointerDown={() => audioEngine.getContext()}
    >
      {/* Top Desktop Helper Bar (Language Toggle + iPhone frame mode) */}
      <div className="w-full max-w-[420px] hidden sm:flex items-center justify-between px-3 py-1.5 text-xs text-white/70 z-30 font-space">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_6px_#00FF66]" />
          <span className="font-bold tracking-wider text-[11px] text-[#00F0FF]">
            {t.iphoneMode} (390 × 844) • {t.scaleMode}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-full bg-[#12121A] text-[#00F0FF] border border-[#00F0FF]/40 text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
          >
            <span>{lang === 'uk' ? '🇺🇦 Укр' : '🇬🇧 Eng'}</span>
          </button>
        </div>
      </div>

      {/* Main iPhone Container with Club Black & Neon Accents */}
      <div className="w-full bg-[#08080C] h-full flex flex-col relative overflow-hidden transition-all duration-300 gpu-layer sm:max-w-[390px] sm:h-[844px] sm:max-h-[94dvh] sm:rounded-[44px] sm:border-2 sm:border-[#00F0FF]/30 sm:shadow-[0_0_50px_rgba(0,240,255,0.2)]">

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-24 no-scrollbar flex flex-col gap-2.5 pt-[calc(env(safe-area-inset-top)+12px)]">
          {/* Universal Header Display (Always Visible) */}
          <OLEDDisplay
            transport={transport}
            bankName={currentBankConfig.name}
            lang={lang}
            onTapTempo={handleTapTempo}
            onBpmChange={handleBpmChange}
          />

          {/* Tab 2: Performance Pads & Vivid Preview Grooves */}
          {activeTab === 'pads' && (
            <>
              <PreviewGroovesBar
                currentBank={currentBank}
                isPlaying={transport.playbackState === 'playing'}
                activeGrooveId={activeGrooveId}
                onSelectGroove={handleSelectGroove}
                lang={lang}
              />
              <BankSelector currentBank={currentBank} lang={lang} onSelectBank={setCurrentBank} />
              <div className="flex-1 flex flex-col justify-end">
                <PerformancePads
                  pads={currentBankConfig.pads}
                  currentBank={currentBank}
                  lang={lang}
                  onTriggerPad={handleTriggerPad}
                  activePadIndices={activePadIndices}
                />
              </div>
            </>
          )}

          {/* Tab 3: Step Sequencer */}
          {activeTab === 'sequencer' && (
            <>
              <TransportDeck
                transport={transport}
                isRecording={isRecording}
                lang={lang}
                onPlayPause={handlePlayPause}
                onCue={handleCue}
                onToggleSync={handleToggleSync}
                onToggleQuantize={handleToggleQuantize}
                onToggleRecord={handleToggleRecord}
              />
              <StepSequencer
                pattern={pattern}
                currentStep={currentStep}
                selectedPadIndex={selectedPadIndex}
                pads={currentBankConfig.pads}
                currentBank={currentBank}
                lang={lang}
                onToggleStep={handleToggleStep}
                onSelectPad={setSelectedPadIndex}
                onClearPattern={handleClearPattern}
                onResetPreset={resetToFactoryPreset}
              />
            </>
          )}

          {/* Tab 4: Performance Mixer & Color FX */}
          {activeTab === 'fx' && (
            <>
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xs font-bold font-space text-[#00F0FF] uppercase tracking-widest flex items-center gap-1.5">
                  <span>⚡️</span>
                  <span>{t.fxHeader}</span>
                </h2>
              </div>
              <TempoSlider
                pitchBend={transport.pitchBend}
                lang={lang}
                onPitchChange={(p) => setTransport((prev) => ({ ...prev, pitchBend: p }))}
                onResetPitch={() => setTransport((prev) => ({ ...prev, pitchBend: 0 }))}
              />
              <SoundColorFXDeck
                fxState={fxState}
                eqState={eqState}
                masterVolume={masterVolume}
                lang={lang}
                onFXChange={handleFXChange}
                onEQChange={handleEQChange}
                onMasterVolumeChange={handleMasterVolumeChange}
              />
            </>
          )}
        </div>

        {/* Native Bottom Tab Bar & iPhone Home Indicator with Club Neon Highlights */}
        <footer className="absolute bottom-0 left-0 right-0 h-[74px] bg-[#0A0A0F]/95 backdrop-blur-md border-t border-[#00F0FF]/25 flex flex-col justify-between px-2 pt-1.5 pb-2 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-around w-full">
            <button
              onClick={() => setActiveTab('pads')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                activeTab === 'pads'
                  ? 'text-[#FF007F] scale-105 font-bold drop-shadow-[0_0_8px_rgba(255,0,127,0.7)]'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <IconPads />
              <span className="text-[10px] font-space font-bold tracking-tight">{t.tabs.pads}</span>
            </button>
            <button
              onClick={() => setActiveTab('sequencer')}
              className={`group flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                activeTab === 'sequencer'
                  ? 'text-[#FFE600] scale-105 font-bold drop-shadow-[0_0_8px_rgba(255,230,0,0.7)]'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <IconSeq />
              <span className="text-[10px] font-space font-bold tracking-tight">{t.tabs.sequencer}</span>
            </button>
            <button
              onClick={() => setActiveTab('fx')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                activeTab === 'fx'
                  ? 'text-[#00FF66] scale-105 font-bold drop-shadow-[0_0_8px_rgba(0,255,102,0.7)]'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <IconFX />
              <span className="text-[10px] font-space font-bold tracking-tight">{t.tabs.fx}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg transition-all text-white/40 hover:text-white/80"
            >
              <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#141420] border border-white/20 text-[9px] font-bold">
                {lang === 'uk' ? 'UA' : 'EN'}
              </div>
              <span className="text-[10px] font-space font-bold tracking-tight">LAN</span>
            </button>
          </div>
          {/* iPhone Home Indicator Pill with Neon Cyan Glow */}
          <div className="w-32 h-1 bg-[#00F0FF]/40 rounded-full mx-auto shadow-[0_0_6px_rgba(0,240,255,0.4)]" />
        </footer>
      </div>
    </div>
  );
};
