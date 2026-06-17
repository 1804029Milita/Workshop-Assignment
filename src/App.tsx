import { ExpenseForm } from './features/expenses/ExpenseForm';
import { ExpenseList } from './features/expenses/ExpenseList';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Tracker</h1>
      </header>
      <main className="app-main">
        <section className="expense-form-section">
          <ExpenseForm currencySymbol="$" />
        </section>
        <section className="expense-list-section">
          <ExpenseList currencySymbol="$" />
        </section>
      </main>
    </div>
  );
}

export default App;
