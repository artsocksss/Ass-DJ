import { BankCard, Transaction, SavingsJar, CashbackCategory } from '../types/bank';
import { INITIAL_CARDS, INITIAL_TRANSACTIONS, INITIAL_JARS, INITIAL_CASHBACK_CATEGORIES } from '../data/mockBankData';

const KEYS = {
  CARDS: 'neobank_cards_v1',
  TRANSACTIONS: 'neobank_transactions_v1',
  JARS: 'neobank_jars_v1',
  CASHBACK: 'neobank_cashback_v1',
  TOTAL_CASHBACK: 'neobank_total_cashback_v1',
};

export function loadCards(): BankCard[] {
  try {
    const raw = localStorage.getItem(KEYS.CARDS);
    return raw ? JSON.parse(raw) : INITIAL_CARDS;
  } catch {
    return INITIAL_CARDS;
  }
}

export function saveCards(cards: BankCard[]): void {
  try {
    localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  } catch {
    // ignore
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch {
    // ignore
  }
}

export function loadJars(): SavingsJar[] {
  try {
    const raw = localStorage.getItem(KEYS.JARS);
    return raw ? JSON.parse(raw) : INITIAL_JARS;
  } catch {
    return INITIAL_JARS;
  }
}

export function saveJars(jars: SavingsJar[]): void {
  try {
    localStorage.setItem(KEYS.JARS, JSON.stringify(jars));
  } catch {
    // ignore
  }
}

export function loadCashbackCategories(): CashbackCategory[] {
  try {
    const raw = localStorage.getItem(KEYS.CASHBACK);
    return raw ? JSON.parse(raw) : INITIAL_CASHBACK_CATEGORIES;
  } catch {
    return INITIAL_CASHBACK_CATEGORIES;
  }
}

export function saveCashbackCategories(cats: CashbackCategory[]): void {
  try {
    localStorage.setItem(KEYS.CASHBACK, JSON.stringify(cats));
  } catch {
    // ignore
  }
}

export function loadTotalCashback(): number {
  try {
    const raw = localStorage.getItem(KEYS.TOTAL_CASHBACK);
    return raw ? JSON.parse(raw) : 355.70;
  } catch {
    return 355.70;
  }
}

export function saveTotalCashback(amount: number): void {
  try {
    localStorage.setItem(KEYS.TOTAL_CASHBACK, JSON.stringify(amount));
  } catch {
    // ignore
  }
}
