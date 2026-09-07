import React, { useState } from 'react';
import { BankCard } from '../types/bank';
import { formatMoney, formatUkrainianPhone, detectMobileOperator } from '../utils/formatters';
import { X, Smartphone, CheckCircle2, Zap } from 'lucide-react';

interface MobileTopupModalProps {
  activeCard: BankCard;
  onClose: () => void;
  onSuccess: (amount: number, phone: string, operator: string) => void;
}

export const MobileTopupModal: React.FC<MobileTopupModalProps> = ({
  activeCard,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState<string>('0978192041');
  const [amount, setAmount] = useState<string>('150');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const operatorInfo = detectMobileOperator(phone);

  const presetAmounts = [50, 100, 150, 200, 500];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (numAmount > activeCard.balance) {
      alert('Недостатньо коштів на балансі');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(numAmount, formatUkrainianPhone(phone), operatorInfo.name);
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">Поповнення мобільного</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              0% комісія
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Рахунок поповнено!</h4>
            <p className="text-xs text-neutral-400">
              {formatMoney(parseFloat(amount), 'UAH')} надіслано на {formatUkrainianPhone(phone)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Operator preview */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white"
                  style={{ backgroundColor: operatorInfo.color }}
                >
                  {operatorInfo.logoText}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{operatorInfo.name}</div>
                  <div className="text-[10px] text-neutral-400">Миттєве зарахування</div>
                </div>
              </div>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Phone Input */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                Номер телефону
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="097 000 00 00"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-white focus:outline-hidden focus:border-neutral-700"
                required
              />
            </div>

            {/* Amount presets */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                Оберіть суму (₴)
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {presetAmounts.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setAmount(p.toString())}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      amount === p.toString()
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Інша сума"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-bold text-white focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Оплатити {amount} ₴</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
