/**
 * Formats a number as currency in Peruvian Soles (PEN).
 * Centralized utility to eliminate duplication across components.
 *
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "S/ 1,234.56")
 *
 * @example
 * formatCurrency(1234.56) // "S/ 1,234.56"
 * formatCurrency(0) // "S/ 0.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
