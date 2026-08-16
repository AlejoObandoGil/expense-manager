'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/domain/entities/transaction';
import {
  getTransactions,
  getBalance,
  getMonthlyStats,
} from '@/app/transactions/actions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getTransactions();
      if (result.success) {
        setTransactions(result.data);
        setError(null);
      } else {
        setError(result.error);
        setTransactions([]);
      }
    } catch {
      setError('Error al cargar las transacciones');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getBalanceData = useCallback(async () => {
    const result = await getBalance();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }, []);

  const getMonthlyStatsData = useCallback(async (months?: number) => {
    const result = await getMonthlyStats(months);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }, []);

  return {
    transactions,
    loading,
    error,
    refresh: loadTransactions,
    getBalance: getBalanceData,
    getMonthlyStats: getMonthlyStatsData,
  };
}
