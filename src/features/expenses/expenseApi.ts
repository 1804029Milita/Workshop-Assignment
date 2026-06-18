import { invoke } from '@tauri-apps/api/core';
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from './expenseTypes';
import type { Category } from '../categories/categoryTypes';

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  return invoke('create_expense', { input });
}

export async function listExpenses(): Promise<Expense[]> {
  return invoke('list_expenses');
}

export async function updateExpense(input: UpdateExpenseInput): Promise<Expense> {
  return invoke('update_expense', { input });
}

export async function deleteExpense(id: string): Promise<void> {
  return invoke('delete_expense', { id });
}

export async function listCategories(): Promise<Category[]> {
  return invoke('list_categories');
}
