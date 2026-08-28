'use client';

import { useTransactions } from '@/presentation/hooks';
import { getCategories } from '@/app/actions/categories';
import { getBudgetStatus } from '@/app/budgets/actions';
import { EmojiButton, AnimatedPage, CreateCategoryModal } from '@/presentation/components/shared';
import { Category } from '@/domain/entities/category';
import { BudgetStatus } from '@/domain/usecases/budgets';
import { useMemo, useState, useEffect } from 'react';

export default function CategoriesPage() {
  const { transactions } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [budgetStatusMap, setBudgetStatusMap] = useState<Record<string, BudgetStatus>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCategories = async () => {
    try {
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data);

        // Load budget status for each category (current month/year)
        const now = new Date();
        const month = now.getMonth() + 1; // getMonth returns 0-11
        const year = now.getFullYear();

        const statusMap: Record<string, BudgetStatus> = {};
        for (const category of result.data) {
          const budgetResult = await getBudgetStatus(category.id, month, year);
          if (budgetResult.success) {
            statusMap[category.id] = budgetResult.data;
          }
        }
        setBudgetStatusMap(statusMap);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const categoriesWithSpending = useMemo(() => {
    const expensesByCategory = new Map<string, number>();

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = expensesByCategory.get(t.categoryId) || 0;
        expensesByCategory.set(t.categoryId, current + t.amount);
      });

    return categories.map(cat => ({
      ...cat,
      spent: expensesByCategory.get(cat.id) || 0,
      budget: cat.budget || 1000,
    }));
  }, [transactions, categories]);

  const expenseCategories = categoriesWithSpending.filter(c => c.type === 'expense' || c.type === 'both');
  const incomeCategories = categoriesWithSpending.filter(c => c.type === 'income' || c.type === 'both');

  return (
    <AnimatedPage>
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
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Expense Categories */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Gastos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {expenseCategories.map((cat) => {
            // Use pre-calculated budget status from server (respects AD-5)
            const budgetStatus = budgetStatusMap[cat.id];
            const percentageUsed = budgetStatus?.percentageUsed ?? 0;
            const isOverBudget = budgetStatus?.isOverBudget ?? false;
            const isNearLimit = budgetStatus?.isNearLimit ?? false;
            const percentage = Math.min(percentageUsed, 100);

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all hover:shadow-md ${
                  isOverBudget 
                    ? 'border-red-300 bg-red-50/30' 
                    : isNearLimit 
                    ? 'border-amber-300 bg-amber-50/30' 
                    : 'border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-zinc-900">{cat.name}</h3>
                      {isOverBudget && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">⚠️ Excedido</span>}
                      {isNearLimit && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">⚡ 80%+</span>}
                    </div>
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

      <CreateCategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadCategories}
      />
    </div>
    </AnimatedPage>
  );
}
