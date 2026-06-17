import { invoke } from '@tauri-apps/api/core';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from './categoryTypes';

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  return invoke('create_category', { input });
}

export async function listCategories(): Promise<Category[]> {
  return invoke('list_categories');
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  return invoke('update_category', { input });
}

export async function deleteCategory(id: string): Promise<void> {
  return invoke('delete_category', { id });
}
