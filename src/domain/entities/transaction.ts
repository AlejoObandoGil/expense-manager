export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  type: 'income' | 'expense';
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}
