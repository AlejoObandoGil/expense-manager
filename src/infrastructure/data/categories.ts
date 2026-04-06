import { Category } from '@/domain/entities/category';

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Vivienda', emoji: '🏠', color: '#3b82f6', type: 'expense' },
  { id: 'cat-2', name: 'Alimentación', emoji: '🍕', color: '#f97316', type: 'expense' },
  { id: 'cat-3', name: 'Transporte', emoji: '🚗', color: '#8b5cf6', type: 'expense' },
  { id: 'cat-4', name: 'Salud', emoji: '⚕️', color: '#ef4444', type: 'expense' },
  { id: 'cat-5', name: 'Entretenimiento', emoji: '🎬', color: '#ec4899', type: 'expense' },
  { id: 'cat-6', name: 'Compras', emoji: '🛍️', color: '#f59e0b', type: 'expense' },
  { id: 'cat-7', name: 'Educación', emoji: '📚', color: '#6366f1', type: 'expense' },
  { id: 'cat-8', name: 'Mascotas', emoji: '🐕', color: '#84cc16', type: 'expense' },
  { id: 'cat-9', name: 'Viajes', emoji: '✈️', color: '#06b6d4', type: 'expense' },
  { id: 'cat-10', name: 'Suscripciones', emoji: '📱', color: '#64748b', type: 'expense' },
  { id: 'cat-11', name: 'Regalos', emoji: '🎁', color: '#e11d48', type: 'expense' },
  { id: 'cat-12', name: 'Ahorros', emoji: '🏦', color: '#10b981', type: 'expense' },
  { id: 'cat-13', name: 'Salario', emoji: '💼', color: '#10b981', type: 'income' },
  { id: 'cat-14', name: 'Freelance', emoji: '💻', color: '#3b82f6', type: 'income' },
  { id: 'cat-15', name: 'Inversiones', emoji: '📈', color: '#8b5cf6', type: 'income' },
  { id: 'cat-16', name: 'Regalos Recibidos', emoji: '🎉', color: '#f97316', type: 'income' },
  { id: 'cat-17', name: 'Otros Ingresos', emoji: '💰', color: '#22c55e', type: 'income' },
  { id: 'cat-18', name: 'Transferencia', emoji: '🔄', color: '#64748b', type: 'both' },
];
