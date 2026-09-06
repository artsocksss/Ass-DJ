import React from 'react';
import { BankId } from '../types';
import { BANKS } from '../audio/soundPresets';

interface BankSelectorProps {
  currentBank: BankId;
  onSelectBank: (bankId: BankId) => void;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  currentBank,
  onSelectBank,
}) => {
  const bankIds: BankId[] = ['A', 'B', 'C', 'D'];

  return (
    <div
      id="bank-selector-panel"
      className="flex items-center justify-between gap-1.5 p-1.5 bg-[#101218] border border-neutral-800 rounded-2xl"
    >
      {bankIds.map((bId) => {
        const bank = BANKS[bId];
        const isActive = currentBank === bId;

        return (
          <button
            key={bId}
            id={`btn-bank-${bId}`}
            type="button"
            onClick={() => onSelectBank(bId)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-75 cursor-pointer select-none ${
              isActive
                ? 'shadow-[0_2px_12px_rgba(0,0,0,0.6)]'
                : 'bg-transparent hover:bg-neutral-850/60 text-neutral-400'
            }`}
            style={{
              backgroundColor: isActive ? `${bank.color}22` : undefined,
              border: isActive ? `1.5px solid ${bank.color}` : '1.5px solid transparent',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: bank.color }}
              />
              <span
                className={`text-xs sm:text-sm font-black font-mono tracking-wider ${
                  isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-neutral-400'
                }`}
              >
                BANK {bId}
              </span>
            </div>

            <span
              className={`text-[9px] font-mono tracking-tight truncate max-w-full mt-0.5 ${
                isActive ? 'text-neutral-300 font-bold' : 'text-neutral-500'
              }`}
            >
              {bank.name.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
