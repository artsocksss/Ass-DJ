import React from 'react';
import { MidiMappableParam, MidiMappings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface MidiMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: MidiMappings;
  learningParam: MidiMappableParam | null;
  lang: Language;
  onStartLearning: (param: MidiMappableParam) => void;
  onClearMapping: (param: MidiMappableParam) => void;
}

export const MidiMappingModal: React.FC<MidiMappingModalProps> = ({
  isOpen,
  onClose,
  mappings,
  learningParam,
  lang,
  onStartLearning,
  onClearMapping,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const params: { key: MidiMappableParam; label: string }[] = [
    { key: 'master_volume', label: t.params.master_volume },
    { key: 'fx_param', label: t.params.fx_param },
    { key: 'eq_high', label: t.params.eq_high },
    { key: 'eq_mid', label: t.params.eq_mid },
    { key: 'eq_low', label: t.params.eq_low },
    { key: 'pitch_bend', label: t.params.pitch_bend },
  ];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Slide up from bottom */}
      <div className="relative bg-[#F8F7F4] rounded-t-[32px] border-t-2 border-[#111113] shadow-2xl flex flex-col w-full max-h-[85%] pb-6 z-10 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b-2 border-[#111113]/10">
          <div>
            <h2 className="text-lg font-bold font-space tracking-tight text-[#111113]">{t.midiModalTitle}</h2>
            <span className="text-[10px] text-[#111113]/60 font-space font-semibold uppercase tracking-wider">Pioneer MIDI Controller</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold active:scale-95 transition-transform text-[#111113] border-2 border-[#111113] shadow-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
          <p className="text-xs font-medium text-[#111113]/70 leading-relaxed px-1">
            {t.midiModalSubtitle}
          </p>

          {params.map(({ key, label }) => {
            const mappedCC = mappings[key];
            const isLearning = learningParam === key;

            return (
              <div
                key={key}
                className="flex justify-between items-center bg-white px-3.5 py-3 rounded-xl border-2 border-[#111113] shadow-[0_1px_0_#111113]"
              >
                <span className="text-xs sm:text-sm font-bold text-[#111113] font-space tracking-tight truncate max-w-[190px]">
                  {label}
                </span>

                <div className="flex items-center gap-2">
                  {mappedCC !== null && !isLearning && (
                    <button
                      onClick={() => onClearMapping(key)}
                      className="text-xs font-bold font-space text-[#E94E38] active:opacity-70 px-2 py-1"
                    >
                      {t.clear}
                    </button>
                  )}

                  <button
                    onClick={() => onStartLearning(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-space transition-all border-2 border-[#111113] ${
                      isLearning
                        ? 'bg-[#E94E38] text-white animate-pulse shadow-sm'
                        : mappedCC !== null
                        ? 'bg-[#111113] text-white font-space'
                        : 'bg-[#F8F7F4] text-[#111113] hover:bg-white'
                    }`}
                  >
                    {isLearning ? t.listening : mappedCC !== null ? `CC ${mappedCC}` : t.learn}
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
