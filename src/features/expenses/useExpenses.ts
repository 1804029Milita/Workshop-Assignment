import { useState, useCallback, useEffect, useRef } from 'react';
import { listExpenses, createExpense, listCategories } from './expenseApi';
import type { Expense, Category, CreateExpenseInput } from './expenseTypes';
import { validateExpenseInput } from '../../lib/validation/expense';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesData, categoriesData] = await Promise.all([
        listExpenses(),
        listCategories(),
      ]);
      if (isMounted.current) {
        setExpenses(expensesData);
        setCategories(categoriesData);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExpense = useCallback(async (input: CreateExpenseInput): Promise<boolean> => {
    try {
      setError(null);
      const newExpense = await createExpense(input);
      if (isMounted.current) {
        setExpenses((prev) => [newExpense, ...prev]);
        return true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to create expense');
      }
      return false;
    }
    return false;
  }, []);

  return { expenses, categories, loading, error, refresh, addExpense };
}
