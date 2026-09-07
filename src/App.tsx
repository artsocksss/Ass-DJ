import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BankId, EQState, FXState, TransportState, VUMeterData, MidiMappableParam, MidiMappings, Language } from './types';
import { BANKS, KEYBOARD_KEYS } from './audio/soundPresets';
import { audioEngine } from './audio/AudioEngine';
import { sequencerClock } from './audio/SequencerClock';
import { createEmptyPattern } from './audio/presetPatterns';
import { webMidiService } from './utils/WebMidiService';
import { usePersistentPatternAndBpm } from './utils/usePersistentPatternAndBpm';
import { TRANSLATIONS } from './utils/translations';

import { OLEDDisplay } from './components/OLEDDisplay';
import { TransportDeck } from './components/TransportDeck';
import { TempoSlider } from './components/TempoSlider';
import { PerformancePads } from './components/PerformancePads';
import { StepSequencer } from './components/StepSequencer';
import { SoundColorFXDeck } from './components/SoundColorFXDeck';
import { BankSelector } from './components/BankSelector';
import { MidiMappingModal } from './components/MidiMappingModal';

// SVG Icons for iOS Tab Bar
const IconPads = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
  </svg>
);
const IconSeq = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="transition-all duration-200 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.45)]"
  >
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
  const [vuData, setVuData] = useState<VUMeterData>({ left: 0, right: 0, peakLeft: 0, peakRight: 0 });
  const [activeTab, setActiveTab] = useState<'pads' | 'sequencer' | 'fx'>('pads');

  // Desktop iPhone 12 Pro frame toggle
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);

  // Status bar live clock
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [midiMappings, setMidiMappings] = useState<MidiMappings>({
    master_volume: 7,
    fx_param: 1,
    eq_high: null,
    eq_mid: null,
    eq_low: null,
    pitch_bend: null,
  });
  const [learningParam, setLearningParam] = useState<MidiMappableParam | null>(null);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const tapTimesRef = useRef<number[]>([]);
  const midiMappingsRef = useRef(midiMappings);
  midiMappingsRef.current = midiMappings;
  const learningParamRef = useRef(learningParam);
  learningParamRef.current = learningParam;

  useEffect(() => {
    // Automatic AudioContext unlock for iOS / Safari on first touch or interaction
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

    audioEngine.setVUMeterListener((vu) => setVuData(vu));
    sequencerClock.setCallbacks(
      (step, time) => {
        const activePattern = patternRef.current;
        for (let pad = 0; pad < 16; pad++) {
          if (activePattern[pad] && activePattern[pad][step]) audioEngine.triggerPad(pad, 0.95, time);
        }
      },
      (step, bar, beat, sixteenth) => {
        setCurrentStep(step);
        setTransport((prev) => ({ ...prev, currentBar: bar, currentBeat: beat, currentSixteenth: sixteenth }));
      }
    );

    webMidiService.init((event) => {
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) {
        handleTriggerPad(event.padIndex, event.velocity);
      } else if (event.type === 'cc' && event.controller !== undefined && event.value !== undefined) {
        const lp = learningParamRef.current;
        if (lp) {
          setMidiMappings((prev) => ({ ...prev, [lp]: event.controller! }));
          setLearningParam(null);
        } else {
          const m = midiMappingsRef.current;
          if (event.controller === m.master_volume) {
            const vol = event.value;
            setMasterVolume(vol);
            audioEngine.setMasterVolume(vol);
          } else if (event.controller === m.fx_param) {
            const param = (event.value - 0.5) * 2;
            setFxState((prev) => {
              const next = { ...prev, param };
              audioEngine.setFX(next);
              return next;
            });
          } else if (event.controller === m.eq_high) {
            const high = event.value * 30 - 24;
            setEqState((prev) => {
              const next = { ...prev, high };
              audioEngine.setEQ(next);
              return next;
            });
          } else if (event.controller === m.eq_mid) {
            const mid = event.value * 30 - 24;
            setEqState((prev) => {
              const next = { ...prev, mid };
              audioEngine.setEQ(next);
              return next;
            });
          } else if (event.controller === m.eq_low) {
            const low = event.value * 30 - 24;
            setEqState((prev) => {
              const next = { ...prev, low };
              audioEngine.setEQ(next);
              return next;
            });
          } else if (event.controller === m.pitch_bend) {
            setTransport((prev) => ({ ...prev, pitchBend: Math.round((event.value! - 0.5) * 24) }));
          }
        }
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
      const padIdx = KEYBOARD_KEYS.indexOf(key);
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
    <div className="h-[100dvh] w-full bg-[#E2DFDA] text-[#111113] flex flex-col items-center justify-center overflow-hidden font-inter select-none">
      {/* Top Desktop Helper Bar (Language Toggle + iPhone frame mode) */}
      <div className="w-full max-w-[430px] hidden sm:flex items-center justify-between px-3 py-1.5 text-xs text-[#111113]/80 z-30 font-space">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-[11px] text-[#111113]">
            {t.iphoneMode} (390 × 844)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceFrameMode(!deviceFrameMode)}
            className="px-2.5 py-1 rounded-full bg-white text-[#111113] border-2 border-[#111113] text-[11px] font-bold shadow-[0_1px_0_#111113] transition-all"
          >
            {deviceFrameMode ? 'В рамці iPhone' : 'На весь екран'}
          </button>
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-full bg-[#111113] text-white text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1 shadow-[0_1px_0_#111113]"
          >
            <span>{lang === 'uk' ? '🇺🇦 Укр' : '🇬🇧 Eng'}</span>
          </button>
        </div>
      </div>

      {/* Main iPhone Container with Variation 1 Styling */}
      <div
        className={`w-full bg-[#F8F7F4] h-full flex flex-col relative overflow-hidden transition-all duration-300 ${
          deviceFrameMode
            ? 'sm:max-w-[390px] sm:h-[844px] sm:max-h-[92dvh] sm:rounded-[40px] sm:border-2 sm:border-[#111113] sm:shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
            : 'max-w-md border-x-2 border-[#111113]'
        }`}
      >
        {/* iOS Status Bar */}
        <div className="flex-shrink-0 pt-2 px-6 flex items-center justify-between z-20 bg-[#F8F7F4] select-none">
          {/* iOS Clock */}
          <div className="text-[13px] font-bold tracking-tight text-[#111113] w-14 font-space pl-1">
            {currentTime}
          </div>

          {/* iPhone Speaker Ear-piece Notch */}
          <div className="h-4 w-28 bg-[#111113] rounded-b-xl flex items-center justify-center gap-2 px-2">
            <div className="w-8 h-1 bg-[#333333] rounded-full" />
            <div className="w-2 h-2 rounded-full bg-[#222222] border border-neutral-700 flex items-center justify-center">
              <div className="w-0.5 h-0.5 rounded-full bg-blue-400/60" />
            </div>
          </div>

          {/* iOS Status Glyphs: 5G, Wi-Fi, Battery */}
          <div className="flex items-center gap-1.5 text-[#111113] w-14 justify-end">
            <span className="text-[10px] font-bold font-space tracking-tighter">5G</span>
            {/* Wi-Fi Icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.55 0 6.77 1.45 9.12 3.8L12 19.3 2.88 11.3C5.23 8.95 8.45 7.5 12 7.5z" />
            </svg>
            {/* Battery Icon */}
            <div className="w-5 h-2.5 rounded-[4px] border-2 border-[#111113] p-0.5 flex items-center relative">
              <div className="h-full w-full bg-[#111113] rounded-[1px]" />
              <div className="w-0.5 h-1 bg-[#111113] absolute -right-1 rounded-r-xs" />
            </div>
          </div>
        </div>

        {/* App Title Header */}
        <header className="flex-shrink-0 pt-2 pb-2.5 px-5 flex items-center justify-between z-10 bg-[#F8F7F4] border-b-2 border-[#111113]">
          <div>
            <div className="label-tech text-[#111113]">Pioneer MixSound</div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111113] font-space flex items-center gap-2">
              <span
                style={{
                  borderColor: '#1b3f81',
                  color: '#ffffff',
                  fontFamily: '"Courier New", Courier, monospace',
                  fontWeight: 'bold',
                  textDecorationLine: 'none',
                  fontSize: '21px',
                  lineHeight: '18px',
                  textAlign: 'left',
                  fontStyle: 'normal',
                  backgroundColor: '#3c3838',
                }}
                className="px-2 py-1 rounded border"
              >
                {t.appName}
              </span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#111113] text-[#F8F7F4] uppercase font-space tracking-wider flex items-center gap-1">
                <span>⚡️</span> ARTSS•MULTIMIX
              </span>
            </h1>
            <p className="text-[10px] text-[#111113]/70 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{t.appSubtitle}</span>
              <span className="text-[#111113]/40 font-bold">•</span>
              <span className="text-[#E94E38] font-bold font-space">by ⚡️ARTSS•MULTIMIX</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Language Switcher button */}
            <button
              onClick={toggleLanguage}
              className="sm:hidden px-2.5 py-1 text-[10px] font-bold font-space rounded-full bg-white border-2 border-[#111113] text-[#111113] hover:bg-[#FAF9F5] active:scale-95 transition-all shadow-[0_1px_0_#111113] flex items-center gap-1"
            >
              <span className="text-[#E94E38]">⚡️</span>
              <span>{lang === 'uk' ? 'UA' : 'EN'}</span>
            </button>

            {/* Stereo Master Output Meter */}
            <div className="flex gap-0.5 h-3 w-5 opacity-90 p-0.5 border border-[#111113] rounded-sm bg-white">
              <div
                className="h-full bg-[#111113] rounded-xs transition-all duration-75"
                style={{ width: `${vuData.left * 100}%` }}
              />
              <div
                className="h-full bg-[#E94E38] rounded-xs transition-all duration-75"
                style={{ width: `${vuData.right * 100}%` }}
              />
            </div>

            {/* Audio Engine Initializer / Active Indicator */}
            <button
              onClick={() => audioEngine.getContext()}
              className="w-7 h-7 rounded-full bg-white border-2 border-[#111113] flex items-center justify-center active:scale-95 transition-transform shadow-[0_1px_0_#111113]"
              title={t.audioActive}
            >
              <span className="w-2 h-2 bg-[#E94E38] rounded-full animate-pulse" />
            </button>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 no-scrollbar flex flex-col gap-3.5 pt-3">
          {activeTab === 'pads' && (
            <>
              <OLEDDisplay
                transport={transport}
                bankName={currentBankConfig.name}
                vuData={vuData}
                lang={lang}
                hasCustomEdits={hasCustomEdits}
                patternName={patternName}
                onPatternNameChange={setPatternName}
                onSavePattern={saveCurrentPattern}
                savedPatterns={savedPatterns}
                onLoadSavedPattern={loadSavedPattern}
                onDeleteSavedPattern={deleteSavedPattern}
                onTapTempo={handleTapTempo}
                onBpmChange={handleBpmChange}
              />
              <BankSelector currentBank={currentBank} lang={lang} onSelectBank={setCurrentBank} />
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
              <PerformancePads
                pads={currentBankConfig.pads}
                currentBank={currentBank}
                lang={lang}
                onTriggerPad={handleTriggerPad}
                activePadIndices={activePadIndices}
              />
            </>
          )}

          {activeTab === 'sequencer' && (
            <>
              <OLEDDisplay
                transport={transport}
                bankName={currentBankConfig.name}
                vuData={vuData}
                lang={lang}
                hasCustomEdits={hasCustomEdits}
                patternName={patternName}
                onPatternNameChange={setPatternName}
                onSavePattern={saveCurrentPattern}
                savedPatterns={savedPatterns}
                onLoadSavedPattern={loadSavedPattern}
                onDeleteSavedPattern={deleteSavedPattern}
                onTapTempo={handleTapTempo}
                onBpmChange={handleBpmChange}
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

          {activeTab === 'fx' && (
            <>
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xs font-bold font-space text-[#111113] uppercase tracking-widest">
                  {t.fxHeader}
                </h2>
                <button
                  onClick={() => setIsMidiModalOpen(true)}
                  className="px-3 py-1 bg-white rounded-full text-xs font-space font-bold text-[#111113] active:scale-95 transition-transform border-2 border-[#111113] shadow-[0_1px_0_#111113] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E94E38]" />
                  {t.midiLearn}
                </button>
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

        {/* Native Bottom Tab Bar & Home Indicator with Variation 1 Styling */}
        <footer className="absolute bottom-0 left-0 right-0 h-[76px] bg-[#F8F7F4] border-t-2 border-[#111113] flex flex-col justify-between px-3 pt-2 pb-2 z-20">
          <div className="flex items-center justify-around w-full">
            <button
              onClick={() => setActiveTab('pads')}
              className={`flex flex-col items-center gap-1 w-20 py-1 transition-all ${
                activeTab === 'pads' ? 'text-[#111113] scale-105 font-bold' : 'text-[#111113]/50 hover:text-[#111113]'
              }`}
            >
              <IconPads />
              <span className="text-[10.5px] font-space font-bold tracking-tight">{t.tabs.pads}</span>
            </button>
            <button
              onClick={() => setActiveTab('sequencer')}
              className={`group flex flex-col items-center gap-1 w-20 py-1 transition-all ${
                activeTab === 'sequencer'
                  ? 'text-[#E94E38] scale-105 font-bold'
                  : 'text-[#111113]/50 hover:text-[#111113]'
              }`}
            >
              <IconSeq />
              <span className="text-[10.5px] font-space font-bold tracking-tight">{t.tabs.sequencer}</span>
            </button>
            <button
              onClick={() => setActiveTab('fx')}
              className={`flex flex-col items-center gap-1 w-20 py-1 transition-all ${
                activeTab === 'fx' ? 'text-[#111113] scale-105 font-bold' : 'text-[#111113]/50 hover:text-[#111113]'
              }`}
            >
              <IconFX />
              <span className="text-[10.5px] font-space font-bold tracking-tight">{t.tabs.fx}</span>
            </button>
          </div>

          {/* iPhone Home Indicator Pill */}
          <div className="w-32 h-1 bg-[#111113]/40 rounded-full mx-auto" />
        </footer>

        {/* MIDI Mapping Modal */}
        <MidiMappingModal
          isOpen={isMidiModalOpen}
          onClose={() => {
            setIsMidiModalOpen(false);
            setLearningParam(null);
          }}
          mappings={midiMappings}
          learningParam={learningParam}
          lang={lang}
          onStartLearning={setLearningParam}
          onClearMapping={(param) => setMidiMappings((prev) => ({ ...prev, [param]: null }))}
        />
      </div>
    </div>
  );
};
