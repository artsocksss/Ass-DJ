import React from 'react';
import { MidiMappableParam, MidiMappings } from '../types';

interface MidiMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: MidiMappings;
  learningParam: MidiMappableParam | null;
  onStartLearning: (param: MidiMappableParam) => void;
  onClearMapping: (param: MidiMappableParam) => void;
}

export const MidiMappingModal: React.FC<MidiMappingModalProps> = ({
  isOpen, onClose, mappings, learningParam, onStartLearning, onClearMapping
}) => {
  if (!isOpen) return null;

  const params: { key: MidiMappableParam; label: string }[] = [
    { key: 'master_volume', label: 'Master Volume' },
    { key: 'fx_param', label: 'FX Parameter' },
    { key: 'eq_high', label: 'EQ High' },
    { key: 'eq_mid', label: 'EQ Mid' },
    { key: 'eq_low', label: 'EQ Low' },
    { key: 'pitch_bend', label: 'Pitch Bend' }
  ];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content - Slide up from bottom */}
      <div className="relative bg-[#1C1C1E] rounded-t-3xl shadow-2xl flex flex-col w-full max-h-[85%] animate-in slide-in-from-bottom duration-300 pb-safe">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tight text-white">MIDI Mappings</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-sm font-semibold active:scale-95 transition-transform text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-neutral-400 pb-2">
            Tap a parameter to learn, then twist a knob or slider on your MIDI controller.
          </p>

          {params.map(({ key, label }) => {
            const mappedCC = mappings[key];
            const isLearning = learningParam === key;

            return (
              <div key={key} className="flex justify-between items-center bg-[#2C2C2E] p-4 rounded-2xl">
                <span className="text-sm font-semibold text-white tracking-wide">
                  {label}
                </span>
                
                <div className="flex items-center gap-2">
                  {mappedCC !== null && !isLearning && (
                    <button 
                      onClick={() => onClearMapping(key)}
                      className="text-xs font-semibold text-red-400 active:opacity-70 px-2"
                    >
                      Clear
                    </button>
                  )}
                  
                  <button
                    onClick={() => onStartLearning(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isLearning 
                        ? 'bg-blue-500 text-white animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.6)]' 
                        : mappedCC !== null 
                          ? 'bg-white text-black' 
                          : 'bg-[#3A3A3C] text-neutral-300'
                    }`}
                  >
                    {isLearning ? 'Listening...' : mappedCC !== null ? `CC ${mappedCC}` : 'Learn'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
