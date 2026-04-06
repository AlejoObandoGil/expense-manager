'use client';

import { Transaction } from '@/domain/entities/transaction';
import { TransactionForm as TransactionFormBase } from './transaction-form';

interface EditTransactionFormProps {
  transaction: Transaction;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function EditTransactionForm({ transaction, onSuccess, children }: EditTransactionFormProps) {
  return (
    <TransactionFormBase
      transaction={transaction}
      onSuccess={onSuccess}
      trigger={
        <button className="contents">
          {children}
        </button>
      }
    />
  );
}
