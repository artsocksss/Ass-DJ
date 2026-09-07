import React, { useState } from 'react';
import { BankCard as BankCardType } from '../types/bank';
import { formatMoney, formatCardNumber } from '../utils/formatters';
import { Eye, EyeOff, Shield, Copy, Check, Lock, Smartphone, FileText } from 'lucide-react';

interface BankCardProps {
  cards: BankCardType[];
  activeCardIndex: number;
  onSelectCard: (index: number) => void;
  onOpenSettings: (card: BankCardType) => void;
  onOpenIBAN: (card: BankCardType) => void;
}

export const BankCard: React.FC<BankCardProps> = ({
  cards,
  activeCardIndex,
  onSelectCard,
  onOpenSettings,
  onOpenIBAN,
}) => {
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const card = cards[activeCardIndex] || cards[0];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="w-full flex flex-col items-center px-4 pt-2">
      {/* Cards Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-full border border-neutral-800 mb-3 select-none">
        {cards.map((c, idx) => {
          const isActive = idx === activeCardIndex;
          return (
            <button
              key={c.id}
              onClick={() => {
                onSelectCard(idx);
                setIsFlipped(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-black shadow-sm scale-102'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{c.name}</span>
              {c.currency === 'USD' ? (
                <span className="text-[10px] opacity-70">$</span>
              ) : (
                <span className="text-[10px] opacity-70">₴</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Card Element (3D Flip Effect) */}
      <div className="w-full max-w-[340px] h-[205px] perspective-1000 relative">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-full rounded-2xl p-5 cursor-pointer relative shadow-2xl transition-all duration-500 transform-style-3d border border-white/10 ${
            isFlipped ? 'rotate-y-180' : ''
          } ${
            card.type === 'white'
              ? 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-neutral-900'
              : card.type === 'usd'
              ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-neutral-950 text-white'
              : 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white'
          }`}
        >
          {/* FRONT OF CARD */}
          {!isFlipped ? (
            <div className="flex flex-col justify-between h-full">
              {/* Top Row: Bank name & Contactless icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      card.type === 'white' ? 'bg-neutral-900 text-white' : 'bg-white text-black'
                    }`}
                  >
                    UA
                  </div>
                  <span className="font-bold text-sm tracking-tight">NeoBank</span>
                </div>

                <div className="flex items-center gap-2">
                  {card.isBlocked && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                      Заблоковано
                    </span>
                  )}
                  <span className="text-xs font-mono opacity-60">NFC</span>
                </div>
              </div>

              {/* Middle Row: Balance display with Privacy Toggle */}
              <div className="my-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium opacity-70">Поточний баланс</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHideBalance(!hideBalance);
                    }}
                    className="opacity-70 hover:opacity-100 transition p-0.5"
                  >
                    {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-2xl font-black tracking-tight mt-0.5">
                  {hideBalance ? '••••••••' : formatMoney(card.balance, card.currency)}
                </div>

                {card.creditLimit > 0 && (
                  <div className="text-[10px] opacity-70 mt-0.5">
                    Кредитний ліміт: {formatMoney(card.creditLimit, card.currency)}
                  </div>
                )}
              </div>

              {/* Bottom Row: Card Number & Payment System */}
              <div className="flex items-end justify-between pt-1">
                <div>
                  <div className="font-mono text-xs tracking-wider font-semibold">
                    {formatCardNumber(card.cardNumber, true)}
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5">Термін дії: {card.expiry}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Mastercard overlapping circles or Visa label */}
                  {card.paymentSystem === 'mastercard' ? (
                    <div className="flex items-center -space-x-2">
                      <div className="w-5 h-5 rounded-full bg-rose-500/90" />
                      <div className="w-5 h-5 rounded-full bg-amber-500/90" />
                    </div>
                  ) : (
                    <span className="font-black italic text-xs tracking-wider">VISA</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* BACK OF CARD */
            <div className="flex flex-col justify-between h-full rotate-y-180">
              <div className="w-full h-8 bg-neutral-900 rounded-sm -mx-5 px-5 my-1" />

              <div className="flex items-center justify-between text-xs my-auto">
                <div className="bg-white text-black font-mono px-3 py-1.5 rounded-sm font-bold tracking-widest text-center shadow-inner">
                  CVV {card.cvv}
                </div>
                <div className="text-[10px] opacity-70 text-right">
                  Не повідомляйте CVV-код стороннім особам
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] opacity-70">
                <span>ПАТ «НеоБанк» • Ліцензія НБУ №241</span>
                <span>Підтримка 24/7</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Quick Actions: Copy Number, IBAN, Security Settings */}
      <div className="flex items-center gap-2 mt-3 w-full max-w-[340px]">
        <button
          onClick={() => handleCopy(card.cardNumber, 'number')}
          className="flex-1 py-2 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium transition flex items-center justify-center gap-1.5 active:scale-98"
        >
          {copiedField === 'number' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copiedField === 'number' ? 'Скопійовано' : 'Номер'}</span>
        </button>

        <button
          onClick={() => onOpenIBAN(card)}
          className="flex-1 py-2 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium transition flex items-center justify-center gap-1.5 active:scale-98"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>IBAN</span>
        </button>

        <button
          onClick={() => onOpenSettings(card)}
          className="flex-1 py-2 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium transition flex items-center justify-center gap-1.5 active:scale-98"
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Налаштування</span>
        </button>
      </div>
    </div>
  );
};
