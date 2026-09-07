import React, { useState } from 'react';
import { Transaction, TransactionCategory } from '../types/bank';
import { formatMoney } from '../utils/formatters';
import {
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Heart,
  Train,
  Zap,
  Search,
  Receipt,
  FileText,
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getCategoryIcon = (category: TransactionCategory, amount: number) => {
    switch (category) {
      case 'groceries':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'charity':
        return <Heart className="w-4 h-4 text-amber-400" />;
      case 'transport':
        return <Train className="w-4 h-4 text-blue-400" />;
      case 'utilities':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'transfer':
      default:
        return amount > 0 ? (
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
        );
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchesCat = selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.subtitle && tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full px-4 pt-2 pb-6 flex-1 flex flex-col">
      {/* Header with Search and Count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Виписка операцій
        </span>
        <span className="text-[10px] text-neutral-500">{filtered.length} платежів</span>
      </div>

      {/* Search Input */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Пошук за назвою чи чеком..."
          className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-700 transition"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-1">
        {[
          { id: 'all', label: 'Всі' },
          { id: 'groceries', label: 'Продукти' },
          { id: 'transfer', label: 'Перекази' },
          { id: 'transport', label: 'Транспорт' },
          { id: 'charity', label: 'ЗСУ' },
          { id: 'utilities', label: 'Комунальні' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition ${
              selectedCategory === cat.id
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-300 bg-neutral-950/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List of Transactions */}
      <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">Операцій не знайдено</div>
        ) : (
          filtered.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="p-2.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 active:bg-neutral-800/80 transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                  {getCategoryIcon(tx.category, tx.amount)}
                </div>

                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                    <span>{tx.title}</span>
                    <Receipt className="w-3 h-3 text-neutral-600 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <span>{tx.time}</span>
                    <span>•</span>
                    <span className="truncate max-w-[140px]">{tx.subtitle || tx.category}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-xs font-bold ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {formatMoney(tx.amount, tx.currency, true)}
                </div>
                {tx.cashbackAmount && (
                  <div className="text-[9px] text-rose-400 font-semibold">
                    +{formatMoney(tx.cashbackAmount, tx.currency)} кешбек
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
