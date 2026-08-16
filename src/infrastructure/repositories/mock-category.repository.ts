import 'server-only';
import { ICategoryRepository } from '@/domain/repositories/category.repository';
import { Category } from '@/domain/entities/category';
import { mockCategories } from '@/infrastructure/data/categories';

export class MockCategoryRepository implements ICategoryRepository {
  private categories: Category[] = [...mockCategories];

  async findAll(): Promise<Category[]> {
    return this.categories;
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }

  async findByType(type: 'income' | 'expense' | 'both'): Promise<Category[]> {
    return this.categories.filter(c => c.type === type || c.type === 'both');
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const category: Category = {
      ...data,
      id: crypto.randomUUID(),
    };
    this.categories.push(category);
    return category;
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    
    this.categories[index] = {
      ...this.categories[index],
      ...data,
    };
    return this.categories[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    this.categories.splice(index, 1);
  }
}

export const categoryRepository = new MockCategoryRepository();
