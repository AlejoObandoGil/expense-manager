export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  budget?: number;
}
