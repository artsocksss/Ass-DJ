import React from 'react';
import { BankId, Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface BankSelectorProps {
  currentBank: BankId;
  lang: Language;
  theme?: ThemeId;
  onSelectBank: (bankId: BankId) => void;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  currentBank,
  lang,
  theme = 'onyx',
  onSelectBank,
}) => {
  const bankIds: BankId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  return (
    <div 
      className="flex items-center gap-1.5 p-1 rounded-2xl w-full border overflow-x-auto no-scrollbar transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
      }}
    >
      {bankIds.map((bId) => {
        const isActive = currentBank === bId;
        const bankInfo = t.banks[bId];

        return (
          <button
            key={bId}
            onClick={() => onSelectBank(bId)}
            className="flex-shrink-0 flex items-center gap-1.5 py-1.5 px-2.5 text-[11px] sm:text-xs font-semibold font-space rounded-xl transition-all select-none border whitespace-nowrap"
            style={{
              backgroundColor: isActive ? themeConfig.accent : 'rgba(255, 255, 255, 0.03)',
              borderColor: isActive ? themeConfig.accent : themeConfig.borderSubtle,
              color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.75)',
              boxShadow: isActive ? `0 0 14px ${themeConfig.accentGlow}` : 'none',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
            }}
            title={bankInfo?.desc || bankInfo?.full}
          >
            <span
              className="text-[9px] font-mono px-1 py-0.5 rounded font-black leading-none"
              style={{
                backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: isActive ? '#000' : themeConfig.accent,
              }}
            >
              {bId}
            </span>
            <span className="font-bold tracking-tight">{bankInfo?.short || bId}</span>
          </button>
        );
      })}
    </div>
  );
};
