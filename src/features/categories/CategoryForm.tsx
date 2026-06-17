import { useState, FormEvent } from 'react';
import { useCategories } from './useCategories';
import { validateCategoryInput } from '../../lib/validation/category';
import type { CreateCategoryInput, UpdateCategoryInput } from './categoryTypes';
import { addCategory, updateCategory } from './categoryApi';

interface CategoryFormProps {
  onSuccess?: () => void;
  initialData?: UpdateCategoryInput;
}

export function CategoryForm({ onSuccess, initialData }: CategoryFormProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState<CreateCategoryInput | UpdateCategoryInput>(
    initialData || { name: '' }
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { refresh } = useCategories();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors.length > 0) setErrors([]);
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateCategoryInput(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing) {
        await updateCategory(formData as UpdateCategoryInput);
      } else {
        await addCategory(formData as CreateCategoryInput);
      }
      refresh();
      onSuccess?.();
      setFormData({ name: '' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <h3>{isEditing ? 'Edit Category' : 'Add Category'}</h3>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => (
            <p key={i} className="error">{err}</p>
          ))}
        </div>
      )}

      {submitError && <p className="error submit-error">{submitError}</p>}

      <div className="form-group">
        <label htmlFor="name">Category Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter category name"
          disabled={submitting}
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => onSuccess?.()}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

