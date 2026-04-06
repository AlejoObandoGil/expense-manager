export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}
