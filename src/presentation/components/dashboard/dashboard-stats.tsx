'use client';

import { useEffect, useState } from 'react';
import { EmojiCard } from '@/presentation/components/shared';
import { useTransactions } from '@/presentation/hooks';

interface BalanceData {
  income: number;
  expense: number;
  balance: number;
}

export function DashboardStats() {
  const { getBalance, loading } = useTransactions();
  const [balance, setBalance] = useState<BalanceData>({
    income: 0,
    expense: 0,
    balance: 0,
  });

  useEffect(() => {
    const loadBalance = async () => {
      const data = await getBalance();
      setBalance(data);
    };
    loadBalance();
  }, [getBalance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-zinc-200 animate-pulse">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-3 sm:h-4 bg-zinc-200 rounded w-16 sm:w-20" />
                <div className="h-6 sm:h-8 bg-zinc-200 rounded w-20 sm:w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <EmojiCard
        emoji="💰"
        title="Balance"
        value={formatCurrency(balance.balance)}
        subtitle="Disponible"
        trend={{ value: 12.5, isPositive: true }}
      />
      <EmojiCard
        emoji="💵"
        title="Ingresos"
        value={formatCurrency(balance.income)}
        subtitle="Este mes"
        trend={{ value: 8.2, isPositive: true }}
      />
      <EmojiCard
        emoji="💸"
        title="Gastos"
        value={formatCurrency(balance.expense)}
        subtitle="Este mes"
        trend={{ value: 5.3, isPositive: false }}
      />
      <EmojiCard
        emoji="🎯"
        title="Restante"
        value={formatCurrency(balance.income - balance.expense)}
        subtitle="Presupuesto"
        trend={{ value: 15.8, isPositive: true }}
      />
    </div>
  );
}
