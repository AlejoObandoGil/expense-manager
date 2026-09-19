'use client';

import { useEffect, useState } from 'react';
import { Transaction } from '@/domain/entities/transaction';
import { mockCategories } from '@/infrastructure/data';
import { createTransaction, updateTransaction } from '@/app/transactions/actions';
import { getActiveAccounts } from '@/app/accounts/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmojiButton } from '@/presentation/components/shared';
import { toast } from 'sonner';

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function TransactionForm({ transaction, onSuccess, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const isEditing = !!transaction;

  // Story 5.2: transactions require a real account_id. There is no account
  // selector yet (Story 5.4) -- the active user's first active account is
  // used implicitly for new transactions. Not needed when editing: reassigning
  // an account is out of scope (Story 5.4).
  useEffect(() => {
    if (isEditing) return;
    let cancelled = false;

    getActiveAccounts().then((result) => {
      if (cancelled) return;
      if (result.success) {
        if (result.data.length > 0) {
          setDefaultAccountId(result.data[0].id);
        } else {
          setAccountsError(
            'No tienes cuentas activas. Crea una cuenta antes de registrar transacciones.'
          );
        }
      } else {
        setAccountsError(result.error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isEditing]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const date = formData.get('date') as string;

    try {
      if (isEditing) {
        const result = await updateTransaction({
          id: transaction.id,
          amount,
          description,
          categoryId,
          date: new Date(date),
          type,
        });
        if (result.success) {
          toast.success('Transacción actualizada', {
            description: `${description} - S/${amount.toFixed(2)}`,
          });
        } else {
          toast.error('Error', {
            description: result.error,
          });
          setLoading(false);
          return;
        }
      } else {
        if (!defaultAccountId) {
          toast.error('Error', {
            description:
              accountsError ??
              'No se encontró una cuenta activa para asociar la transacción.',
          });
          setLoading(false);
          return;
        }

        const result = await createTransaction({
          amount,
          description,
          categoryId,
          date: new Date(date),
          type,
          accountId: defaultAccountId,
        });
        if (result.success) {
          toast.success('Transacción creada', {
            description: `${description} - S/${amount.toFixed(2)}`,
          });
        } else {
          toast.error('Error', {
            description: result.error,
          });
          setLoading(false);
          return;
        }
      }

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'No se pudo guardar la transacción',
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = mockCategories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <EmojiButton
            emoji={isEditing ? '✏️' : '➕'}
            label={isEditing ? 'Editar' : 'Nueva Transacción'}
            variant="primary"
          />
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{isEditing ? '✏️' : '➕'}</span>
            {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Type Selection */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              💸 Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                type === 'income'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              💵 Ingreso
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (S/)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={transaction?.amount}
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              name="description"
              required
              defaultValue={transaction?.description}
              placeholder="Ej: Compra supermercado"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoría</Label>
            <Select
              name="categoryId"
              defaultValue={transaction?.categoryId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={
                transaction?.date
                  ? new Date(transaction.date).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
