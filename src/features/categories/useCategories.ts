import { useState, useCallback, useEffect, useRef } from 'react';
import { listCategories, createCategory, updateCategory as updateCategoryApi, deleteCategory } from './categoryApi';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from './categoryTypes';
import { validateCategoryInput } from '../../lib/validation/category';

export function useCategories() {
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
      const data = await listCategories();
      if (isMounted.current) {
        setCategories(data);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const addCategory = useCallback(async (input: CreateCategoryInput): Promise<boolean> => {
    try {
      const validationErrors = validateCategoryInput(input);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
        return false;
      }
      setError(null);
      const newCategory = await createCategory(input);
      if (isMounted.current) {
        setCategories((prev) => [...prev, newCategory]);
        return true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to create category');
      }
      return false;
    }
    return false;
  }, []);

  const updateCategory = useCallback(async (input: UpdateCategoryInput): Promise<boolean> => {
    try {
      const validationErrors = validateCategoryInput(input);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
        return false;
      }
      setError(null);
      const updatedCategory = await updateCategoryApi(input);
      if (isMounted.current) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
        );
        return true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to update category');
      }
      return false;
    }
    return false;
  }, []);

  const removeCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await deleteCategory(id);
      if (isMounted.current) {
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        return true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to delete category');
      }
      return false;
    }
    return false;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, error, refresh, addCategory, updateCategory, removeCategory };
}
