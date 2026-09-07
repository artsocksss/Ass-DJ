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

  return (
    <div className="flex p-1 bg-white rounded-2xl w-full border-2 border-[#111113] shadow-[0_2px_0_#111113]">
      {bankIds.map((bId) => {
        const isActive = currentBank === bId;
        const bankInfo = t.banks[bId];

        return (
          <button
            key={bId}
            onClick={() => onSelectBank(bId)}
            className={`flex-1 py-2 px-1 text-[11px] sm:text-xs font-bold font-space rounded-xl transition-all select-none truncate ${
              isActive
                ? 'bg-[#111113] text-[#F8F7F4] shadow-sm font-bold scale-[1.01]'
                : 'text-[#111113]/70 hover:text-[#111113] hover:bg-[#FAF9F5] active:scale-95'
            }`}
          >
            {bankInfo.short}
          </button>
        );
      })}
    </div>
  );
};
