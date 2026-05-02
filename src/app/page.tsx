'use client';

import {
  DashboardStats,
  MonthlyChart,
  CategoryChart,
  RecentTransactions,
} from '@/presentation/components/dashboard';
import { TransactionForm } from '@/presentation/components/transactions/transaction-form';
import { AnimatedPage } from '@/presentation/components/shared';
import { useTransactions } from '@/presentation/hooks';

export default function Home() {
  const { refresh } = useTransactions();

  return (
    <AnimatedPage>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-responsive-2xl font-semibold text-zinc-900">Dashboard</h1>
            <p className="text-responsive-sm text-zinc-500 mt-1">Resumen de tus finanzas personales</p>
          </div>
          <div className="hidden sm:block">
            <TransactionForm onSuccess={refresh} />
          </div>
        </div>

        {/* FAB móvil para agregar transacción */}
        <div className="fixed bottom-20 right-4 z-40 sm:hidden">
          <TransactionForm onSuccess={refresh} />
        </div>

        {/* Stats Cards */}
        <DashboardStats />

        {/* Charts - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <MonthlyChart />
          </div>
          <div>
            <CategoryChart />
          </div>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </AnimatedPage>
  );
}
