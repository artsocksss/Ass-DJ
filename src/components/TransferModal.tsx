import React, { useState } from 'react';
import { BankCard, BankContact } from '../types/bank';
import { RECENT_CONTACTS } from '../data/mockBankData';
import { formatMoney, formatCardNumber, formatIBAN, isValidUkrainianIBAN } from '../utils/formatters';
import { X, CreditCard, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

interface TransferModalProps {
  initialType?: 'card' | 'iban';
  activeCard: BankCard;
  onClose: () => void;
  onSuccessTransfer: (
    amount: number,
    recipient: string,
    details: string,
    category: 'transfer' | 'services'
  ) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  initialType = 'card',
  activeCard,
  onClose,
  onSuccessTransfer,
}) => {
  const [tab, setTab] = useState<'card' | 'iban'>(initialType);
  const [amount, setAmount] = useState<string>('500');
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSelectContact = (contact: BankContact) => {
    setTargetNumber(contact.cardNumber);
    setRecipientName(contact.name);
  };

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
        const title = recipientName || (tab === 'card' ? `Переказ на картку ${targetNumber.slice(-4)}` : `Платіж IBAN ${targetNumber.slice(0, 10)}...`);
        const details = tab === 'card' ? `Картка: ${targetNumber}` : `IBAN: ${targetNumber}, ${purpose || 'Без призначення'}`;
        onSuccessTransfer(numAmount, title, details, 'transfer');
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative animate-in fade-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">Переказ коштів</span>
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
            <h4 className="text-lg font-bold text-white mb-1">Переказ надіслано!</h4>
            <p className="text-xs text-neutral-400">
              {formatMoney(parseFloat(amount), activeCard.currency)} успішно перераховано
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTab('card')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  tab === 'card' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>На картку</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('iban')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  tab === 'iban' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>За IBAN (НБУ)</span>
              </button>
            </div>

            {/* Quick Contacts */}
            {tab === 'card' && (
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 block mb-2">
                  Нещодавні контакти
                </span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {RECENT_CONTACTS.map((contact) => (
                    <button
                      type="button"
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="flex flex-col items-center p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 shrink-0 w-20 text-center transition"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white mb-1"
                        style={{ backgroundColor: contact.avatarColor }}
                      >
                        {contact.initials}
                      </div>
                      <span className="text-[10px] font-medium text-white truncate w-full">
                        {contact.name.split(' ')[0]}
                      </span>
                      <span className="text-[8px] text-neutral-500">{contact.bankName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input fields */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                {tab === 'card' ? 'Номер картки одержувача' : 'IBAN рахунок одержувача (UA...)'}
              </label>
              <input
                type="text"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                placeholder={tab === 'card' ? '4441 •••• •••• ••••' : 'UA21 3220 0100 ...'}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder-neutral-600 focus:outline-hidden focus:border-neutral-700"
                required
              />
            </div>

            {tab === 'iban' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    ПІБ або назва організації
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ТОВ або ПІБ фізичної особи"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    Призначення платежу
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Оплата за послуги, без ПДВ"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-hidden"
                  />
                </div>
              </>
            )}

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-neutral-400">Сума переказу</label>
                <span className="text-[10px] text-neutral-500">
                  Доступно: {formatMoney(activeCard.balance, activeCard.currency)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-base font-bold text-white placeholder-neutral-600 focus:outline-hidden"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-neutral-400">
                  {activeCard.currencySymbol}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Надіслати {amount} {activeCard.currencySymbol}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
