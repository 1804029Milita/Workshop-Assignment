import { useState, FormEvent } from 'react';
import { useExpenses } from './useExpenses';
import { validateExpenseInput } from '../../lib/validation/expense';
import type { ExpenseFormValues, Category } from './expenseTypes';

export function ExpenseForm({ currencySymbol = '$' }: { currencySymbol?: string }) {
  const { categories, loading: categoriesLoading, addExpense } = useExpenses();
  const [formValues, setFormValues] = useState<ExpenseFormValues>({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    note: '',
    paymentMethod: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors.length > 0) setErrors([]);
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateExpenseInput(formValues);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const input = {
      amount: Number(formValues.amount),
      date: formValues.date,
      categoryId: formValues.categoryId,
      note: formValues.note || undefined,
      paymentMethod: formValues.paymentMethod || undefined,
    };
    const success = await addExpense(input);
    if (success) {
      setFormValues({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        note: '',
        paymentMethod: '',
      });
    }
    setSubmitting(false);
  };

  if (categoriesLoading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h2>Add Expense</h2>
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => (
            <p key={i} className="error">{err}</p>
          ))}
        </div>
      )}
      {submitError && <p className="error submit-error">{submitError}</p>}

      <div className="form-group">
        <label htmlFor="amount">Amount {currencySymbol}</label>
        <input
          type="number"
          id="amount"
          name="amount"
          step="0.01"
          min="0.01"
          value={formValues.amount}
          onChange={handleChange}
          required
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formValues.date}
          onChange={handleChange}
          required
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="categoryId">Category</label>
        <select
          id="categoryId"
          name="categoryId"
          value={formValues.categoryId}
          onChange={handleChange}
          required
          disabled={submitting}
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="note">Note (optional)</label>
        <textarea
          id="note"
          name="note"
          value={formValues.note}
          onChange={handleChange}
          rows={3}
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="paymentMethod">Payment Method (optional)</label>
        <input
          type="text"
          id="paymentMethod"
          name="paymentMethod"
          value={formValues.paymentMethod}
          onChange={handleChange}
          disabled={submitting}
        />
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  );
}
