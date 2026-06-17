import { invoke } from '@tauri-apps/api/core';
import type { Expense, CreateExpenseInput } from './expenseTypes';

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  return invoke('create_expense', { input });
}

export async function listExpenses(): Promise<Expense[]> {
  return invoke('list_expenses');
}

export async function listCategories(): Promise<{ id: string; name: string }[]> {
  return invoke('list_categories');
}
