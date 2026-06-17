# Feature: Expense Editing

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

The Expense Editing feature allows users to modify existing expenses in the local-first Expense Tracker desktop application. Users can change any field of an existing expense including amount, date, category, note, and payment method. This feature complements the Expense Creation feature by providing a way to correct mistakes or update records as circumstances change.

This feature is part of the MVP defined in `PRD.md` and is essential for a complete expense tracking experience. It reuses the existing expense data model and validation patterns from the Expense Creation plan.

## User Story

As a user
I want to edit an existing expense
So that I can correct mistakes or update details as my information changes.

## Problem Statement

Without the ability to edit expenses, users have no way to correct data entry mistakes or update records when circumstances change. This would force users to delete and recreate expenses, losing the original data and creating a frustrating user experience. The MVP requires a simple, reliable way to edit existing expenses while maintaining data integrity.

## Solution Statement

Add a typed `update_expense` Tauri command on the Rust side that accepts an `UpdateExpenseInput` (including the expense ID and updated fields), validates the input, ensures the referenced category exists, updates the row in the `expenses` table, and returns the updated `Expense`. On the frontend, add an edit mode to the `ExpenseForm` component (or create a dedicated edit flow) and an `expenseApi.ts` wrapper that invokes the command. The expense list will refresh after a successful update.

The Expense Editing feature will include:
- An edit button in the expense list for each expense
- A pre-filled form with the current expense data
- The same validation rules as expense creation
- Real-time error feedback for invalid inputs
- Confirmation of successful updates
- Prevention of duplicate submissions during editing

## Feature Metadata

- **Feature Type**: Enhancement
- **Estimated Complexity**: Low/Medium
- **Primary Systems Affected**:
  - React + TypeScript frontend (`src/`)
  - Tauri Rust backend (`src-tauri/`)
  - Local SQLite database (existing `expenses` table)
- **Dependencies**:
  - Tauri v2.x
  - `@tauri-apps/api`
  - `tauri-plugin-sql` (with `sqlite` feature)
  - `serde`, `serde_json`
  - `sqlx` (already in use)
  - `thiserror` (already in use)
  - `uuid` (already in use)
  - `chrono` (already in use)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `PRD.md` (lines 71–83, 155–178, 221–230, 1085–1180) - Why: Defines the MVP scope, user story, payload shape, and data model for expenses.
- `AGENTS.md` (lines 1–211) - Why: Captures project-wide conventions: local-first, Tauri command wrapper pattern, TypeScript types, minimal validation, clear error messages.
- `.agents/plans/expense-creation.md` (entire file) - Why: Defines the existing expense creation pattern, including backend commands, frontend components, and validation logic.
- `src-tauri/src/commands/expenses.rs` (entire file) - Why: Contains the existing expense commands that will be extended with update functionality.
- `src-tauri/src/db/expenses.rs` (entire file) - Why: Contains the existing database helpers for expenses that will be extended with update functionality.
- `src/features/expenses/expenseTypes.ts` (entire file) - Why: Contains the TypeScript types that will be extended with `UpdateExpenseInput`.
- `src/features/expenses/expenseApi.ts` (entire file) - Why: Contains the API wrappers that will be extended with `updateExpense`.
- `src/features/expenses/ExpenseForm.tsx` (entire file) - Why: Contains the form component that will be extended to support edit mode.
- `src/features/expenses/ExpenseList.tsx` (entire file) - Why: Contains the list component that will be extended with edit functionality.
- `src/features/expenses/useExpenses.ts` (entire file) - Why: Contains the hook that will be extended with update functionality.

### New Files to Create

- `src-tauri/src/commands/expenses.rs` (UPDATE) - Add `update_expense` command.
- `src-tauri/src/db/expenses.rs` (UPDATE) - Add `update` helper function.
- `src-tauri/src/lib.rs` (UPDATE) - Register the `update_expense` command.
- `src/features/expenses/expenseTypes.ts` (UPDATE) - Add `UpdateExpenseInput` interface.
- `src/features/expenses/expenseApi.ts` (UPDATE) - Add `updateExpense` function.
- `src/features/expenses/ExpenseForm.tsx` (UPDATE) - Add edit mode support.
- `src/features/expenses/ExpenseList.tsx` (UPDATE) - Add edit button and edit flow.
- `src/features/expenses/useExpenses.ts` (UPDATE) - Add `updateExpense` hook function.
- `src/lib/validation/expense.ts` (UPDATE) - Update validation to handle edit mode.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tauri v2 - Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/)
  - Sections: Commands, Passing Arguments, Error Handling, Async Commands.
  - Why: Defines how to define `#[tauri::command]` functions and register commands.
- [Tauri v2 - SQL Plugin](https://v2.tauri.app/plugin/sql/)
  - Sections: Setup, Migrations, Permissions.
  - Why: Shows how to use the SQL plugin for database access.
- [Tauri v2 - Capabilities Overview](https://v2.tauri.app/security/capabilities/)
  - Why: Required for adding command permissions.
- [React - useState](https://react.dev/reference/react/useState)
  - Why: Used to manage form state and submit status.

### Patterns to Follow

**Naming Conventions**

- TypeScript:
  - `PascalCase` for types/interfaces (e.g., `Expense`, `UpdateExpenseInput`).
  - `camelCase` for functions and variables (e.g., `updateExpense`, `expenseFormValues`).
  - Tauri command names use `snake_case` (e.g., `update_expense`).
- Rust:
  - `snake_case` for modules and functions.
  - `PascalCase` for structs, enums, and traits.
  - Use `thiserror` for the app error type.

**Error Handling**

- Rust commands return `Result<T, AppError>` where `AppError` implements `serde::Serialize`.
- Frontend never sees raw stack traces; commands return human-readable error messages.
- Validation errors are returned with messages like `"Amount must be greater than zero."`, `"Date is required."`, `"Category is required."`, `"Expense not found."`.

**Layering**

- Frontend:
  - `expenseApi.ts` is the only place that calls `invoke('update_expense', ...)`.
  - Components consume hooks (`useExpenses`) and validation utilities.
- Backend:
  - `commands/expenses.rs` is the boundary. It performs validation and calls `db/expenses.rs` for SQL.
  - `db/` modules are the only place that issues SQL.

**Other Relevant Patterns**

- The `update_expense` command follows the same pattern as `create_expense` but accepts an additional `id` field.
- The frontend `useExpenses` hook will add an `updateExpense` function that calls the API and updates the local state.
- The `ExpenseForm` component will support both create and edit modes via a prop or conditional rendering.
- The `ExpenseList` will have an edit button for each expense that opens the form in edit mode.
- All existing patterns from the Expense Creation plan should be followed.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

- Verify that the Tauri app is scaffolded and the existing expense creation code is in place.
- The foundation is already established from the Expense Creation plan. No new files need to be created at this stage.
- The existing `expenses` table schema supports updates (no schema changes needed).

### Phase 2: Core Implementation

- Update `db/expenses.rs` to add the `update` function:
  - Accept the expense ID and updated fields
  - Use parameterized SQL to update the row
  - Return the updated `Expense` with `category_name` joined
  - Handle the case where the expense doesn't exist (return error)
- Update `commands/expenses.rs` to add the `update_expense` command:
  - Define `UpdateExpenseInput` struct with `id`, `amount`, `date`, `categoryId`, `note`, `paymentMethod`
  - Validate input (same rules as creation)
  - Verify the expense exists
  - Verify the category exists
  - Call `db::expenses::update`
  - Return the updated `Expense`
- Register the `update_expense` command in `lib.rs`
- Update `expenseTypes.ts` to add `UpdateExpenseInput` interface
- Update `expenseApi.ts` to add `updateExpense` function
- Update `useExpenses` hook to add `updateExpense` function
- Update `ExpenseForm` to support edit mode
- Update `ExpenseList` to add edit functionality

### Phase 3: Integration

- Wire the edit button in the expense list to open the form in edit mode
- After a successful update, refresh the list and close the edit form
- Display clear error messages for validation failures and command errors
- Ensure the currency symbol is consistently displayed in the form and list

### Phase 4: Testing & Validation

- Manual end-to-end test:
  - Launch the app and navigate to the expense list
  - Click the edit button on an existing expense
  - Modify the amount, date, category, note, and payment method
  - Submit the form and verify the updated expense appears in the list
  - Verify the changes persist after restarting the app
- Validation tests:
  - Submit with amount `0` and confirm the error message
  - Submit with no category and confirm the error message
  - Submit with a non-existent category id and confirm `Category not found.` is returned
  - Submit with a non-existent expense id and confirm `Expense not found.` is returned
- Database inspection:
  - Open `expense-tracker.db` and confirm the updated row

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: VERIFY existing code structure

- **IMPLEMENT**: Check that the following files exist and are properly set up:
  - `src-tauri/src/commands/expenses.rs`
  - `src-tauri/src/db/expenses.rs`
  - `src-tauri/src/lib.rs`
  - `src/features/expenses/expenseTypes.ts`
  - `src/features/expenses/expenseApi.ts`
  - `src/features/expenses/ExpenseForm.tsx`
  - `src/features/expenses/ExpenseList.tsx`
  - `src/features/expenses/useExpenses.ts`
  - `src/lib/validation/expense.ts`
- **PATTERN**: Mirror the existing structure from the Expense Creation plan.
- **IMPORTS**: None.
- **GOTCHA**: If any files are missing, refer to the Expense Creation plan for the expected content.
- **VALIDATE**: `ls src-tauri/src/commands/expenses.rs src-tauri/src/db/expenses.rs src/features/expenses/expenseApi.ts`

### Task 2: UPDATE `src-tauri/src/db/expenses.rs` to add `update` function

- **IMPLEMENT**: Add the `update` function that accepts the expense ID and updated fields, updates the row, and returns the updated `Expense`.
- **PATTERN**: Mirror the existing `insert` and `list_all` functions in the same file.
- **IMPORTS**: `sqlx::Row`, `chrono::Utc`, `uuid::Uuid` (already imported).
- **GOTCHA**: Ensure the SQL handles the `note` and `paymentMethod` fields correctly (they can be `None`). Use `Option<&str>` for these parameters.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 3: UPDATE `src-tauri/src/commands/expenses.rs` to add `update_expense` command

- **IMPLEMENT**: Add the `update_expense` command function. Define `UpdateExpenseInput` struct with appropriate fields and validation.
- **PATTERN**: Mirror the existing `create_expense` command in the same file.
- **IMPORTS**: `tauri::State`, `crate::db::Db`, `crate::db::expenses`, `crate::error::AppError` (already imported).
- **GOTCHA**: The command must take `State<Db>` as a parameter to access the database. Use `&*db` pattern when calling database functions.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 4: UPDATE `src-tauri/src/lib.rs` to register `update_expense` command

- **IMPLEMENT**: Add the `update_expense` command to the `tauri::generate_handler!` macro invocation.
- **PATTERN**: Mirror the existing command registration in the same file.
- **IMPORTS**: None.
- **GOTCHA**: Ensure the command path is correct (`commands::expenses::update_expense`).
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 5: UPDATE `src/features/expenses/expenseTypes.ts` to add `UpdateExpenseInput`

- **IMPLEMENT**: Add the `UpdateExpenseInput` interface with fields: `id`, `amount`, `date`, `categoryId`, `note?`, `paymentMethod?`.
- **PATTERN**: Mirror the existing `CreateExpenseInput` interface in the same file.
- **IMPORTS**: None.
- **GOTCHA**: Use `camelCase` for field names. The `id` field is required for updates.
- **VALIDATE**: `npm run typecheck` (if configured)

### Task 6: UPDATE `src/features/expenses/expenseApi.ts` to add `updateExpense` function

- **IMPLEMENT**: Add the `updateExpense` function that wraps `invoke('update_expense', { input })`.
- **PATTERN**: Mirror the existing `createExpense` function in the same file.
- **IMPORTS**: `invoke` (already imported), `Expense` and `UpdateExpenseInput` types.
- **GOTCHA**: The argument key is `input`, matching the Rust parameter name.
- **VALIDATE**: `npm run typecheck` (if configured)

### Task 7: UPDATE `src/features/expenses/useExpenses.ts` to add `updateExpense` hook

- **IMPLEMENT**: Add the `updateExpense` function to the hook. It should call the API and update the local state with the updated expense.
- **PATTERN**: Mirror the existing `addExpense` function in the same hook.
- **IMPORTS**: `useCallback` (already imported), `updateExpense` from `expenseApi`.
- **GOTCHA**: Update the local state by replacing the old expense with the updated one (filter by id). Handle errors and loading state.
- **VALIDATE**: `npm run typecheck` (if configured)

### Task 8: UPDATE `src/features/expenses/ExpenseForm.tsx` to support edit mode

- **IMPLEMENT**: Add an optional `expense` prop to the form. When provided, the form should be in edit mode (pre-filled with the expense data). Add a submit button that calls either `addExpense` or `updateExpense` based on whether `expense` is provided.
- **PATTERN**: Mirror the existing form structure but add conditional logic for edit mode.
- **IMPORTS**: `updateExpense` from `expenseApi`, `Expense` type from `expenseTypes`.
- **GOTCHA**: The form should handle both create and edit modes seamlessly. Use the `expense` prop to determine the mode.
- **VALIDATE**: `npm run build` (if configured)

### Task 9: UPDATE `src/features/expenses/ExpenseList.tsx` to add edit functionality

- **IMPLEMENT**: Add an edit button for each expense. When clicked, set the selected expense in the component state, which will open the `ExpenseForm` in edit mode. After successful update, close the form and refresh the list.
- **PATTERN**: Mirror the existing list structure but add state for the selected expense.
- **IMPORTS**: `useState` (already imported), `Expense` type, `ExpenseForm` component.
- **GOTCHA**: Ensure the form closes after a successful update. Handle the case where the form is in edit mode.
- **VALIDATE**: `npm run build` (if configured)

### Task 10: RUN dev build and manually verify

- **IMPLEMENT**: `npm run tauri dev`. Test the edit functionality end-to-end.
- **PATTERN**: Manual smoke test.
- **IMPORTS**: None.
- **GOTCHA**: Tauri dev builds open a separate window; ensure the dev server is running.
- **VALIDATE**: `npm run tauri build` to confirm the production build also works.

---

## TESTING STRATEGY

This MVP does not include automated test suites. Validation is performed via manual UI flows and the validation commands listed below. If tests are added later, follow the project conventions in `AGENTS.md`.

### Unit Tests

- Not in scope for this plan. If added later, place `#[cfg(test)] mod tests` inside each `db` module using an in-memory SQLite database (`sqlite::memory:`).

### Integration Tests

- Manual integration test: run the desktop app, create an expense, edit it, restart the app, confirm the changes persist.
- Manual integration test: enter invalid amount during edit and confirm the validation message is shown.
- Manual integration test: delete the database file and confirm migrations re-run on next launch.

### Edge Cases

- Editing an expense that no longer exists (should show error).
- Editing an expense with a category that was deleted (should show error).
- Editing an expense with the same values (should not change anything but should succeed).
- Editing an expense while another edit is in progress (should be prevented or handled gracefully).
- Editing an expense with a very large amount (should be handled correctly).
- Editing an expense with a date in the future or past.
- Editing an expense with a category that has been renamed.
- Restarting the app during an edit operation.
- Database file missing or locked by another process.

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
cd src-tauri
cargo fmt --all
cargo clippy --all-targets -- -D warnings

cd ..
npm run lint
```

If `npm run lint` is not configured, run `npx eslint .` or skip until configured per `AGENTS.md`.

### Level 2: Unit Tests

Not in scope for this plan. If added later:

```bash
cd src-tauri
cargo test

cd ..
npm run test
```

### Level 3: Integration Tests

Not in scope for this plan. The Tauri v2 WebDriver example can be wired in later.

### Level 4: Manual Validation

```bash
# Start the dev build
npm run tauri dev

# In the app:
# 1. Complete first-launch currency setup if not yet done.
# 2. Create a category "Groceries".
# 3. Add a new expense: amount 42.50, today, Groceries, note "Weekly groceries", payment method "Card".
# 4. Click the edit button on the expense.
# 5. Change the amount to 45.00 and the note to "Updated weekly groceries".
# 6. Submit the form.
# 7. Confirm the expense list shows the updated values.
# 8. Close and reopen the app.
# 9. Confirm the changes persist.

# Inspect the database
# The DB is at the Tauri app config dir, e.g.:
# macOS:   ~/Library/Application Support/com.expense.tracker/expense-tracker.db
# Windows: %APPDATA%\com.expense.tracker\expense-tracker.db
# Linux:   ~/.config/com.expense.tracker/expense-tracker.db
# Use any SQLite browser to confirm the updated row.
```

### Level 5: Additional Validation (Optional)

- Use the `agent-browser` skill (see `.agents/skills/agent-browser/SKILL.md`) to drive the app for screenshot validation.
- Use the `e2e-test` skill (see `.agents/skills/e2e-test/SKILL.md`) once automated E2E is set up.

---

## ACCEPTANCE CRITERIA

- [ ] A user can click an edit button on an existing expense in the list.
- [ ] The form opens pre-filled with the current expense data.
- [ ] A user can modify the amount, date, category, note, and payment method.
- [ ] On success, the updated expense is persisted to the local SQLite database.
- [ ] On success, the expense list shows the updated values without a full app reload.
- [ ] On validation failure, the form displays specific, actionable error messages.
- [ ] On backend failure, the form displays the error message returned by the Tauri command, not a raw stack trace.
- [ ] Submitting an amount of `0` or a negative value shows `"Amount must be greater than zero."`.
- [ ] Submitting without a selected category shows `"Category is required."`.
- [ ] Submitting with a category id that does not exist returns `"Category not found."`.
- [ ] Submitting with an expense id that does not exist returns `"Expense not found."`.
- [ ] The edited expense persists across app restarts.
- [ ] `cargo check`, `cargo clippy`, `npm run lint` (if configured), `npm run typecheck` (if configured), and `npm run build` all succeed.
- [ ] The Tauri production build (`npm run tauri build`) succeeds on the target platform.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1–10).
- [ ] Each task validation passed immediately.
- [ ] All validation commands executed successfully.
- [ ] Manual test confirms an expense can be edited and the changes persist.
- [ ] Validation errors display correctly during edit.
- [ ] Category-not-found and expense-not-found errors are surfaced.
- [ ] No linting or type checking errors.
- [ ] Acceptance criteria all met.

---

## NOTES

- This plan assumes the Tauri app has not yet been scaffolded. If a scaffold already exists, skip Task 1 and adjust subsequent tasks to match the existing structure.
- The plan reuses the database pool, error type, validation rules, and component structure from the Expense Creation plan.
- The `update_expense` command follows the same pattern as `create_expense` but accepts an additional `id` field.
- The frontend `useExpenses` hook will add an `updateExpense` function that calls the API and updates the local state.
- The `ExpenseForm` component will support both create and edit modes via a prop or conditional rendering.
- The `ExpenseList` will have an edit button for each expense that opens the form in edit mode.
- Keep the MVP tight: do not add advanced features like bulk edits, undo, or edit history.
- Ensure the currency symbol is consistently displayed in the form and list during edit.
