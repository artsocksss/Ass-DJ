import React, { useState, useEffect } from 'react';
import { TransportState, VUMeterData, Language, CustomSavedPattern } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface OLEDDisplayProps {
  transport: TransportState;
  bankName: string;
  vuData: VUMeterData;
  lang: Language;
  hasCustomEdits?: boolean;
  patternName: string;
  onPatternNameChange: (name: string) => void;
  onSavePattern: (customName?: string) => void;
  savedPatterns?: CustomSavedPattern[];
  onLoadSavedPattern?: (id: string) => void;
  onDeleteSavedPattern?: (id: string) => void;
  onTapTempo: () => void;
  onBpmChange: (bpm: number) => void;
}

export const OLEDDisplay: React.FC<OLEDDisplayProps> = ({
  transport,
  bankName,
  onTapTempo,
  onBpmChange,
  vuData,
  lang,
  hasCustomEdits = false,
  patternName,
  onPatternNameChange,
  onSavePattern,
  savedPatterns = [],
  onLoadSavedPattern,
  onDeleteSavedPattern,
}) => {
  const t = TRANSLATIONS[lang];
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);

  const handleSave = () => {
    onSavePattern(patternName);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      handleSave();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 w-full border-2 border-[#111113] shadow-[0_2px_0_#111113]">
      {/* Top Row: BPM, Key & Bank Status */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[#111113]/60 text-[10px] font-bold font-space uppercase tracking-widest">{t.tempo}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-space bg-[#111113]/5 text-[#111113] rounded-full border border-[#111113]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E94E38]"></span>
              {hasCustomEdits ? t.customPattern : t.presetPattern}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111113] font-space">
              {transport.bpm.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-[#111113]/60 font-space uppercase tracking-wider">
              {t.bpm}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[#111113]/60 text-[10px] font-bold font-space uppercase tracking-widest mb-0.5">
            {t.key}
          </span>
          <span className="text-base sm:text-lg font-bold text-[#111113] font-space px-2.5 py-0.5 bg-[#F8F7F4] rounded-lg border-2 border-[#111113]">
            {transport.key}
          </span>
        </div>
      </div>

      {/* Pattern Name Input & Local Save Bar */}
      <div className="flex flex-col gap-1.5 bg-[#F8F7F4] p-2.5 rounded-xl border-2 border-[#111113]">
        <div className="flex items-center justify-between">
          <label htmlFor="pattern-name-input" className="text-[10px] font-bold font-space text-[#111113]/70 uppercase tracking-wider flex items-center gap-1">
            <span>🎛</span> {t.patternNameLabel}
          </label>
          {savedPatterns.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSavedList(!showSavedList)}
              className="text-[10px] font-bold font-space text-[#111113] hover:text-[#E94E38] underline underline-offset-2 flex items-center gap-0.5"
            >
              <span>{t.savedPatternsList}</span>
              <span className="bg-[#111113] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {savedPatterns.length}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="pattern-name-input"
              type="text"
              value={patternName}
              onChange={(e) => onPatternNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.patternNamePlaceholder}
              maxLength={36}
              className="w-full bg-white border-2 border-[#111113] text-[#111113] text-xs font-bold font-space rounded-lg px-2.5 py-1.5 placeholder:text-[#111113]/40 focus:outline-none focus:border-[#E94E38] focus:ring-1 focus:ring-[#E94E38] shadow-[0_1px_0_#111113]"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            title={t.savePatternTooltip}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-space border-2 border-[#111113] transition-all flex items-center gap-1 active:scale-95 shadow-[0_1px_0_#111113] whitespace-nowrap ${
              isSavedFeedback
                ? 'bg-[#E94E38] text-white'
                : 'bg-[#111113] text-white hover:bg-[#2C2C2E]'
            }`}
          >
            <span>{isSavedFeedback ? '✓' : '💾'}</span>
            <span>{isSavedFeedback ? t.savedStatus : t.savePattern}</span>
          </button>
        </div>

        {/* Expandable Quick Presets List */}
        {showSavedList && savedPatterns.length > 0 && (
          <div className="mt-1.5 pt-2 border-t border-[#111113]/20 flex flex-col gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
            {savedPatterns.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-[#111113]/30 text-xs font-space"
              >
                <button
                  type="button"
                  onClick={() => {
                    onLoadSavedPattern?.(item.id);
                    setShowSavedList(false);
                  }}
                  className="flex items-center gap-1.5 font-bold text-[#111113] hover:text-[#E94E38] text-left truncate flex-1"
                >
                  <span className="text-[10px] px-1 py-0.2 bg-[#111113] text-white rounded font-bold">
                    {item.bank}
                  </span>
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] text-[#111113]/50 font-normal">
                    ({item.bpm} BPM)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSavedPattern?.(item.id)}
                  className="text-red-500 hover:text-red-700 text-[10px] font-bold px-1.5 py-0.5 ml-1"
                  title={t.deletePattern}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Middle Row: BPM Step Controls, Tap Tempo & Bar Counter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#F8F7F4] rounded-full p-1 border-2 border-[#111113]">
          <button
            onClick={() => onBpmChange(transport.bpm - 1)}
            className="w-7 h-7 rounded-full bg-white border border-[#111113] flex items-center justify-center text-sm font-bold active:scale-95 transition-transform text-[#111113] shadow-sm hover:bg-[#E94E38] hover:text-white"
            aria-label="Decrease BPM"
          >
            -
          </button>
          <button
            onClick={onTapTempo}
            className="px-3 py-1 text-[11px] font-bold font-space text-[#111113] active:scale-95 transition-all tracking-wider uppercase hover:bg-[#111113] hover:text-white rounded-full"
          >
            {t.tap}
          </button>
          <button
            onClick={() => onBpmChange(transport.bpm + 1)}
            className="w-7 h-7 rounded-full bg-white border border-[#111113] flex items-center justify-center text-sm font-bold active:scale-95 transition-transform text-[#111113] shadow-sm hover:bg-[#E94E38] hover:text-white"
            aria-label="Increase BPM"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1 font-space tracking-tight bg-[#F8F7F4] px-3 py-1.5 rounded-full border-2 border-[#111113]">
            <span className="text-[#111113]/60 text-[10px] uppercase font-bold mr-0.5">{t.bar}</span>
            <span className="text-sm font-bold text-[#111113]">{String(transport.currentBar).padStart(2, '0')}</span>
            <span className="text-[#111113]/40">:</span>
            <span className="text-sm font-bold text-[#E94E38]">{transport.currentBeat}</span>
          </div>
        </div>
      </div>

      {/* Dual VU Meters */}
      <div className="flex flex-col gap-1 w-full pt-1">
        <div className="h-1.5 bg-[#E2DFDA] rounded-full overflow-hidden flex items-center border border-[#111113]/20">
          <div
            className="h-full bg-[#111113] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, vuData.left * 100))}%` }}
          />
        </div>
        <div className="h-1.5 bg-[#E2DFDA] rounded-full overflow-hidden flex items-center border border-[#111113]/20">
          <div
            className="h-full bg-[#E94E38] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, vuData.right * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
