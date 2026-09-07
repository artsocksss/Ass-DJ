export type CardType = 'black' | 'white' | 'usd' | 'support';
export type CurrencyCode = 'UAH' | 'USD' | 'EUR';

export interface CardSecuritySettings {
  internetLimit: number;
  magStripeBlocked: boolean;
  contactlessEnabled: boolean;
  doubleConversionProtection: boolean;
  pinOnEveryPay: boolean;
}

export interface BankCard {
  id: string;
  name: string;
  type: CardType;
  currency: CurrencyCode;
  currencySymbol: string;
  balance: number;
  creditLimit: number;
  cardNumber: string;
  expiry: string;
  cvv: string;
  paymentSystem: 'mastercard' | 'visa';
  iban: string;
  colorGradient: string;
  isBlocked: boolean;
  settings: CardSecuritySettings;
}

export type TransactionCategory =
  | 'groceries'
  | 'transfer'
  | 'transport'
  | 'charity'
  | 'food'
  | 'services'
  | 'utilities'
  | 'entertainment';

export interface Transaction {
  id: string;
  cardId: string;
  title: string;
  subtitle?: string;
  category: TransactionCategory;
  amount: number;
  currency: CurrencyCode;
  date: string;
  time: string;
  cashbackAmount?: number;
  recipientDetails?: string;
  mcc?: string;
  receiptNumber: string;
}

export interface SavingsJar {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  ownerName: string;
  isCharity: boolean;
  colorGradient: string;
  roundUpRule: 'disabled' | 'to10' | 'to50' | 'to100';
  createdAt: string;
}

export interface CashbackCategory {
  id: string;
  name: string;
  percent: number;
  iconName: string;
  isSelected: boolean;
  accumulated: number;
}

export interface BankContact {
  id: string;
  name: string;
  phone: string;
  cardNumber: string;
  bankName: string;
  avatarColor: string;
  initials: string;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  buy: number;
  sell: number;
  nbu: number;
  changePercent: number;
}
