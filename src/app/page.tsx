'use client';

import {
  DashboardStats,
  MonthlyChart,
  CategoryChart,
  RecentTransactions,
} from '@/presentation/components/dashboard';
import { TransactionForm } from '@/presentation/components/transactions/transaction-form';
import { useTransactions } from '@/presentation/hooks';

export default function Home() {
  const { refresh } = useTransactions();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Resumen de tus finanzas personales</p>
        </div>
        <TransactionForm onSuccess={refresh} />
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
  );
}
