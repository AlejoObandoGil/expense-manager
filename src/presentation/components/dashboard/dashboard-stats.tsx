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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-20" />
                <div className="h-8 bg-zinc-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <EmojiCard
        emoji="💰"
        title="Balance Total"
        value={formatCurrency(balance.balance)}
        subtitle="Disponible actualmente"
        trend={{ value: 12.5, isPositive: true }}
      />
      <EmojiCard
        emoji="💵"
        title="Ingresos del Mes"
        value={formatCurrency(balance.income)}
        subtitle="Total recibido"
        trend={{ value: 8.2, isPositive: true }}
      />
      <EmojiCard
        emoji="💸"
        title="Gastos del Mes"
        value={formatCurrency(balance.expense)}
        subtitle="Total gastado"
        trend={{ value: 5.3, isPositive: false }}
      />
      <EmojiCard
        emoji="🎯"
        title="Presupuesto Restante"
        value={formatCurrency(balance.income - balance.expense)}
        subtitle="80% utilizado"
        trend={{ value: 15.8, isPositive: true }}
      />
    </div>
  );
}
