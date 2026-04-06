'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction } from '@/domain/entities/transaction';
import { transactionRepository } from '@/infrastructure/repositories';
import { GetTransactionsUseCase, GetBalanceUseCase, GetMonthlyStatsUseCase } from '@/domain/usecases/transactions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTransactionsUseCase = useMemo(() => new GetTransactionsUseCase(transactionRepository), []);
  const getBalanceUseCase = useMemo(() => new GetBalanceUseCase(transactionRepository), []);
  const getMonthlyStatsUseCase = useMemo(() => new GetMonthlyStatsUseCase(transactionRepository), []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTransactionsUseCase.execute();
      setTransactions(data);
      setError(null);
    } catch {
      setError('Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  }, [getTransactionsUseCase]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getBalance = useCallback(async () => {
    return getBalanceUseCase.execute();
  }, [getBalanceUseCase]);

  const getMonthlyStats = useCallback(async (months?: number) => {
    return getMonthlyStatsUseCase.execute(months);
  }, [getMonthlyStatsUseCase]);

  return {
    transactions,
    loading,
    error,
    refresh: loadTransactions,
    getBalance,
    getMonthlyStats,
  };
}
