import React from 'react';
import { BankId } from '../types';
import { BANKS } from '../audio/soundPresets';

interface BankSelectorProps {
  currentBank: BankId;
  onSelectBank: (bankId: BankId) => void;
}

export const BankSelector: React.FC<BankSelectorProps> = ({ currentBank, onSelectBank }) => {
  const bankIds: BankId[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex p-1 bg-[#1C1C1E] rounded-xl w-full">
      {bankIds.map((bId) => {
        const bank = BANKS[bId];
        const isActive = currentBank === bId;

        return (
          <button
            key={bId}
            onClick={() => onSelectBank(bId)}
            className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-all ${
              isActive ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {bank.name.split(' ')[0]}
          </button>
        );
      })}
    </div>
  );
};
