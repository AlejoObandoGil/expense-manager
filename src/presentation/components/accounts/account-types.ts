import { Account } from '@/domain/entities/account';

export interface AccountTypeInfo {
  value: Account['type'];
  label: string;
  emoji: string;
}

export const ACCOUNT_TYPES: AccountTypeInfo[] = [
  { value: 'checking', label: 'Cuenta corriente', emoji: '🏦' },
  { value: 'savings', label: 'Ahorros', emoji: '💰' },
  { value: 'credit_card', label: 'Tarjeta de crédito', emoji: '💳' },
  { value: 'cash', label: 'Efectivo', emoji: '💵' },
  { value: 'investment', label: 'Inversión', emoji: '📈' },
];

export function getAccountTypeInfo(type: Account['type']): AccountTypeInfo {
  return ACCOUNT_TYPES.find((t) => t.value === type) ?? ACCOUNT_TYPES[0];
}
