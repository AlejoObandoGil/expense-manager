'use client';

import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import { useTransactions } from '@/presentation/hooks';

interface MonthlyStat {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export function MonthlyChart() {
  const { getMonthlyStats } = useTransactions();
  const [data, setData] = useState<MonthlyStat[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await getMonthlyStats(6);
      setData(stats.map(stat => ({
        ...stat,
        month: new Date(stat.month + '-01').toLocaleDateString('es-ES', { month: 'short' }),
      })));
    };
    loadStats();
  }, [getMonthlyStats]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📈</span>
        <h3 className="text-lg font-semibold text-zinc-900">Evolución Mensual</h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="month"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value) => typeof value === 'number' ? formatCurrency(value) : ''}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
              name="Ingresos"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
              name="Gastos"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
