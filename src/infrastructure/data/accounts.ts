import { Account } from '@/domain/entities/account';

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Efectivo',
    type: 'cash',
    initialBalance: 0,
    currency: 'PEN',
    isActive: true,
  },
  {
    id: 'acc-2',
    name: 'Cuenta Corriente',
    type: 'checking',
    initialBalance: 5000,
    currency: 'PEN',
    isActive: true,
  },
  {
    id: 'acc-3',
    name: 'Tarjeta Crédito BCP',
    type: 'credit_card',
    initialBalance: 0,
    currency: 'PEN',
    isActive: true,
  },
  {
    id: 'acc-4',
    name: 'Ahorros',
    type: 'savings',
    initialBalance: 10000,
    currency: 'PEN',
    isActive: true,
  },
];
