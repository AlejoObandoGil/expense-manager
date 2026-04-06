import { Category } from '../entities/category';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByType(type: 'income' | 'expense' | 'both'): Promise<Category[]>;
  create(category: Omit<Category, 'id'>): Promise<Category>;
  update(id: string, category: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
}
