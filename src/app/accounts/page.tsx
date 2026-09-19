'use client';

import { useState, useEffect } from 'react';
import { getAccounts, deleteAccount } from '@/app/accounts/actions';
import { Account } from '@/domain/entities/account';
import {
  EmptyState,
  AnimatedPage,
  EmojiButton,
} from '@/presentation/components/shared';
import {
  AccountFormModal,
  ACCOUNT_TYPES,
  getAccountTypeInfo,
} from '@/presentation/components/accounts';
import { Edit2, Trash2, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatAccountBalance(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency || 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [filterType, setFilterType] = useState<'all' | Account['type']>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoadError(null);
    try {
      const result = await getAccounts();
      if (result.success) {
        setAccounts(result.data);
      } else {
        setLoadError(result.error);
        toast.error('Error', { description: result.error });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar las cuentas';
      console.error('Error loading accounts:', error);
      setLoadError(message);
      toast.error('Error', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreate = () => {
    setEditingAccount(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDelete = async (account: Account) => {
    // Guard against a double-click firing two concurrent deletes (for this
    // row or any other) before the first `deleteAccount` call resolves.
    if (deletingId) return;
    if (!confirm(`¿Estás seguro de eliminar la cuenta "${account.name}"?`)) return;

    setDeletingId(account.id);
    try {
      const result = await deleteAccount(account.id);
      if (result.success) {
        toast.success('Cuenta eliminada');
        loadAccounts();
      } else {
        toast.error('Error', { description: result.error });
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al eliminar',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    if (filterType !== 'all' && account.type !== filterType) return false;
    if (search.trim() && !account.name.toLowerCase().includes(search.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Cuentas</h1>
            <p className="text-zinc-500 mt-1">Gestiona tus cuentas bancarias y de efectivo</p>
          </div>
          <EmojiButton
            emoji="➕"
            label="Nueva Cuenta"
            variant="primary"
            onClick={handleCreate}
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
              onChange={(e) => setFilterType(e.target.value as 'all' | Account['type'])}
              className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos los tipos</option>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Accounts List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-zinc-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-32" />
                    <div className="h-3 bg-zinc-200 rounded w-20" />
                  </div>
                </div>
                <div className="h-6 bg-zinc-200 rounded w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            emoji="⚠️"
            title="No se pudieron cargar las cuentas"
            description={loadError}
            actionLabel="Reintentar"
            onAction={() => {
              setLoading(true);
              loadAccounts();
            }}
          />
        ) : accounts.length === 0 ? (
          <EmptyState
            emoji="🏦"
            title="Sin cuentas"
            description="Crea tu primera cuenta para empezar a organizar tus finanzas"
            actionLabel="Nueva Cuenta"
            onAction={handleCreate}
          />
        ) : filteredAccounts.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="Sin resultados"
            description="No se encontraron cuentas con los filtros seleccionados"
            actionLabel="Limpiar filtros"
            onAction={() => {
              setFilterType('all');
              setSearch('');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => {
              const typeInfo = getAccountTypeInfo(account.type);

              return (
                <div
                  key={account.id}
                  className={cn(
                    'bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md',
                    account.isActive ? 'border-zinc-200' : 'border-zinc-200 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0">{typeInfo.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-zinc-900 truncate">{account.name}</h3>
                          {!account.isActive && (
                            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-medium shrink-0">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{typeInfo.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                        title="Eliminar"
                        onClick={() => handleDelete(account)}
                        disabled={deletingId === account.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-zinc-500">Saldo inicial</span>
                    <span className="text-lg font-semibold text-zinc-900">
                      {formatAccountBalance(account.initialBalance, account.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AccountFormModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          account={editingAccount}
          onSuccess={loadAccounts}
        />
      </div>
    </AnimatedPage>
  );
}
