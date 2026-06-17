export function validateCategoryInput(values: CreateCategoryInput | UpdateCategoryInput): string[] {
  const errors: string[] = [];

  if (!values.name.trim()) {
    errors.push('Category name is required.');
  }

  if (values.name.trim().length > 50) {
    errors.push('Category name must be 50 characters or less.');
  }

  return errors;
}
