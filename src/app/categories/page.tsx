'use client';

import { useTransactions } from '@/presentation/hooks';
import { mockCategories } from '@/infrastructure/data';
import { EmojiButton } from '@/presentation/components/shared';
import { useMemo } from 'react';

export default function CategoriesPage() {
  const { transactions } = useTransactions();

  const categoriesWithSpending = useMemo(() => {
    const expensesByCategory = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = expensesByCategory.get(t.categoryId) || 0;
        expensesByCategory.set(t.categoryId, current + t.amount);
      });

    return mockCategories.map(cat => ({
      ...cat,
      spent: expensesByCategory.get(cat.id) || 0,
      budget: cat.budget || 1000,
    }));
  }, [transactions]);

  const expenseCategories = categoriesWithSpending.filter(c => c.type === 'expense' || c.type === 'both');
  const incomeCategories = categoriesWithSpending.filter(c => c.type === 'income' || c.type === 'both');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Categorías</h1>
          <p className="text-zinc-500 mt-1">Gestiona tus categorías y presupuestos</p>
        </div>
        <EmojiButton
          emoji="➕"
          label="Nueva Categoría"
          variant="primary"
          onClick={() => console.log('Nueva categoría')}
        />
      </div>

      {/* Expense Categories */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Gastos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {expenseCategories.map((cat) => {
            const percentage = Math.min((cat.spent / cat.budget) * 100, 100);
            const isOverBudget = cat.spent > cat.budget;
            
            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{cat.emoji}</span>
                  <div>
                    <h3 className="font-medium text-zinc-900">{cat.name}</h3>
                    <p className="text-xs text-zinc-500">
                      Presupuesto: S/{cat.budget.toFixed(0)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Gastado:</span>
                    <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-zinc-900'}>
                      S/{cat.spent.toFixed(0)}
                    </span>
                  </div>
                  
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-zinc-500 text-right">
                    {percentage.toFixed(0)}% utilizado
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Income Categories */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Ingresos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {incomeCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cat.emoji}</span>
                <div>
                  <h3 className="font-medium text-zinc-900">{cat.name}</h3>
                  <p className="text-xs text-zinc-500">
                    Total: S/{cat.spent.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
