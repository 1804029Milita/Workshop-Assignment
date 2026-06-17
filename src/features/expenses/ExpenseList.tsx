import { useExpenses } from './useExpenses';
import type { Expense } from './expenseTypes';

export function ExpenseList({ currencySymbol = '$' }: { currencySymbol?: string }) {
  const { expenses, loading, error, refresh } = useExpenses();

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  />;
  >;
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
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Note</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
