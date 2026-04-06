import { Transaction } from '@/domain/entities/transaction';
import { subDays, subMonths } from 'date-fns';

const now = new Date();

const generateId = () => `tx-${Math.random().toString(36).substring(2, 9)}`;

const createTransaction = (
  amount: number,
  description: string,
  categoryId: string,
  date: Date,
  type: 'income' | 'expense',
  accountId: string = 'acc-1'
): Transaction => ({
  id: generateId(),
  amount,
  description,
  categoryId,
  date,
  type,
  accountId,
  createdAt: date,
  updatedAt: date,
});

// Ingresos del mes actual
const currentMonthIncome = [
  createTransaction(3500, 'Salario mensual', 'cat-13', subDays(now, 2), 'income'),
  createTransaction(800, 'Proyecto freelance web', 'cat-14', subDays(now, 5), 'income'),
  createTransaction(150, 'Dividendos inversiones', 'cat-15', subDays(now, 8), 'income'),
  createTransaction(200, 'Consultoría técnica', 'cat-14', subDays(now, 12), 'income'),
];

// Gastos del mes actual (categorías variadas)
const currentMonthExpenses = [
  // Vivienda
  createTransaction(850, 'Alquiler departamento', 'cat-1', subDays(now, 1), 'expense'),
  createTransaction(120, 'Servicios luz/agua', 'cat-1', subDays(now, 3), 'expense'),
  createTransaction(45, 'Internet fibra óptica', 'cat-1', subDays(now, 4), 'expense'),
  
  // Alimentación
  createTransaction(85.50, 'Supermercado semanal', 'cat-2', subDays(now, 2), 'expense'),
  createTransaction(24.90, 'Desayuno café', 'cat-2', subDays(now, 3), 'expense'),
  createTransaction(156.80, 'Compra mensual supermercado', 'cat-2', subDays(now, 6), 'expense'),
  createTransaction(42.00, 'Cena restaurante', 'cat-2', subDays(now, 7), 'expense'),
  createTransaction(18.50, 'Snacks y bebidas', 'cat-2', subDays(now, 9), 'expense'),
  
  // Transporte
  createTransaction(150, 'Gasolina', 'cat-3', subDays(now, 4), 'expense'),
  createTransaction(35, 'Uber al centro', 'cat-3', subDays(now, 5), 'expense'),
  createTransaction(45, 'Estacionamiento mensual', 'cat-3', subDays(now, 10), 'expense'),
  createTransaction(28, 'Mantenimiento auto', 'cat-3', subDays(now, 11), 'expense'),
  
  // Salud
  createTransaction(65, 'Farmacia - medicamentos', 'cat-4', subDays(now, 6), 'expense'),
  createTransaction(120, 'Consulta médica', 'cat-4', subDays(now, 8), 'expense'),
  
  // Entretenimiento
  createTransaction(15.99, 'Netflix suscripción', 'cat-10', subDays(now, 1), 'expense'),
  createTransaction(45, 'Cine con amigos', 'cat-5', subDays(now, 5), 'expense'),
  createTransaction(12.99, 'Spotify premium', 'cat-10', subDays(now, 7), 'expense'),
  createTransaction(60, 'Concierto', 'cat-5', subDays(now, 9), 'expense'),
  
  // Compras
  createTransaction(89.99, 'Ropa nueva', 'cat-6', subDays(now, 4), 'expense'),
  createTransaction(45.50, 'Zapatos deportivos', 'cat-6', subDays(now, 8), 'expense'),
  createTransaction(120, 'Electrónica - cables', 'cat-6', subDays(now, 12), 'expense'),
  
  // Educación
  createTransaction(49.99, 'Curso online Udemy', 'cat-7', subDays(now, 10), 'expense'),
  createTransaction(25, 'Libro técnico', 'cat-7', subDays(now, 13), 'expense'),
  
  // Mascotas
  createTransaction(85, 'Veterinario checkup', 'cat-8', subDays(now, 14), 'expense'),
  createTransaction(35, 'Comida mascota', 'cat-8', subDays(now, 2), 'expense'),
  
  // Viajes
  createTransaction(450, 'Vuelos semana santa', 'cat-9', subDays(now, 15), 'expense'),
  createTransaction(200, 'Hotel reserva', 'cat-9', subDays(now, 15), 'expense'),
  
  // Suscripciones
  createTransaction(12.99, 'Disney+', 'cat-10', subDays(now, 3), 'expense'),
  createTransaction(9.99, 'Amazon Prime', 'cat-10', subDays(now, 6), 'expense'),
  createTransaction(19.99, 'Gym mensualidad', 'cat-10', subDays(now, 1), 'expense'),
  
  // Regalos
  createTransaction(45, 'Cumpleaños mamá', 'cat-11', subDays(now, 7), 'expense'),
  createTransaction(30, 'Detalle amigo', 'cat-11', subDays(now, 11), 'expense'),
  
  // Ahorros
  createTransaction(500, 'Ahorro de emergencia', 'cat-12', subDays(now, 1), 'expense'),
];

// Mes anterior (para gráficos)
const lastMonth = subMonths(now, 1);
const lastMonthTransactions = [
  createTransaction(3500, 'Salario mensual', 'cat-13', subDays(lastMonth, 2), 'income'),
  createTransaction(600, 'Proyecto extra', 'cat-14', subDays(lastMonth, 10), 'income'),
  createTransaction(850, 'Alquiler', 'cat-1', subDays(lastMonth, 1), 'expense'),
  createTransaction(200, 'Supermercado', 'cat-2', subDays(lastMonth, 5), 'expense'),
  createTransaction(180, 'Gasolina', 'cat-3', subDays(lastMonth, 8), 'expense'),
  createTransaction(120, 'Restaurantes', 'cat-2', subDays(lastMonth, 12), 'expense'),
  createTransaction(50, 'Entretenimiento', 'cat-5', subDays(lastMonth, 15), 'expense'),
  createTransaction(300, 'Compras varias', 'cat-6', subDays(lastMonth, 20), 'expense'),
];

// Hace 2 meses
const twoMonthsAgo = subMonths(now, 2);
const twoMonthsTransactions = [
  createTransaction(3500, 'Salario mensual', 'cat-13', subDays(twoMonthsAgo, 2), 'income'),
  createTransaction(400, 'Freelance diseño', 'cat-14', subDays(twoMonthsAgo, 8), 'income'),
  createTransaction(850, 'Alquiler', 'cat-1', subDays(twoMonthsAgo, 1), 'expense'),
  createTransaction(250, 'Supermercado', 'cat-2', subDays(twoMonthsAgo, 6), 'expense'),
  createTransaction(140, 'Gasolina', 'cat-3', subDays(twoMonthsAgo, 9), 'expense'),
  createTransaction(90, 'Restaurantes', 'cat-2', subDays(twoMonthsAgo, 14), 'expense'),
  createTransaction(75, 'Cine y eventos', 'cat-5', subDays(twoMonthsAgo, 18), 'expense'),
  createTransaction(200, 'Ropa invierno', 'cat-6', subDays(twoMonthsAgo, 22), 'expense'),
];

export const mockTransactions: Transaction[] = [
  ...currentMonthIncome,
  ...currentMonthExpenses,
  ...lastMonthTransactions,
  ...twoMonthsTransactions,
].sort((a, b) => b.date.getTime() - a.date.getTime());
