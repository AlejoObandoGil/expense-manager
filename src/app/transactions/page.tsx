'use client';

import { useState } from 'react';
import { useTransactions } from '@/presentation/hooks';
import { EmojiButton, EmptyState, AmountDisplay } from '@/presentation/components/shared';
import { mockCategories } from '@/infrastructure/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit2, Trash2, Copy, Filter } from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, loading } = useTransactions();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
    return true;
  });

  const incomeCategories = mockCategories.filter(c => c.type === 'income' || c.type === 'both');
  const expenseCategories = mockCategories.filter(c => c.type === 'expense' || c.type === 'both');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Transacciones</h1>
          <p className="text-zinc-500 mt-1">Gestiona tus ingresos y gastos</p>
        </div>
        <EmojiButton
          emoji="➕"
          label="Nueva Transacción"
          variant="primary"
          onClick={() => console.log('Nueva transacción')}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700">Filtros:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las categorías</option>
            <optgroup label="Ingresos">
              {incomeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Gastos">
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-10 h-10 bg-zinc-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-200 rounded w-40" />
                  <div className="h-3 bg-zinc-200 rounded w-24" />
                </div>
                <div className="h-6 bg-zinc-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="Sin transacciones"
            description="No se encontraron transacciones con los filtros seleccionados"
            actionLabel="Limpiar filtros"
            onAction={() => {
              setFilterType('all');
              setSelectedCategory('all');
            }}
          />
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((transaction) => {
              const category = mockCategories.find(c => c.id === transaction.categoryId);
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-xl"
                    style={{ backgroundColor: `${category?.color}20` }}
                  >
                    {category?.emoji || '📦'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {category?.name} • {format(new Date(transaction.date), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  
                  <AmountDisplay
                    amount={transaction.amount}
                    type={transaction.type === 'income' ? 'income' : 'expense'}
                    size="md"
                  />
                  
                  <div className="flex items-center gap-1">
                    <button
                      className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplicar"
                      onClick={() => console.log('Duplicar', transaction.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                      onClick={() => console.log('Editar', transaction.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                      onClick={() => console.log('Eliminar', transaction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
