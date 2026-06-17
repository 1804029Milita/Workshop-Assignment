import type { ExpenseFormValues } from './expenseTypes';

export function validateExpenseInput(values: ExpenseFormValues): string[] {
  const errors: string[] = [];

  const amount = Number(values.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    errors.push('Amount must be greater than zero.');
  }

  if (!values.date.trim()) {
    errors.push('Date is required.');
  }

  if (!values.categoryId.trim()) {
    errors.push('Category is required.');
  }

  return errors;
}
