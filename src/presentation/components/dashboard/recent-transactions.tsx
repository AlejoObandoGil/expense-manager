'use client';

import { useTransactions } from '@/presentation/hooks';
import { EmptyState, AmountDisplay } from '@/presentation/components/shared';
import { mockCategories } from '@/infrastructure/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function RecentTransactions() {
  const { transactions, loading } = useTransactions();

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📝</span>
          <h3 className="text-lg font-semibold text-zinc-900">Transacciones Recientes</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-10 h-10 bg-zinc-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-32" />
                <div className="h-3 bg-zinc-200 rounded w-24" />
              </div>
              <div className="h-5 bg-zinc-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
        <EmptyState
          emoji="📭"
          title="Sin transacciones"
          description="No hay transacciones recientes para mostrar"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📝</span>
        <h3 className="text-lg font-semibold text-zinc-900">Transacciones Recientes</h3>
      </div>

      <div className="space-y-3">
        {recentTransactions.map((transaction) => {
          const category = mockCategories.find(c => c.id === transaction.categoryId);

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 text-xl">
                {category?.emoji || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-zinc-500">
                  {category?.name} • {format(new Date(transaction.date), 'd MMM', { locale: es })}
                </p>
              </div>
              <AmountDisplay
                amount={transaction.amount}
                type={transaction.type === 'income' ? 'income' : 'expense'}
                size="md"
              />
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
        Ver todas las transacciones →
      </button>
    </div>
  );
}
