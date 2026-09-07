import React from 'react';
import {
  ArrowUpRight,
  Smartphone,
  PiggyBank,
  Percent,
  Sparkles,
  TrendingUp,
  Zap,
  Building2,
} from 'lucide-react';

interface QuickActionsProps {
  onOpenTransfer: (type: 'card' | 'iban') => void;
  onOpenMobile: () => void;
  onOpenJar: () => void;
  onOpenCashback: () => void;
  onOpenShake: () => void;
  onOpenCurrency: () => void;
  onOpenUtilities: () => void;
  cashbackAmount: number;
  jarsCount: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenTransfer,
  onOpenMobile,
  onOpenJar,
  onOpenCashback,
  onOpenShake,
  onOpenCurrency,
  onOpenUtilities,
  cashbackAmount,
  jarsCount,
}) => {
  const actions = [
    {
      id: 'transfer-card',
      label: 'Переказ на картку',
      icon: ArrowUpRight,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      badge: null,
      onClick: () => onOpenTransfer('card'),
    },
    {
      id: 'mobile',
      label: 'Поповнити мобільний',
      icon: Smartphone,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badge: '0% ком.',
      onClick: onOpenMobile,
    },
    {
      id: 'utilities',
      label: 'Комунальні',
      icon: Zap,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      badge: 'ДТЕК, Газ',
      onClick: onOpenUtilities,
    },
    {
      id: 'transfer-iban',
      label: 'За реквізитами (IBAN)',
      icon: Building2,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      badge: 'НБУ СЕП',
      onClick: () => onOpenTransfer('iban'),
    },
    {
      id: 'jars',
      label: 'Накопичення «Банка»',
      icon: PiggyBank,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      badge: `${jarsCount} банки`,
      onClick: onOpenJar,
    },
    {
      id: 'cashback',
      label: 'Кешбек',
      icon: Percent,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      badge: `${cashbackAmount.toFixed(0)} ₴`,
      onClick: onOpenCashback,
    },
    {
      id: 'shake',
      label: 'Shake to Pay',
      icon: Sparkles,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badge: 'Поруч',
      onClick: onOpenShake,
    },
    {
      id: 'currency',
      label: 'Курси валют',
      icon: TrendingUp,
      color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      badge: '41.25 $',
      onClick: onOpenCurrency,
    },
  ];

  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Швидкі дії
        </span>
        <span className="text-[10px] text-neutral-500 font-medium">Українські сервіси</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="flex flex-col items-center text-center p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 active:scale-95 transition group relative"
            >
              {act.badge && (
                <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-neutral-800 border border-neutral-700 text-[8px] font-bold text-neutral-300 shadow-xs">
                  {act.badge}
                </span>
              )}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-1.5 transition-transform group-hover:scale-105 ${act.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-neutral-300 group-hover:text-white leading-tight line-clamp-2">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
