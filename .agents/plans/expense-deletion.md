# Feature: Expense Deletion

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Expense Deletion allows users to permanently remove an incorrect or unwanted expense from the local-first Expense Tracker desktop application. The backend already exposes a `delete_expense` Tauri command that hard-deletes the row from SQLite. This feature wires the missing frontend path: typed command wrapper, React hook action, and delete button/confirmation in the expense list.

This is part of the MVP in `PRD.md`: users must be able to delete an expense by ID, have the row removed from SQLite, and see the expense disappear from the list. Soft delete is explicitly out of scope.

## User Story

As a user
I want to delete an unwanted expense
So that my expense list only shows records I want to keep.

## Problem Statement

The current backend can delete expenses, but the React frontend has no way for users to trigger deletion. Without this feature, users cannot correct mistaken entries through the UI, and the expense list cannot satisfy the PRD requirement to refresh after delete operations.

## Solution Statement

Implement frontend expense deletion only. Add `deleteExpense(id)` to `src/features/expenses/expenseApi.ts`, add `removeExpense(id)` to `src/features/expenses/useExpenses.ts`, and add an Actions column with a Delete button in `src/features/expenses/ExpenseList.tsx`. Mirror the existing category deletion pattern from `CategoryList.tsx` and `useCategories.ts`: confirm the destructive action with `window.confirm(...)`, call the Tauri command, clear the local item on success, and display backend error messages without raw stack traces.

## Feature Metadata

- **Feature Type**: Enhancement
- **Estimated Complexity**: Low
- **Primary Systems Affected**:
  - React + TypeScript expense list UI (`src/features/expenses/ExpenseList.tsx`)
  - Expense Tauri command wrapper (`src/features/expenses/expenseApi.ts`)
  - Expense React hook (`src/features/expenses/useExpenses.ts`)
  - Existing Tauri/Rust expense delete command and SQLite delete helper
- **Dependencies**:
  - Tauri v2.x
  - `@tauri-apps/api`
  - React 18.x
  - TypeScript 5.x
  - Existing Rust backend command `delete_expense`
  - Existing SQLite `expenses` table

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `PRD.md` (lines 480–491) - Why: Defines Expense Deletion MVP requirements: delete by ID, remove from SQLite, disappear from list, no soft delete.
- `PRD.md` (lines 501–503) - Why: Expense list must refresh after create, edit, and delete operations.
- `PRD.md` (lines 552–556) - Why: Delete errors must be shown to users without raw stack traces.
- `PRD.md` (lines 900–918) - Why: Documents the `delete_expense` command contract. Current backend returns `()`/`null`, not `{ success: true }`.
- `AGENTS.md` (lines 107–147) - Why: Establishes local-first architecture, frontend wrapper pattern, backend persistence ownership, and clear user-facing errors.
- `AGENTS.md` (lines 149–172) - Why: Defines validation expectations after implementation.
- `src/features/expenses/expenseApi.ts` (lines 1–18) - Why: Existing typed Tauri wrappers for create/list/update expenses and category list. Add `deleteExpense` here.
- `src/features/expenses/useExpenses.ts` (lines 1–65) - Why: Existing expense hook state/error/loading pattern and `addExpense`. Add `removeExpense` here.
- `src/features/expenses/ExpenseList.tsx` (lines 1–63) - Why: Existing expense list UI. Currently malformed at lines 15–19 and must be fixed before adding Delete UI.
- `src/features/categories/CategoryList.tsx` (lines 40–60) - Why: Existing Delete button pattern with `window.confirm(...)` and `removeCategory`.
- `src/features/categories/categoryApi.ts` (lines 16–18) - Why: Existing `deleteCategory(id): Promise<void>` wrapper pattern to mirror for `deleteExpense`.
- `src/features/categories/useCategories.ts` (lines 84–99) - Why: Existing `removeCategory` hook pattern: call API, filter local state, return boolean, catch errors.
- `src-tauri/src/commands/expenses.rs` (lines 108–110) - Why: Existing `delete_expense(db, id) -> Result<(), AppError>` command. No frontend wrapper exists yet.
- `src-tauri/src/db/expenses.rs` (lines 145–155) - Why: Existing hard-delete SQL and `Expense not found.` error. No schema/backend changes required.
- `src-tauri/src/lib.rs` (lines 18–30) - Why: `delete_expense` is already registered in `tauri::generate_handler!`.
- `src-tauri/src/error.rs` (lines 1–20) - Why: Backend errors serialize as user-readable strings, so frontend can display `err.message`.
- `package.json` (lines 6–11) - Why: Defines `typecheck`, `build`, `lint`, `dev`, and `tauri` scripts.
- `tsconfig.app.json` (lines 17–19) - Why: Strict TypeScript and unused-local/parameter checks affect imports and helper functions.
- `src/features/expenses/ExpenseForm.tsx` (lines 1, 19, 42–51) - Why: Existing form uses `useExpenses.addExpense`; current `React.ChangeEvent` usage may fail strict typecheck unless fixed.
- `src/features/expenses/expenseTypes.ts` (lines 1–43) - Why: Existing `Expense`, `CreateExpenseInput`, `UpdateExpenseInput`, and `ExpenseFormValues` types. No new delete input type is strictly required.
- `src/styles.css` (lines 20–29) - Why: Existing basic button styling. Optional delete button styling should stay lightweight.

### New Files to Create

None required for this feature.

Optional if desired:
- `src/features/expenses/ExpenseList.test.tsx` - Only if a test framework is added. No test framework currently exists, so do not add one unless explicitly requested.

### Files to Update

- `src/features/expenses/expenseApi.ts` - Add `deleteExpense(id: string): Promise<void>`.
- `src/features/expenses/useExpenses.ts` - Add `removeExpense(id: string): Promise<boolean>`.
- `src/features/expenses/ExpenseList.tsx` - Fix malformed JSX and add Delete UI.
- `src/styles.css` - Optional: add `.actions`, `.btn-delete`, `.btn-delete:disabled`, `.deleting` styles.
- `src/features/expenses/ExpenseForm.tsx` - Optional but recommended during validation: fix `React.ChangeEvent` import/type.
- `src/features/categories/CategoryList.tsx` - Optional but recommended during full build validation: add missing `useState` import.
- `src/features/expenses/expenseApi.ts` - Optional but recommended during full build validation: fix `listCategories` return type mismatch with `Category`.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tauri v2 - Calling Rust from the Frontend: Commands](https://v2.tauri.app/develop/calling-rust/#commands)
  - Why: Confirms `invoke('command_name')` returns a Promise and commands are registered through `tauri::generate_handler!`.
- [Tauri v2 - Calling Rust from the Frontend: Passing Arguments](https://v2.tauri.app/develop/calling-rust/#passing-arguments)
  - Why: `delete_expense` takes `id: String`; frontend should pass `{ id }` to `invoke`.
- [Tauri v2 - Calling Rust from the Frontend: Error Handling](https://v2.tauri.app/develop/calling-rust/#error-handling)
  - Why: Backend `Result<(), AppError>` rejects the Promise; frontend should catch and display `err.message`.
- [Tauri v2 - Calling Rust from the Frontend: Async Commands](https://v2.tauri.app/develop/calling-rust/#async-commands)
  - Why: Existing `delete_expense` is async, so the frontend wrapper must `await invoke(...)`.
- [React - useState](https://react.dev/reference/react/useState#setstate)
  - Why: If local state is updated imperatively, use functional updates like `setExpenses((prev) => prev.filter(...))`.
- [MDN - Window.confirm()](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm#return_value)
  - Why: `window.confirm(...)` returns `true` only when the user confirms; use it before destructive deletion.

### Patterns to Follow

**Naming Conventions**

- TypeScript types/interfaces: `PascalCase` (`Expense`, `CreateExpenseInput`, `UpdateExpenseInput`).
- TypeScript functions/variables: `camelCase` (`deleteExpense`, `removeExpense`, `expenseList`).
- Tauri command names: `snake_case` (`delete_expense`).
- React components: `PascalCase` (`ExpenseList`).
- CSS classes: kebab-case (`expense-list`, `btn-delete`, `actions`).

**Error Handling**

- `expenseApi.deleteExpense` should return `Promise<void>` and call:
  - `return invoke('delete_expense', { id });`
- `useExpenses.removeExpense` should return `Promise<boolean>` and catch errors with:
  - `err instanceof Error ? err.message : 'Failed to delete expense'`
- `ExpenseList` should display hook-level `error` through the existing error UI pattern.

**Layering**

- Frontend:
  - `expenseApi.ts` is the only file that calls `invoke('delete_expense', ...)`.
  - `ExpenseList.tsx` consumes `removeExpense` from `useExpenses`.
  - Components should not import `invoke` directly.
- Backend:
  - No backend changes are expected. `commands/expenses.rs` already delegates to `db/expenses.rs`.
  - No migration/schema change is expected.

**Other Relevant Patterns**

- Mirror category deletion:
  - `categoryApi.deleteCategory(id)` at `src/features/categories/categoryApi.ts:16`.
  - `useCategories.removeCategory(id)` at `src/features/categories/useCategories.ts:84`.
  - `CategoryList` confirmation/Delete button at `src/features/categories/CategoryList.tsx:50`.
- Use hard delete, not soft delete.
- Do not expose raw stack traces; display backend error strings.
- Do not add Redux, dialogs, or a new dependency for MVP deletion.
- If the PRD response example says `{ success: true }`, do not change the backend contract for this feature. Existing category deletion and the current Rust command return `()`/`null`; frontend should treat success as resolved Promise.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

- Confirm backend delete support exists and is registered.
- Fix current frontend blockers that prevent typecheck/build from running:
  - Malformed `ExpenseList.tsx` loading branch.
  - Strict TypeScript issues from missing imports/type mismatches.
- Decide deletion UI behavior: Delete button in the expense list with `window.confirm(...)`.

### Phase 2: Core Implementation

- Add typed frontend API wrapper:
  - `deleteExpense(id: string): Promise<void>`.
- Add hook action:
  - `removeExpense(id: string): Promise<boolean>`.
  - On success, filter the deleted expense from local state and return `true`.
  - On failure, set `error` and return `false`.
- Add list UI:
  - Add Actions column.
  - Add Delete button per expense.
  - Confirm before deletion.
  - Disable button while deletion is in progress.

### Phase 3: Integration

- Wire `removeExpense` into `ExpenseList`.
- Ensure the expense disappears immediately from the UI after backend success.
- Keep the existing list refresh/retry/error UI intact.
- Optionally add lightweight CSS for delete button states.

### Phase 4: Testing & Validation

- Run frontend typecheck/build after fixing blockers.
- Run Rust validation if the Rust toolchain is available.
- Manual test in Tauri dev mode:
  - Add category if needed.
  - Add an expense.
  - Delete the expense.
  - Confirm it disappears from the list.
  - Restart the app and confirm it does not reappear.
  - Attempt to delete a non-existent expense if possible and confirm a clear error message.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: VERIFY backend delete support

- **IMPLEMENT**: Confirm these files contain the expected existing backend delete support:
  - `src-tauri/src/commands/expenses.rs` has `delete_expense`.
  - `src-tauri/src/db/expenses.rs` has `delete`.
  - `src-tauri/src/lib.rs` registers `commands::expenses::delete_expense`.
- **PATTERN**: Existing backend command registration in `src-tauri/src/lib.rs:18-30`.
- **IMPORTS**: None.
- **GOTCHA**: Do not change backend code unless the command is missing or broken. The frontend-only plan assumes the command already works.
- **VALIDATE**: `Test-Path -LiteralPath "src-tauri/src/commands/expenses.rs" -And (Select-String -Path "src-tauri/src/commands/expenses.rs" -Pattern "delete_expense").Count -gt 0`

### Task 2: FIX existing `ExpenseList.tsx` syntax blocker

- **IMPLEMENT**: Remove the malformed loading JSX branch at `src/features/expenses/ExpenseList.tsx:15-19` so the file parses:
  - Keep the loading state behavior.
  - Do not add delete UI in this task yet.
- **PATTERN**: Mirror the clean loading branch in `src/features/categories/CategoryList.tsx:9-12`.
- **IMPORTS**: None for this task.
- **GOTCHA**: This file currently has stray `/>; >;` tokens. TypeScript will fail until this is fixed.
- **VALIDATE**: `npm run typecheck`

### Task 3: ADD `deleteExpense` wrapper to `src/features/expenses/expenseApi.ts`

- **IMPLEMENT**: Add:
  - `export async function deleteExpense(id: string): Promise<void> { return invoke('delete_expense', { id }); }`
- **PATTERN**: Mirror `deleteCategory(id: string): Promise<void>` in `src/features/categories/categoryApi.ts:16-18`.
- **IMPORTS**: No new imports if `invoke` is already imported.
- **GOTCHA**: Pass `{ id }`, not `{ input: { id } }`, because the Rust command parameter is named `id`.
- **VALIDATE**: `npm run typecheck`

### Task 4: ADD `removeExpense` to `src/features/expenses/useExpenses.ts`

- **IMPLEMENT**: Import `deleteExpense` and add a `useCallback` hook action:
  - Clear `error`.
  - Await `deleteExpense(id)`.
  - On success, filter the deleted expense from `expenses`.
  - Return `true`.
  - On error, set `error` to a user-readable message and return `false`.
- **PATTERN**: Mirror `removeCategory` in `src/features/categories/useCategories.ts:84-99`.
- **IMPORTS**:
  - `deleteExpense` from `./expenseApi`
  - Keep existing `useState`, `useCallback`, `useEffect`, `useRef` imports.
- **GOTCHA**: Use functional state updates (`setExpenses((prev) => prev.filter(...))`) to avoid stale-state bugs under React Strict Mode.
- **VALIDATE**: `npm run typecheck`

### Task 5: ADD delete UI to `src/features/expenses/ExpenseList.tsx`

- **IMPLEMENT**:
  - Destructure `removeExpense` from `useExpenses`.
  - Add optional `deletingExpenseId` state if buttons should be disabled during deletion.
  - Add an Actions column in the table header.
  - Add an Actions cell in each expense row.
  - Add a Delete button with class `btn-delete`.
  - Confirm with: `window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')`.
  - Call `await removeExpense(expense.id)`.
  - If the hook returns `true`, clear the local deleting state if used.
- **PATTERN**: Mirror the Delete button flow in `src/features/categories/CategoryList.tsx:44-59`.
- **IMPORTS**:
  - Existing `useExpenses`.
  - If using local deleting state, import `useState` from `react`.
  - Existing `Expense` type.
- **GOTCHA**: Do not import `invoke` into `ExpenseList.tsx`; deletion must go through `useExpenses.removeExpense`.
- **VALIDATE**: `npm run typecheck`

### Task 6: OPTIONAL ADD lightweight delete styles

- **IMPLEMENT**: If the UI needs visual polish, add small styles to `src/styles.css`:
  - `.actions`
  - `.btn-delete`
  - `.btn-delete:disabled`
  - `.deleting` or `.loading`
- **PATTERN**: Keep styling lightweight and consistent with existing `button`, `input`, `select` styles in `src/styles.css:20-29`.
- **IMPORTS**: None.
- **GOTCHA**: Do not add a UI component library or extra dependencies for this MVP feature.
- **VALIDATE**: `npm run build`

### Task 7: FIX full-build frontend blockers discovered during validation

- **IMPLEMENT**: Address any strict TypeScript issues that prevent the deletion feature from building:
  - `ExpenseForm.tsx`: replace `React.ChangeEvent<...>` with a typed `ChangeEvent<...>` import or import `React` if not using `react-jsx` semantics.
  - `CategoryList.tsx`: add missing `useState` import if full build includes it.
  - `expenseApi.ts`: fix `listCategories` return type so it matches `Category` used by `useExpenses`.
- **PATTERN**: Follow strict TypeScript conventions in `tsconfig.app.json:17-19`.
- **IMPORTS**:
  - `ChangeEvent` from `react` for form event types if needed.
  - `useState` from `react` in `CategoryList.tsx` if needed.
  - `Category` from `../categories/categoryTypes` or align local type if needed.
- **GOTCHA**: These are not deletion-specific, but they block validation and should be fixed in the same implementation pass if encountered.
- **VALIDATE**: `npm run typecheck`

### Task 8: RUN full validation

- **IMPLEMENT**: Run the available frontend validation commands and Rust validation if the Rust toolchain is installed.
- **PATTERN**: Follow `AGENTS.md` validation guidance at lines 159–172.
- **IMPORTS**: None.
- **GOTCHA**: In this planning environment, `cargo` is not installed. If `cargo` is unavailable during execution, document the blocker and run all available frontend checks instead.
- **VALIDATE**:
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint`
  - `cd src-tauri; cargo check`

### Task 9: MANUAL TAURI VALIDATION

- **IMPLEMENT**: Start the app and manually verify the deletion flow.
- **PATTERN**: Manual validation should cover the PRD requirement that deleted expenses disappear from SQLite and the UI.
- **IMPORTS**: None.
- **GOTCHA**: If categories are not yet fully integrated, create at least one category first so an expense can be added.
- **VALIDATE**:
  - `npm run tauri dev`
  - Manual steps:
    1. Add or select a category.
    2. Add an expense.
    3. Confirm the expense appears in the list.
    4. Click Delete for that expense.
    5. Confirm the browser/Tauri confirmation dialog.
    6. Verify the row disappears from the UI.
    7. Restart the app.
    8. Verify the deleted expense does not reappear.

---

## TESTING STRATEGY

### Unit Tests

No unit test framework is currently configured. Do not add Vitest/Jest solely for this feature unless explicitly requested. If tests already exist by implementation time, add a small component/hook test for:

- `removeExpense(id)` filters the deleted expense after `deleteExpense` resolves.
- `removeExpense(id)` keeps the previous state and surfaces an error when `deleteExpense` rejects.

### Integration Tests

No integration test harness currently exists. The primary integration validation is manual Tauri dev testing:

- Frontend Delete button calls `removeExpense`.
- `removeExpense` calls `delete_expense` through `expenseApi`.
- Rust command deletes the row from SQLite.
- UI state removes the deleted expense.
- Restart confirms persistence.

### Edge Cases

- User cancels the confirmation dialog: no backend call, no state change.
- User confirms deletion: backend deletes row and UI removes item.
- Expense already deleted or ID not found: display `Expense not found.` and keep UI unchanged.
- Backend/database error: display a clear error and keep UI unchanged.
- Multiple Delete clicks: avoid duplicate calls by disabling the button while deletion is in progress if local deleting state is used.
- Empty expense list: Delete UI should not render because there are no rows.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

- `npm run typecheck`
- `npm run build`
- `npm run lint`

### Level 2: Unit Tests

- No configured command exists yet.
- If a test framework is added later, use the project-defined test script, for example:
  - `npm test -- --run`

### Level 3: Integration Tests

- No automated integration harness exists yet.
- Manual Tauri validation:
  - `npm run tauri dev`

### Level 4: Manual Validation

1. Launch app: `npm run tauri dev`
2. Ensure at least one category exists.
3. Add an expense.
4. Verify the expense appears in `ExpenseList`.
5. Click Delete for that expense.
6. Confirm the confirmation dialog.
7. Verify the expense disappears from the list immediately.
8. Restart the app.
9. Verify the deleted expense does not reappear.
10. Attempt to delete a stale/non-existent expense if possible and verify a clear error message is shown.

### Level 5: Additional Validation (Optional)

- `cd src-tauri; cargo check`
- `cd src-tauri; cargo fmt --all -- --check`
- `cd src-tauri; cargo clippy --all-targets -- -D warnings`
- `npm run tauri build`

---

## ACCEPTANCE CRITERIA

- [ ] Expense deletion is implemented through the existing `delete_expense` Tauri command.
- [ ] `expenseApi.ts` remains the only frontend file that calls `invoke('delete_expense', ...)`.
- [ ] `useExpenses` exposes `removeExpense(id)` and returns a boolean success/failure result.
- [ ] `ExpenseList` includes an Actions column and Delete button for each expense.
- [ ] Delete action is guarded by `window.confirm(...)`.
- [ ] Confirmed deletion removes the expense from the UI.
- [ ] Backend errors are displayed as user-readable messages.
- [ ] No soft delete is introduced.
- [ ] Existing create/edit/list behavior is not regressed.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes if ESLint is installed/configured.
- [ ] `cd src-tauri; cargo check` passes if Rust toolchain is available.
- [ ] Manual Tauri validation confirms deleted expenses do not reappear after restart.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order.
- [ ] Each task validation passed immediately.
- [ ] Existing backend delete support verified.
- [ ] Frontend API wrapper added.
- [ ] Hook action added.
- [ ] Expense list Delete UI added.
- [ ] Existing syntax/type blockers fixed.
- [ ] No unnecessary dependencies added.
- [ ] No backend/schema changes made unless command was missing.
- [ ] Manual deletion flow validated in Tauri dev mode.
- [ ] Full validation commands executed or blockers documented.
- [ ] Acceptance criteria all met.

---

## NOTES

- Backend expense deletion is already implemented, so this plan is intentionally frontend-focused.
- The current backend returns `()`/`null` for successful deletion even though the PRD response example says `{ success: true }`. Mirror the existing category deletion wrapper and treat a resolved Promise as success.
- `ExpenseList.tsx` currently has invalid JSX at lines 15–19. Fix that before adding the Delete button.
- Full validation may reveal existing issues outside this feature:
  - `ExpenseForm.tsx` uses `React.ChangeEvent` without importing `React`.
  - `CategoryList.tsx` uses `useState` without importing it.
  - `expenseApi.ts` `listCategories` return type is narrower than `Category`.
  - Dependencies are not installed in the current workspace and there is no `package-lock.json`.
  - No ESLint config file was found, so `npm run lint` may fail until configured.
- If `cargo` is unavailable in the execution environment, do not attempt to infer Rust errors. Document the missing toolchain and run available frontend checks.

Confidence Score: 8/10
