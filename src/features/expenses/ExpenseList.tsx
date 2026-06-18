import { useState } from 'react';
import { useExpenses } from './useExpenses';
import type { Expense } from './expenseTypes';

export function ExpenseList({ currencySymbol = '$' }: { currencySymbol?: string }) {
  const { expenses, loading, error, refresh, removeExpense } = useExpenses();
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const handleDelete = async (expense: Expense) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }
    setDeletingExpenseId(expense.id);
    const success = await removeExpense(expense.id);
    if (!success) {
      setDeletingExpenseId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (expenses.length === 0) {
    return <p className="empty">No expenses yet. Add your first expense above.</p>;
  }

  return (
    <div className="expense-list">
      <div className="list-header">
        <h2>Expenses</h2>
      </div>
      <table>
        <caption className="visually-hidden">Expenses</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense: Expense) => (
            <tr key={expense.id}>
              <td>{formatDate(expense.date)}</td>
              <td>{expense.categoryName}</td>
              <td className="amount">{formatAmount(expense.amount)}</td>
              <td>{expense.paymentMethod || '-'}</td>
              <td>{expense.note || '-'}</td>
              <td className="actions">
                <button
                  onClick={() => handleDelete(expense)}
                  disabled={deletingExpenseId === expense.id}
                  className="btn-delete"
                >
                  {deletingExpenseId === expense.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
