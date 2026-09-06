import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BankId, EQState, FXState, TransportState, VUMeterData } from './types';
import { BANKS, KEYBOARD_KEYS } from './audio/soundPresets';
import { audioEngine } from './audio/AudioEngine';
import { sequencerClock } from './audio/SequencerClock';
import { PRESET_LIBRARY, createEmptyPattern } from './audio/presetPatterns';
import { webMidiService } from './utils/WebMidiService';

import { OLEDDisplay } from './components/OLEDDisplay';
import { TransportDeck } from './components/TransportDeck';
import { TempoSlider } from './components/TempoSlider';
import { PerformancePads } from './components/PerformancePads';
import { StepSequencer } from './components/StepSequencer';
import { SoundColorFXDeck } from './components/SoundColorFXDeck';
import { BankSelector } from './components/BankSelector';

export const App: React.FC = () => {
  // ----------------------------------------------------
  // APP STATE
  // ----------------------------------------------------
  const [currentBank, setCurrentBank] = useState<BankId>('A');
  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(0);
  const [activePadIndices, setActivePadIndices] = useState<Set<number>>(new Set());
  const [activePadName, setActivePadName] = useState<string | null>(null);

  const [transport, setTransport] = useState<TransportState>({
    playbackState: 'stopped',
    bpm: 128,
    pitchRange: 10,
    pitchBend: 0,
    masterTempo: true,
    quantize: '1/16',
    currentBar: 1,
    currentBeat: 1,
    currentSixteenth: 1,
    key: '8A / Am',
  });

  const [pattern, setPattern] = useState<boolean[][]>(() => PRESET_LIBRARY.A.pattern);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [swing, setSwing] = useState<number>(0);
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
  const [vuData, setVuData] = useState<VUMeterData>({
    left: 0,
    right: 0,
    peakLeft: 0,
    peakRight: 0,
  });

  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pads' | 'sequencer' | 'fx'>('pads');

  // Ref tracking for real-time audio thread synchronization
  const patternRef = useRef(pattern);
  patternRef.current = pattern;

  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;

  const tapTimesRef = useRef<number[]>([]);

  // ----------------------------------------------------
  // INITIALIZATION & AUDIO CLOCK WIRING
  // ----------------------------------------------------
  useEffect(() => {
    // Connect VU meter listener
    audioEngine.setVUMeterListener((vu) => {
      setVuData(vu);
    });

    // Connect Sequencer Clock
    sequencerClock.setCallbacks(
      // Step scheduled on Web Audio clock
      (step, time) => {
        const activePattern = patternRef.current;
        for (let pad = 0; pad < 16; pad++) {
          if (activePattern[pad] && activePattern[pad][step]) {
            audioEngine.triggerPad(pad, 0.95, time);
          }
        }
      },
      // Step scheduled for UI playhead
      (step, bar, beat, sixteenth) => {
        setCurrentStep(step);
        setTransport((prev) => ({
          ...prev,
          currentBar: bar,
          currentBeat: beat,
          currentSixteenth: sixteenth,
        }));
      }
    );

    // Initialize Web MIDI
    webMidiService.init((event) => {
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) {
        handleTriggerPad(event.padIndex, event.velocity);
      } else if (event.type === 'cc' && event.controller !== undefined && event.value !== undefined) {
        // Map CC 1 to FX Param
        if (event.controller === 1) {
          const val = (event.value - 0.5) * 2; // -1 to 1
          handleFXChange({ param: val });
        } else if (event.controller === 7) {
          // Master Volume
          handleMasterVolumeChange(event.value);
        }
      }
      setMidiDevices([...webMidiService.connectedDeviceNames]);
    });

    return () => {
      sequencerClock.stopAndCue();
    };
  }, []);

  // Update bank in audio engine
  useEffect(() => {
    audioEngine.currentBank = currentBank;
  }, [currentBank]);

  // Synchronize pitch fader with audio engine and clock
  useEffect(() => {
    const pitchFactor = 1 + transport.pitchBend / 100;
    const effectiveBpm = transport.bpm * pitchFactor;
    sequencerClock.setBpm(effectiveBpm);

    if (transport.masterTempo) {
      // Key lock on: pitch stays constant
      audioEngine.pitchShiftMultiplier = 1.0;
    } else {
      // Classic vinyl / CDJ pitch shift: pitch follows speed
      audioEngine.pitchShiftMultiplier = pitchFactor;
    }
  }, [transport.bpm, transport.pitchBend, transport.masterTempo]);

  // Synchronize swing
  useEffect(() => {
    sequencerClock.setSwing(swing);
  }, [swing]);

  // ----------------------------------------------------
  // PAD TRIGGERING & RECORDING
  // ----------------------------------------------------
  const handleTriggerPad = useCallback((padIndex: number, velocity: number = 1.0) => {
    // Unlock Web Audio Context
    audioEngine.getContext();

    // Trigger sound
    audioEngine.triggerPad(padIndex, velocity);

    // Visual strike feedback
    const padDef = BANKS[currentBank].pads[padIndex];
    if (padDef) {
      setActivePadName(padDef.name);
    }
    setActivePadIndices((prev) => new Set(prev).add(padIndex));
    setTimeout(() => {
      setActivePadIndices((prev) => {
        const next = new Set(prev);
        next.delete(padIndex);
        return next;
      });
    }, 120);

    // Overdub / Live Recording into Sequencer
    if (isRecordingRef.current) {
      const step = currentStepRef.current;
      setPattern((prev) => {
        const next = prev.map((row) => [...row]);
        if (!next[padIndex]) next[padIndex] = Array(16).fill(false);
        next[padIndex][step] = true;
        return next;
      });
    }
  }, [currentBank]);

  // ----------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
        return;
      }

      // Bank switching: Shift + 1/2/3/4 or Shift + A/B/C/D
      if (e.shiftKey) {
        if (key === 'a' || key === '!') { handleSelectBank('A'); return; }
        if (key === 'b' || key === '@') { handleSelectBank('B'); return; }
        if (key === 'c' || key === '#') { handleSelectBank('C'); return; }
        if (key === 'd' || key === '$') { handleSelectBank('D'); return; }
      }

      // Check pad shortcuts
      const padIdx = KEYBOARD_KEYS.indexOf(key);
      if (padIdx !== -1) {
        e.preventDefault();
        setSelectedPadIndex(padIdx);
        handleTriggerPad(padIdx, 1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerPad, currentBank]);

  // ----------------------------------------------------
  // TRANSPORT HANDLERS
  // ----------------------------------------------------
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
    // Sync to round 128 BPM and reset pitch
    setTransport((prev) => ({
      ...prev,
      pitchBend: 0,
      bpm: 128,
    }));
  };

  const handleToggleQuantize = () => {
    setTransport((prev) => {
      const nextQ: '1/16' | '1/8' | 'OFF' =
        prev.quantize === '1/16' ? '1/8' : prev.quantize === '1/8' ? 'OFF' : '1/16';
      return { ...prev, quantize: nextQ };
    });
  };

  const handleToggleMasterTempo = () => {
    setTransport((prev) => ({ ...prev, masterTempo: !prev.masterTempo }));
  };

  const handleToggleRecord = () => {
    setIsRecording((prev) => !prev);
  };

  const handleBpmChange = (newBpm: number) => {
    setTransport((prev) => ({
      ...prev,
      bpm: Math.max(60, Math.min(200, newBpm)),
    }));
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);

    if (times.length > 4) {
      times.shift();
    }

    if (times.length > 1) {
      let intervalSum = 0;
      for (let i = 1; i < times.length; i++) {
        intervalSum += times[i] - times[i - 1];
      }
      const avgInterval = intervalSum / (times.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        handleBpmChange(calculatedBpm);
      }
    }
  };

  const handlePitchBendNudge = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 0.2 : -0.2;
    setTransport((prev) => ({
      ...prev,
      pitchBend: Math.max(-prev.pitchRange, Math.min(prev.pitchRange, prev.pitchBend + delta)),
    }));
  };

  // ----------------------------------------------------
  // BANK & PRESET HANDLERS
  // ----------------------------------------------------
  const handleSelectBank = (bankId: BankId) => {
    setCurrentBank(bankId);
    audioEngine.currentBank = bankId;

    // Load corresponding preset pattern
    if (PRESET_LIBRARY[bankId]) {
      setPattern(PRESET_LIBRARY[bankId].pattern);
      setTransport((prev) => ({ ...prev, bpm: PRESET_LIBRARY[bankId].bpm }));
    }
  };

  const handleLoadPreset = (presetKey: string) => {
    if (PRESET_LIBRARY[presetKey]) {
      setPattern(PRESET_LIBRARY[presetKey].pattern);
      setTransport((prev) => ({ ...prev, bpm: PRESET_LIBRARY[presetKey].bpm }));
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

  const handleClearPattern = () => {
    setPattern(createEmptyPattern());
  };

  const handleRandomizePattern = () => {
    const p = createEmptyPattern();
    // Kick (pad 0)
    [0, 4, 8, 12, 10].forEach((s) => {
      if (Math.random() > 0.3) p[0][s] = true;
    });
    // Snare / Clap (pad 2, 3)
    [4, 12].forEach((s) => {
      p[3][s] = true;
    });
    // Hats (pad 5)
    for (let s = 0; s < 16; s++) {
      if (Math.random() > 0.4) p[5][s] = true;
    }
    // Percussion / Stabs (pad 1, 8, 13)
    [2, 6, 7, 14].forEach((s) => {
      if (Math.random() > 0.5) p[1][s] = true;
      if (Math.random() > 0.6) p[8][s] = true;
      if (Math.random() > 0.7) p[13][s] = true;
    });
    setPattern(p);
  };

  // ----------------------------------------------------
  // FX & EQ HANDLERS
  // ----------------------------------------------------
  const handleFXChange = (fxUpdate: Partial<FXState>) => {
    setFxState((prev) => {
      const updated = { ...prev, ...fxUpdate };
      audioEngine.setFX(updated);
      return updated;
    });
  };

  const handleEQChange = (eqUpdate: Partial<EQState>) => {
    setEqState((prev) => {
      const updated = { ...prev, ...eqUpdate };
      audioEngine.setEQ(updated);
      return updated;
    });
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    audioEngine.setMasterVolume(vol);
  };

  const currentBankConfig = BANKS[currentBank];

  return (
    <div
      id="soundmix-drumpad-app"
      className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black antialiased"
    >
      {/* Top iOS Hardware Bar */}
      <header
        id="app-top-header"
        className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between border-b border-neutral-850"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black text-black text-sm">
            🎛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono">
                SOUNDMIX DRUMPAD
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                PIONEER EDITION
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
              Standalone Web Audio DSP Engine • 64 Synthesized Instruments • Zero-Latency Matrix
            </p>
          </div>
        </div>

        {/* Status Indicators (MIDI & Web Audio) */}
        <div className="flex items-center gap-2">
          {midiDevices.length > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              MIDI: {midiDevices[0]}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              MIDI AUTO-DETECT
            </div>
          )}

          <button
            id="btn-quick-audio-unlock"
            type="button"
            onClick={() => audioEngine.getContext()}
            className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-[11px] font-mono text-neutral-300 border border-neutral-750 transition-colors"
          >
            AUDIO: 44.1kHz
          </button>
        </div>
      </header>

      {/* Main DJ Console Workspace */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 flex-1 flex flex-col gap-3">
        {/* Section 1: Pioneer OLED Status Display */}
        <OLEDDisplay
          transport={transport}
          bankName={currentBankConfig.name}
          bankSubtitle={currentBankConfig.subtitle}
          bankColor={currentBankConfig.color}
          vuData={vuData}
          onTapTempo={handleTapTempo}
          onBpmChange={handleBpmChange}
          activePadName={activePadName}
        />

        {/* Section 2: Transport Deck & Precision Tempo/Pitch Slider */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <TransportDeck
              transport={transport}
              isRecording={isRecording}
              onPlayPause={handlePlayPause}
              onCue={handleCue}
              onToggleSync={handleToggleSync}
              onToggleQuantize={handleToggleQuantize}
              onToggleMasterTempo={handleToggleMasterTempo}
              onToggleRecord={handleToggleRecord}
            />
          </div>

          <div className="md:col-span-5">
            <TempoSlider
              pitchBend={transport.pitchBend}
              pitchRange={transport.pitchRange}
              onPitchChange={(pitch) => setTransport((p) => ({ ...p, pitchBend: pitch }))}
              onRangeChange={(range) => setTransport((p) => ({ ...p, pitchRange: range }))}
              onPitchBendNudge={handlePitchBendNudge}
              onResetPitch={() => setTransport((p) => ({ ...p, pitchBend: 0 }))}
            />
          </div>
        </div>

        {/* Section 3: Sound Bank Selector (A, B, C, D) */}
        <BankSelector
          currentBank={currentBank}
          onSelectBank={handleSelectBank}
        />

        {/* Mobile View Switcher / Desktop Tab Bar */}
        <div className="flex items-center justify-between bg-[#12141c] p-1 rounded-xl border border-neutral-800 sm:hidden">
          <button
            id="tab-btn-pads"
            type="button"
            onClick={() => setActiveTab('pads')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              activeTab === 'pads' ? 'bg-amber-400 text-black shadow-xs' : 'text-neutral-400'
            }`}
          >
            4x4 PADS
          </button>
          <button
            id="tab-btn-sequencer"
            type="button"
            onClick={() => setActiveTab('sequencer')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              activeTab === 'sequencer' ? 'bg-amber-400 text-black shadow-xs' : 'text-neutral-400'
            }`}
          >
            SEQUENCER
          </button>
          <button
            id="tab-btn-fx"
            type="button"
            onClick={() => setActiveTab('fx')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              activeTab === 'fx' ? 'bg-amber-400 text-black shadow-xs' : 'text-neutral-400'
            }`}
          >
            FX & EQ
          </button>
        </div>

        {/* Section 4: Performance Pads (4x4 Matrix) */}
        <div className={`flex flex-col gap-3 ${activeTab === 'pads' ? 'block' : 'hidden sm:block'}`}>
          <PerformancePads
            pads={currentBankConfig.pads}
            onTriggerPad={handleTriggerPad}
            activePadIndices={activePadIndices}
            selectedPadIndex={selectedPadIndex}
            onSelectPad={(idx) => setSelectedPadIndex(idx)}
          />
        </div>

        {/* Section 5: 16-Step Sequencer Module */}
        <div className={`flex flex-col gap-3 ${activeTab === 'sequencer' ? 'block' : 'hidden sm:block'}`}>
          <StepSequencer
            pattern={pattern}
            currentStep={currentStep}
            selectedPadIndex={selectedPadIndex}
            pads={currentBankConfig.pads}
            swing={swing}
            onToggleStep={handleToggleStep}
            onSelectPad={(idx) => setSelectedPadIndex(idx)}
            onClearPattern={handleClearPattern}
            onRandomizePattern={handleRandomizePattern}
            onLoadPreset={handleLoadPreset}
            onSwingChange={setSwing}
          />
        </div>

        {/* Section 6: Pioneer Sound Color FX & 3-Band Isolator EQ */}
        <div className={`flex flex-col gap-3 ${activeTab === 'fx' ? 'block' : 'hidden sm:block'}`}>
          <SoundColorFXDeck
            fxState={fxState}
            eqState={eqState}
            masterVolume={masterVolume}
            onFXChange={handleFXChange}
            onEQChange={handleEQChange}
            onMasterVolumeChange={handleMasterVolumeChange}
          />
        </div>
      </main>

      {/* iOS Footer / Quick Reference */}
      <footer
        id="app-bottom-footer"
        className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2.5 text-center text-[11px] font-mono text-neutral-500 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <span>KEYBOARD: [1-4 / Q-R / A-F / Z-V]</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">[SPACE] PLAY/PAUSE</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">[SHIFT+A/B/C/D] BANK SELECT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-bold">PIONEER MIXSOUND DSP</span>
          <span>•</span>
          <span>100% STANDALONE AUDIO</span>
        </div>
      </footer>
    </div>
  );
};
