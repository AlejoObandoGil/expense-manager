export interface Account {
  id: string;
  name: string;
  type: 'credit_card' | 'checking' | 'savings' | 'cash' | 'investment';
  initialBalance: number;
  currency: string;
  isActive: boolean;
}
