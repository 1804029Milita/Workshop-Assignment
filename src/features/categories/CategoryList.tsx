import { useCategories } from './useCategories';
import type { Category } from './categoryTypes';

export function CategoryList() {
  const { categories, loading, error, refresh, removeCategory } = useCategories();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="category-list">
      <div className="list-header">
        <h2>Categories</h2>
        <CategoryForm onSuccess={() => refresh()} />
      </div>

      {categories.length === 0 ? (
        <p className="empty">No categories yet. Add your first category above.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td className="actions">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
                        removeCategory(category.id);
                      }
                    }}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingCategory && (
        <div className="modal">
          <div className="modal-content">
            <CategoryForm
              initialData={editingCategory}
              onSuccess={() => setEditingCategory(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
