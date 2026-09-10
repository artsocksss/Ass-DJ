import React from 'react';
import { BankId, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface BankSelectorProps {
  currentBank: BankId;
  lang: Language;
  onSelectBank: (bankId: BankId) => void;
}

export const BankSelector: React.FC<BankSelectorProps> = ({ currentBank, lang, onSelectBank }) => {
  const bankIds: BankId[] = ['A', 'B', 'C', 'D'];
  const t = TRANSLATIONS[lang];

  const bankColors: Record<BankId, { active: string; border: string; glow: string }> = {
    A: { active: 'bg-[#FF007F] text-white', border: 'border-[#FF007F]', glow: 'shadow-[0_0_12px_rgba(255,0,127,0.5)]' },
    B: { active: 'bg-[#00F0FF] text-black', border: 'border-[#00F0FF]', glow: 'shadow-[0_0_12px_rgba(0,240,255,0.5)]' },
    C: { active: 'bg-[#C77DFF] text-black', border: 'border-[#C77DFF]', glow: 'shadow-[0_0_12px_rgba(199,125,255,0.5)]' },
    D: { active: 'bg-[#00FF66] text-black', border: 'border-[#00FF66]', glow: 'shadow-[0_0_12px_rgba(0,255,102,0.5)]' },
  };

  return (
    <div className="flex p-1 bg-[#0A0A0F] rounded-2xl w-full border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
      {bankIds.map((bId) => {
        const isActive = currentBank === bId;
        const bankInfo = t.banks[bId];
        const colors = bankColors[bId];

        return (
          <button
            key={bId}
            onClick={() => onSelectBank(bId)}
            className={`flex-1 py-2 px-1 text-[11px] sm:text-xs font-bold font-space rounded-xl transition-all select-none truncate border ${
              isActive
                ? `${colors.active} ${colors.border} ${colors.glow} font-bold scale-[1.02]`
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5 active:scale-95'
            }`}
          >
            {bankInfo.short}
          </button>
        );
      })}
    </div>
  );
};
