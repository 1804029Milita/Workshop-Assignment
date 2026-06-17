export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string;
  note?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  categoryId: string;
  note?: string;
  paymentMethod?: string;
}

export interface ExpenseFormValues {
  amount: string;
  date: string;
  categoryId: string;
  note: string;
  paymentMethod: string;
}
