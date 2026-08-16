'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTransactions } from '@/presentation/hooks';
import { mockCategories } from '@/infrastructure/data';

interface CategoryData {
  name: string;
  value: number;
  color: string;
  emoji: string;
}

export function CategoryChart() {
  const { transactions } = useTransactions();

  const data: CategoryData[] = useMemo(() => {
    const expensesByCategory = new Map<string, number>();

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = expensesByCategory.get(t.categoryId) || 0;
        expensesByCategory.set(t.categoryId, current + t.amount);
      });

    return Array.from(expensesByCategory.entries())
      .map(([categoryId, amount]) => {
        const category = mockCategories.find(c => c.id === categoryId);
        return {
          name: category?.name || 'Sin categoría',
          value: amount,
          color: category?.color || '#64748b',
          emoji: category?.emoji || '📦',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🍩</span>
        <h3 className="text-lg font-semibold text-zinc-900">Distribución por Categoría</h3>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value) => typeof value === 'number' ? formatCurrency(value) : ''}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{item.emoji}</span>
              <span className="text-sm text-zinc-600">{item.name}</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
            <span className="text-sm font-medium text-zinc-900">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
