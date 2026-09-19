'use client';

import { useState, useEffect, useRef } from 'react';
import { createAccount, updateAccount } from '@/app/accounts/actions';
import { Account } from '@/domain/entities/account';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';
import { ACCOUNT_TYPES, getAccountTypeInfo } from './account-types';

interface AccountFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSuccess?: () => void;
}

export function AccountFormModal({
  open,
  onOpenChange,
  account,
  onSuccess,
}: AccountFormModalProps) {
  const isEditing = !!account;
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<Account['type']>(
    getAccountTypeInfo(account?.type ?? 'checking').value
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tracks the latest `open` value so an in-flight submit can detect that the
  // user already closed the modal (Cancelar / Escape / click afuera) and skip
  // the post-await side effects (toast, onOpenChange, onSuccess).
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Reset form state whenever the modal opens (covers both create and edit)
  useEffect(() => {
    if (open) {
      setType(getAccountTypeInfo(account?.type ?? 'checking').value);
      setErrors({});
    }
  }, [open, account]);

  const mapServerError = (errorMessage: string) => {
    const appendError = (target: Record<string, string>, key: string, err: string) => {
      target[key] = target[key] ? `${target[key]}; ${err}` : err;
    };

    if (errorMessage.includes(';')) {
      const errorParts = errorMessage.split('; ');
      const newErrors: Record<string, string> = {};
      errorParts.forEach((err) => {
        if (err.includes('nombre')) appendError(newErrors, 'name', err);
        else if (err.includes('saldo')) appendError(newErrors, 'initialBalance', err);
        else if (err.includes('moneda')) appendError(newErrors, 'currency', err);
        else appendError(newErrors, 'general', err);
      });
      setErrors(newErrors);
      return;
    }

    if (errorMessage.includes('nombre')) setErrors({ name: errorMessage });
    else if (errorMessage.includes('saldo')) setErrors({ initialBalance: errorMessage });
    else if (errorMessage.includes('moneda')) setErrors({ currency: errorMessage });
    else setErrors({ general: errorMessage });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guard against double-submit (double click / double Enter) before
    // `setLoading(true)` below has taken effect.
    if (loading) return;

    setErrors({});

    const formData = new FormData(e.currentTarget);
    const name = ((formData.get('name') as string) ?? '').trim();
    const currency = ((formData.get('currency') as string) ?? '').trim();
    const initialBalanceRaw = formData.get('initialBalance') as string;
    const initialBalanceParsed = parseFloat(initialBalanceRaw);

    // Client-side guard: the backend schema only checks `finite()`, not sign,
    // but the spec requires a negative initial balance to be rejected inline
    // without touching `actions.ts` (out of scope for this story).
    // `Number.isFinite` (not `isNaN`) also rejects `Infinity`/`-Infinity`
    // results from inputs like `1e400`.
    if (!Number.isFinite(initialBalanceParsed)) {
      const message = 'El saldo inicial debe ser un número válido';
      setErrors({ initialBalance: message });
      toast.error('Error', { description: message });
      return;
    }
    if (initialBalanceParsed < 0) {
      const message = 'El saldo inicial no puede ser negativo';
      setErrors({ initialBalance: message });
      toast.error('Error', { description: message });
      return;
    }

    // Round to 2 decimals to avoid floating point artifacts (e.g. 1.005).
    const initialBalance = Math.round(initialBalanceParsed * 100) / 100;

    setLoading(true);

    try {
      const result = isEditing
        ? await updateAccount({
            id: account.id,
            name,
            type,
            initialBalance,
            currency,
          })
        : await createAccount({
            name,
            type,
            initialBalance,
            currency,
          });

      // The user may have closed the modal (Cancelar / Escape / click
      // afuera) while this await was in flight. Skip the toast and the
      // open/refresh side effects in that case.
      if (!openRef.current) return;

      if (result.success) {
        toast.success(isEditing ? 'Cuenta actualizada' : 'Cuenta creada', {
          description: name,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        const errorMessage = result.error || 'Error desconocido';
        mapServerError(errorMessage);
        toast.error('Error', {
          description: errorMessage,
        });
      }
    } catch (error) {
      if (!openRef.current) return;

      const message =
        error instanceof Error ? error.message : 'No se pudo guardar la cuenta';
      setErrors({ general: message });
      toast.error('Error', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" key={account?.id ?? 'create'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{isEditing ? '✏️' : '➕'}</span>
            {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={account?.name}
              placeholder="Ej: BCP Ahorros"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v: Account['type']) => setType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="initialBalance">Saldo inicial</Label>
            <Input
              id="initialBalance"
              name="initialBalance"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={account?.initialBalance ?? 0}
              placeholder="0.00"
            />
            {errors.initialBalance && (
              <p className="text-xs text-red-500">{errors.initialBalance}</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Input
              id="currency"
              name="currency"
              required
              defaultValue={account?.currency ?? 'PEN'}
              placeholder="PEN"
            />
            {errors.currency && (
              <p className="text-xs text-red-500">{errors.currency}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              {errors.general}
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
