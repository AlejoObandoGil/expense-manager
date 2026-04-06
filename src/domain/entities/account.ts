export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings';
  balance: number;
  currency: string;
  emoji: string;
}
