/**
 * Ukrainian fintech formatting utilities
 */

export function formatMoney(amount: number, currency: string = 'UAH', showSign: boolean = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const parts = absAmount.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimalPart = parts[1];

  const symbol = currency === 'UAH' ? '₴' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  let sign = '';
  if (showSign) {
    sign = isNegative ? '- ' : '+ ';
  } else if (isNegative) {
    sign = '-';
  }

  // Ukrainian standard: 1 450,00 ₴
  return `${sign}${integerPart},${decimalPart} ${symbol}`;
}

export function formatCardNumber(num: string, masked: boolean = false): string {
  const clean = num.replace(/\s+/g, '');
  if (masked) {
    const first4 = clean.slice(0, 4);
    const last4 = clean.slice(-4);
    return `${first4} •••• •••• ${last4}`;
  }
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}

export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

export function isValidUkrainianIBAN(iban: string): boolean {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  return /^UA\d{27}$/.test(clean);
}

export function formatUkrainianPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('380')) {
    return `+380 (${clean.slice(3, 5)}) ${clean.slice(5, 8)}-${clean.slice(8, 10)}-${clean.slice(10, 12)}`;
  }
  if (clean.length === 10 && clean.startsWith('0')) {
    return `+380 (${clean.slice(1, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 10)}`;
  }
  return phone;
}

export function detectMobileOperator(phone: string): { name: string; color: string; logoText: string } {
  const clean = phone.replace(/\D/g, '');
  let prefix = '';
  if (clean.startsWith('380')) {
    prefix = clean.slice(3, 5);
  } else if (clean.startsWith('0')) {
    prefix = clean.slice(1, 3);
  }

  const kyivstar = ['67', '68', '96', '97', '98'];
  const vodafone = ['50', '66', '95', '99'];
  const lifecell = ['63', '73', '93'];

  if (kyivstar.includes(prefix)) {
    return { name: 'Київстар', color: '#0070BA', logoText: 'KS' };
  }
  if (vodafone.includes(prefix)) {
    return { name: 'Vodafone', color: '#E60000', logoText: 'VF' };
  }
  if (lifecell.includes(prefix)) {
    return { name: 'lifecell', color: '#FFB800', logoText: 'LC' };
  }
  return { name: 'Мобільний оператор', color: '#666666', logoText: 'UA' };
}

export function calculateCashbackNet(gross: number): { net: number; tax: number } {
  const tax = Number((gross * 0.195).toFixed(2));
  const net = Number((gross - tax).toFixed(2));
  return { net, tax };
}
