import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BankId, EQState, FXState, TransportState, VUMeterData, MidiMappableParam, MidiMappings } from './types';
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
import { MidiMappingModal } from './components/MidiMappingModal';

// SVG Icons for iOS Tab Bar
const IconPads = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>;
const IconSeq = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>;
const IconFX = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>;

export const App: React.FC = () => {
  const [currentBank, setCurrentBank] = useState<BankId>('A');
  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(0);
  const [activePadIndices, setActivePadIndices] = useState<Set<number>>(new Set());

  const [transport, setTransport] = useState<TransportState>({
    playbackState: 'stopped', bpm: 128, pitchRange: 10, pitchBend: 0,
    masterTempo: true, quantize: '1/16', currentBar: 1, currentBeat: 1,
    currentSixteenth: 1, key: '8A'
  });

  const [pattern, setPattern] = useState<boolean[][]>(() => PRESET_LIBRARY.A.pattern);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [fxState, setFxState] = useState<FXState>({ activeFX: 'FILTER', param: 0, resonance: 3.5, echoTime: 0.25, echoFeedback: 0.45 });
  const [eqState, setEqState] = useState<EQState>({ low: 0, mid: 0, high: 0, killLow: false, killMid: false, killHigh: false });
  const [masterVolume, setMasterVolume] = useState<number>(0.9);
  const [vuData, setVuData] = useState<VUMeterData>({ left: 0, right: 0, peakLeft: 0, peakRight: 0 });
  const [activeTab, setActiveTab] = useState<'pads' | 'sequencer' | 'fx'>('pads');

  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [midiMappings, setMidiMappings] = useState<MidiMappings>({
    master_volume: 7, fx_param: 1, eq_high: null, eq_mid: null, eq_low: null, pitch_bend: null
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
          setMidiMappings(prev => ({ ...prev, [lp]: event.controller! }));
          setLearningParam(null);
        } else {
          const m = midiMappingsRef.current;
          if (event.controller === m.master_volume) {
            const vol = event.value;
            setMasterVolume(vol); audioEngine.setMasterVolume(vol);
          } else if (event.controller === m.fx_param) {
            const param = (event.value - 0.5) * 2;
            setFxState(prev => { const next = { ...prev, param }; audioEngine.setFX(next); return next; });
          } else if (event.controller === m.eq_high) {
            const high = (event.value * 30) - 24;
            setEqState(prev => { const next = { ...prev, high }; audioEngine.setEQ(next); return next; });
          } else if (event.controller === m.eq_mid) {
            const mid = (event.value * 30) - 24;
            setEqState(prev => { const next = { ...prev, mid }; audioEngine.setEQ(next); return next; });
          } else if (event.controller === m.eq_low) {
            const low = (event.value * 30) - 24;
            setEqState(prev => { const next = { ...prev, low }; audioEngine.setEQ(next); return next; });
          } else if (event.controller === m.pitch_bend) {
            setTransport(prev => ({ ...prev, pitchBend: (event.value! - 0.5) * 2 * prev.pitchRange }));
          }
        }
      }
    });

    return () => sequencerClock.stopAndCue();
  }, []);

  useEffect(() => { audioEngine.currentBank = currentBank; }, [currentBank]);

  useEffect(() => {
    const pitchFactor = 1 + transport.pitchBend / 100;
    sequencerClock.setBpm(transport.bpm * pitchFactor);
    audioEngine.pitchShiftMultiplier = transport.masterTempo ? 1.0 : pitchFactor;
  }, [transport.bpm, transport.pitchBend, transport.masterTempo]);

  const handleTriggerPad = useCallback((padIndex: number, velocity: number = 1.0) => {
    audioEngine.getContext();
    audioEngine.triggerPad(padIndex, velocity);
    setActivePadIndices((prev) => new Set(prev).add(padIndex));
    setTimeout(() => setActivePadIndices((prev) => { const next = new Set(prev); next.delete(padIndex); return next; }), 120);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (e.code === 'Space') { e.preventDefault(); handlePlayPause(); return; }
      if (e.shiftKey) {
        if (key === 'a' || key === '!') { handleSelectBank('A'); return; }
        if (key === 'b' || key === '@') { handleSelectBank('B'); return; }
        if (key === 'c' || key === '#') { handleSelectBank('C'); return; }
        if (key === 'd' || key === '$') { handleSelectBank('D'); return; }
      }
      const padIdx = KEYBOARD_KEYS.indexOf(key);
      if (padIdx !== -1) { e.preventDefault(); setSelectedPadIndex(padIdx); handleTriggerPad(padIdx, 1.0); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerPad, currentBank]);

  const handlePlayPause = () => {
    audioEngine.getContext();
    if (transport.playbackState === 'playing') { sequencerClock.pause(); setTransport((prev) => ({ ...prev, playbackState: 'paused' })); }
    else { sequencerClock.start(); setTransport((prev) => ({ ...prev, playbackState: 'playing' })); }
  };

  const handleCue = () => {
    audioEngine.getContext();
    sequencerClock.stopAndCue();
    setTransport((prev) => ({ ...prev, playbackState: 'stopped', currentBar: 1, currentBeat: 1, currentSixteenth: 1 }));
    setCurrentStep(0);
  };

  const handleToggleSync = () => setTransport((prev) => ({ ...prev, pitchBend: 0, bpm: 128 }));
  const handleToggleQuantize = () => setTransport((prev) => ({ ...prev, quantize: prev.quantize === '1/16' ? 'OFF' : '1/16' }));
  const handleToggleRecord = () => setIsRecording((prev) => !prev);
  const handleBpmChange = (newBpm: number) => setTransport((prev) => ({ ...prev, bpm: Math.max(60, Math.min(200, newBpm)) }));

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);
    if (times.length > 4) times.shift();
    if (times.length > 1) {
      let intervalSum = 0;
      for (let i = 1; i < times.length; i++) intervalSum += times[i] - times[i - 1];
      const calculatedBpm = Math.round(60000 / (intervalSum / (times.length - 1)));
      if (calculatedBpm >= 60 && calculatedBpm <= 200) handleBpmChange(calculatedBpm);
    }
  };

  const handleSelectBank = (bankId: BankId) => {
    setCurrentBank(bankId);
    audioEngine.currentBank = bankId;
    if (PRESET_LIBRARY[bankId]) {
      setPattern(PRESET_LIBRARY[bankId].pattern);
      setTransport((prev) => ({ ...prev, bpm: PRESET_LIBRARY[bankId].bpm }));
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
  const handleFXChange = (fxUpdate: Partial<FXState>) => setFxState((prev) => { const updated = { ...prev, ...fxUpdate }; audioEngine.setFX(updated); return updated; });
  const handleEQChange = (eqUpdate: Partial<EQState>) => setEqState((prev) => { const updated = { ...prev, ...eqUpdate }; audioEngine.setEQ(updated); return updated; });
  const handleMasterVolumeChange = (vol: number) => { setMasterVolume(vol); audioEngine.setMasterVolume(vol); };

  const currentBankConfig = BANKS[currentBank];

  return (
    <div className="h-[100dvh] w-full bg-[#000] text-white flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md bg-black h-full flex flex-col relative shadow-2xl overflow-hidden">
        {/* Minimal Header */}
        <div className="flex-shrink-0 pt-12 pb-4 px-6 flex items-center justify-between z-10 bg-black">
          <h1 className="text-2xl font-bold tracking-tight">SoundMix</h1>
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5 h-1 w-8 opacity-70">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-75" style={{ width: `${vuData.left * 100}%` }} />
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-75" style={{ width: `${vuData.right * 100}%` }} />
             </div>
             <button onClick={() => audioEngine.getContext()} className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center">
               <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
             </button>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar flex flex-col gap-5">
          {activeTab === 'pads' && (
            <>
              <OLEDDisplay transport={transport} bankName={currentBankConfig.name} vuData={vuData} onTapTempo={handleTapTempo} onBpmChange={handleBpmChange} />
              <BankSelector currentBank={currentBank} onSelectBank={handleSelectBank} />
              <TransportDeck transport={transport} isRecording={isRecording} onPlayPause={handlePlayPause} onCue={handleCue} onToggleSync={handleToggleSync} onToggleQuantize={handleToggleQuantize} onToggleRecord={handleToggleRecord} />
              <PerformancePads pads={currentBankConfig.pads} onTriggerPad={handleTriggerPad} activePadIndices={activePadIndices} />
            </>
          )}
          {activeTab === 'sequencer' && (
            <>
              <OLEDDisplay transport={transport} bankName={currentBankConfig.name} vuData={vuData} onTapTempo={handleTapTempo} onBpmChange={handleBpmChange} />
              <StepSequencer pattern={pattern} currentStep={currentStep} selectedPadIndex={selectedPadIndex} pads={currentBankConfig.pads} onToggleStep={handleToggleStep} onSelectPad={setSelectedPadIndex} onClearPattern={handleClearPattern} />
            </>
          )}
          {activeTab === 'fx' && (
            <>
              <div className="flex justify-between items-center px-1">
                <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Performance Controls</h2>
                <button 
                  onClick={() => setIsMidiModalOpen(true)}
                  className="px-3 py-1.5 bg-[#2C2C2E] rounded-full text-xs font-bold text-white active:scale-95 transition-transform"
                >
                  MIDI Learn
                </button>
              </div>
              <TempoSlider pitchBend={transport.pitchBend} onPitchChange={(p) => setTransport(prev => ({ ...prev, pitchBend: p }))} onResetPitch={() => setTransport(prev => ({ ...prev, pitchBend: 0 }))} />
              <SoundColorFXDeck fxState={fxState} eqState={eqState} masterVolume={masterVolume} onFXChange={handleFXChange} onEQChange={handleEQChange} onMasterVolumeChange={handleMasterVolumeChange} />
            </>
          )}
        </div>

        {/* iOS Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-[#1C1C1E]/80 backdrop-blur-xl border-t border-white/10 flex items-start justify-around px-2 pt-3 z-20 pb-safe">
          <button onClick={() => setActiveTab('pads')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeTab === 'pads' ? 'text-white' : 'text-neutral-500 hover:text-neutral-400'}`}>
             <IconPads />
             <span className="text-[10px] font-medium">Pads</span>
          </button>
          <button onClick={() => setActiveTab('sequencer')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeTab === 'sequencer' ? 'text-white' : 'text-neutral-500 hover:text-neutral-400'}`}>
             <IconSeq />
             <span className="text-[10px] font-medium">Sequencer</span>
          </button>
          <button onClick={() => setActiveTab('fx')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeTab === 'fx' ? 'text-white' : 'text-neutral-500 hover:text-neutral-400'}`}>
             <IconFX />
             <span className="text-[10px] font-medium">FX & EQ</span>
          </button>
        </div>
      </div>
      
      <MidiMappingModal 
        isOpen={isMidiModalOpen} 
        onClose={() => { setIsMidiModalOpen(false); setLearningParam(null); }}
        mappings={midiMappings}
        learningParam={learningParam}
        onStartLearning={setLearningParam}
        onClearMapping={(param) => setMidiMappings(prev => ({ ...prev, [param]: null }))}
      />
    </div>
  );
};
