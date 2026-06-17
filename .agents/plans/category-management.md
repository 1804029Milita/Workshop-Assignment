# Feature: Category Management

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Category Management allows users to create, view, edit, and delete expense categories in the local-first Expense Tracker desktop application. Categories are used to organize expenses and provide a consistent way to classify spending. This feature is essential for the Expense Creation feature and provides a foundation for future reporting and analysis.

The Category Management feature is part of the MVP defined in `PRD.md` and is one of the first user-visible capabilities after the first-launch currency setup screen.

## User Story

As a user
I want to manage categories (create, edit, delete) to organize my expenses
So that I can categorize my spending consistently and easily filter expenses by category.

## Problem Statement

Without a dedicated Category Management feature, users would need to manually remember and re-enter categories for each expense, leading to inconsistent categorization and making expense analysis difficult. The MVP requires a simple, reliable way to define and manage categories that can be used across all expense tracking functionality.

## Solution Statement

Add typed Tauri commands on the Rust side for category CRUD operations (create, list, update, delete). Frontend components will provide a user interface for managing categories, with validation to ensure data integrity. Categories will be stored in the SQLite database using the existing `categories` table structure defined in the Local SQLite Persistence plan.

The Category Management feature will include:
- A category list view showing all existing categories
- A form for creating new categories
- Edit functionality for existing categories
- Safe deletion that prevents deleting categories in use by existing expenses
- Validation for category names (required, unique)

## Feature Metadata

- **Feature Type**: New Capability
- **Estimated Complexity**: Low/Medium
- **Primary Systems Affected**:
  - React + TypeScript frontend (`src/`)
  - Tauri Rust backend (`src-tauri/`)
  - Local SQLite database (existing `categories` table)
- **Dependencies**:
  - Tauri v2.x
  - `@tauri-apps/api`
  - `@tauri-apps/plugin-sql`
  - `tauri-plugin-sql` (with `sqlite` feature)
  - `serde`, `serde_json`
  - `thiserror`
  - `uuid` (for stable IDs)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `PRD.md` (lines 71–83, 155–178, 221–230, 1085–1180) - Why: Defines the MVP scope, user story for category management, and data model for categories.
- `AGENTS.md` (lines 1–211) - Why: Captures project-wide conventions: local-first, Tauri command wrapper pattern, TypeScript types, minimal validation, clear error messages.
- `.agents/plans/local-sqlite-persistence.md` (entire file) - Why: Defines the `categories` table schema and database initialization.
- `.agents/plans/expense-creation.md` (lines 1–100) - Why: Shows how categories are used in expense creation and validation patterns.

Note: There is no existing source code in `src/` or `src-tauri/` yet. The application must be scaffolded as part of this plan (or in a preceding plan). The files listed in **New Files to Create** below define the target shape, with overlaps from the other plans.

### New Files to Create

- `src-tauri/src/commands/categories.rs` - Tauri commands for category CRUD.
- `src-tauri/src/commands/mod.rs` - Command module wiring.
- `src-tauri/src/lib.rs` - Update to register category commands.
- `src/features/categories/categoryTypes.ts` - `Category`, `CreateCategoryInput`, `UpdateCategoryInput`.
- `src/features/categories/categoryApi.ts` - Typed Tauri command wrappers.
- `src/features/categories/useCategories.ts` - React hook for fetching and managing categories.
- `src/features/categories/CategoryForm.tsx` - React component for creating/editing categories.
- `src/features/categories/CategoryList.tsx` - React component for listing categories with delete functionality.
- `src/lib/validation/category.ts` - Validation helper for category names.
- `src/main.tsx`, `src/App.tsx` - Update to include category management routes/screens.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tauri v2 - Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/)
  - Sections: Commands, Passing Arguments, Error Handling, Async Commands.
  - Why: Defines how to define `#[tauri::command]` functions and register commands.
- [Tauri v2 - SQL Plugin](https://v2.tauri.app/plugin/sql/)
  - Sections: Setup, Migrations, Permissions.
  - Why: Shows how to use the SQL plugin for database access.
- [Tauri v2 - Capabilities Overview](https://v2.tauri.app/security/capabilities/)
  - Why: Required for adding command permissions.

### Patterns to Follow

**Naming Conventions**

- TypeScript:
  - `PascalCase` for types/interfaces (e.g., `Category`, `CreateCategoryInput`).
  - `camelCase` for functions and variables (e.g., `createCategory`, `categoryFormValues`).
  - Tauri command names use `snake_case` (e.g., `create_category`, `list_categories`).
- Rust:
  - `snake_case` for modules and functions.
  - `PascalCase` for structs, enums, and traits.
  - Use `thiserror` for the app error type.

**Error Handling**

- Rust commands return `Result<T, AppError>` where `AppError` implements `serde::Serialize`.
- Frontend never sees raw stack traces; commands return human-readable error messages.
- Validation errors are returned with messages like `"Category name is required."`, `"Category name is too long."`, `"Category already exists."`.

**Layering**

- Frontend:
  - `categoryApi.ts` is the only place that calls `invoke('create_category', ...)` and `invoke('list_categories')`.
  - Components consume hooks (`useCategories`) and validation utilities.
- Backend:
  - `commands/categories.rs` is the boundary. It performs validation and calls `db/categories.rs` for SQL.
  - `db/` modules are the only place that issues SQL.

**Other Relevant Patterns**

- Use `Database.load('sqlite:expense-tracker.db')` once at app startup and pass the connection via frontend state, OR re-load on demand per page. The plan uses a per-call load with a small cache to keep things simple for MVP.
- Use `crypto.randomUUID()` for new IDs on the frontend, or generate them on the backend with the `uuid` crate. The plan generates IDs on the backend to keep the contract simple.
- Prevent category deletion when expenses reference the category; recommended MVP behavior is to block deletion when a category is used by expenses.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

- Scaffold the Tauri app if it is not already present: `npm create tauri-app@latest`, choose React + TypeScript, Vite, npm.
- Add the SQL plugin: `npm run tauri add sql` and enable the `sqlite` feature in `src-tauri/Cargo.toml`.
- Add `thiserror` and `uuid` to `src-tauri/Cargo.toml`.
- Update `src-tauri/capabilities/default.json` to allow `sql:default`, `sql:allow-execute`, `sql:allow-select`.
- Define the `AppError` enum and `serde::Serialize` implementation in `src-tauri/src/error.rs`.
- Create migration `v1_create_initial_tables.sql` (in code as a `Migration`) that creates the `categories` table (already exists from previous plan) and `expenses` table (already exists). This plan does not need to create new tables.
- Register the migration in `src-tauri/src/db/mod.rs` and load it via `add_migrations("sqlite:expense-tracker.db", migrations)` in `lib.rs`.

### Phase 2: Core Implementation

- Implement `commands/categories.rs`:
  - `#[tauri::command] async fn create_category(app: AppHandle, input: CreateCategoryInput) -> Result<Category, AppError>`.
  - `#[tauri::command] async fn list_categories(app: AppHandle) -> Result<Vec<Category>, AppError>`.
  - `#[tauri::command] async fn update_category(app: AppHandle, input: UpdateCategoryInput) -> Result<Category, AppError>`.
  - `#[tauri::command] async fn delete_category(app: AppHandle, id: String) -> Result<(), AppError>`.
- Register category commands in `tauri::generate_handler!` in `lib.rs`.
- Frontend types in `src/features/categories/categoryTypes.ts`:
  - `Category`, `CreateCategoryInput`, `UpdateCategoryInput` matching the Rust payload shape.
- Frontend API in `src/features/categories/categoryApi.ts`:
  - `createCategory(input)`, `listCategories()` using `invoke`.
- Frontend validation in `src/lib/validation/category.ts`:
  - Name validation: required, max length (e.g., 50 chars), uniqueness check.
- React components:
  - `useCategories` hook returns `{ categories, loading, error, refresh }` and exposes `createCategory`, `updateCategory`, `deleteCategory` helpers.
  - `CategoryForm` component for creating/editing categories.
  `CategoryList` component for listing categories with delete functionality.

### Phase 3: Integration

- Mount the category management UI in `src/App.tsx` (maybe as a separate route or tab). For MVP, we can integrate it into the main app as a sidebar or separate page.
- After a successful category operation, refresh the category list.
- Display clear error messages for validation failures and command errors.
- Ensure category deletion is blocked when expenses reference the category, showing a clear message.

### Phase 4: Testing & Validation

- Manual end-to-end test:
  - Launch the app, complete first-launch currency setup if not yet done.
  - Navigate to category management.
  - Create a category (e.g., "Groceries").
  - Verify the category appears in the list.
  - Edit the category name.
  - Attempt to delete the category while an expense references it; confirm the error message.
  - Delete the category after removing associated expenses.
- Validation tests:
  - Submit empty category name and confirm validation error.
  - Submit duplicate category name and confirm error.
  - Submit category name that is too long and confirm error.
- Database inspection:
  - Open `expense-tracker.db` and confirm the `categories` table contains the new row.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: VERIFY or SCAFFOLD tauri-app (only if `src-tauri/` and root `package.json` are missing)

- **IMPLEMENT**: If not already present, follow the Expense Creation plan's Task 1 to scaffold the app.
- **PATTERN**: Mirror Tauri v2 default scaffold.
- **IMPORTS**: Node.js 18+, npm, Rust toolchain.
- **GOTCHA**: Running in a non-empty directory may prompt for confirmation. If the directory is non-empty, pass `--yes` or move the existing files out of the way first.
- **VALIDATE**: `ls src-tauri/Cargo.toml && ls package.json`

### Task 2: INSTALL tauri-plugin-sql with sqlite feature

- **IMPLEMENT**: From the repo root run `npm run tauri add sql`. Verify `src-tauri/Cargo.toml` includes `tauri-plugin-sql = { version = "2", features = ["sqlite"] }`. Install the JS binding: `npm install @tauri-apps/plugin-sql`.
- **PATTERN**: Follow [Tauri v2 - SQL Plugin Setup](https://v2.tauri.app/plugin/sql/#setup).
- **IMPORTS**: `tauri-plugin-sql`, `@tauri-apps/plugin-sql`.
- **GOTCHA**: The plugin's Rust crate requires Rust 1.77.2+. Ensure the toolchain is up to date with `rustup update`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task : ADD dependencies for app error and id generation

- **IMPLEMENT**: `cd src-tauri && cargo add thiserror uuid --features uuid/v4`
- **PATTERN**: Use `thiserror` for ergonomic error enums, `uuid` for stable IDs.
- **IMPORTS**: `thiserror`, `uuid` (with `v4` feature).
- **GOTCHA**: `uuid` v4 feature must be enabled in `Cargo.toml`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 3: CREATE `src-tauri/src/error.rs`

- **IMPLEMENT**: Define `AppError` enum covering `Validation(String)`, `CategoryNotFound`, `Database(String)`, and a `#[serde(transparent)]` variant for other errors. Implement `serde::Serialize` to return a JSON string.
- **PATTERN**: Mirror the custom error type shown in the Tauri v2 Calling Rust docs.
- **IMPORTS**: `serde::Serialize`, `thiserror::Error`.
- **GOTCHA**: All variants must serialize to a string the frontend can display.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 4: CREATE `src-tauri/src/db/mod.rs`

- **IMPLEMENT**: Provide `pub fn migrations() -> Vec<Migration>` returning a single migration that creates the `categories` table (if not already present). Use `IF NOT EXISTS` to keep migrations idempotent.
- **PATTERN**: Follow the `Migration` struct from the SQL plugin docs.
- **IMPORTS**: `tauri_plugin_sql::{Migration, MigrationKind}`.
- **GOTCHA**: SQL must be idempotent (`CREATE TABLE IF NOT EXISTS`).
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 5: CREATE `src-tauri/src/db/categories.rs`

- **IMPLEMENT**: Provide `Category` struct and helpers `list`, `create`, `update`, `delete`, `exists`. Use parameterized SQL.
- **PATTERN**: Same style as `settings.rs`.
- **IMPORTS**: `sqlx::Row`, `uuid::Uuid`, `chrono::Utc`.
- **GOTCHA**: Category deletion must be blocked when expenses reference the category; expose a separate `count_by_category` helper for that check.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task : CREATE `src-tauri/src/commands/mod.rs`

- **IMPLEMENT**: Declare `pub mod categories;`.
- **PATTERN**: Tauri command module wiring.
- **IMPORTS**: None.
- **GOTCHA**: Keep all command files in `pub` so they can be referenced in `tauri::generate_handler!`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 7: CREATE `src-tauri/src/commands/categories.rs`

- **IMPLEMENT**: Define `CreateCategoryInput`, `UpdateCategoryInput` structs with `#[derive(Deserialize)]` and `#[serde(rename_all = "camelCase")]`. Implement the four commands, validating input and calling into `db::categories`. Return `Result<_, AppError>`.
- **PATTERN**: Same as `commands/settings.rs`.
- **IMPORTS**: `tauri::State`, `crate::db::Db`, `crate::db::categories`, `crate::error::AppError`.
- **GOTCHA**: `create_category` should check for duplicate names (DB unique constraint will handle, but we can provide a nicer error).
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 8: REGISTER commands in `lib.rs`

- **IMPLEMENT**: Add `mod commands;` and `mod db;` if not already present. Register the category commands in `tauri::generate_handler!`.
- **PATTERN**: Tauri v2 builder pattern.

### Task 9: CREATE `src/features/categories/categoryTypes.ts`

- **IMPLEMENT**: Export `Category`, `CreateCategoryInput`, `UpdateCategoryInput` with `camelCase` keys.
- **PATTERN**: Mirror the Rust payload.
- **IMPORTS**: None.
- **GOTCHA**: Use `string` for fields; no enums for MVP.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 10: CREATE `src/features/categories/categoryApi.ts`

- **IMPLEMENT**: Export `createCategory`, `listCategories` wrapping `invoke`.
- **PATTERN**: Tauri command wrapper pattern.

### Task 11: CREATE `src/lib/validation/category.ts`

- **IMPLEMENT**: Export `validateCategoryInput(values): string[]` enforcing name required, max length, uniqueness.
- **PATTERN**: Mirror validation style from other plans.
- **IMPORTS**: None.
- **GOTCHA**: Name may be a string; check for empty and length.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 12: CREATE `src/features/categories/CategoryForm.tsx`

- **IMPLEMENT**: Controlled component with `useState` for name. On submit: validate, call `createCategory`, refresh list, reset form. Display validation errors and command errors.
- **PATTERN**: React form, clear error messages.
- **IMPORTS**: React, `categoryApi`, `validateCategoryInput`, `CreateCategoryInput`.
- **GOTCHA**: Prevent default form submit; do not block UI on submit.
- **VALIDATE**: `npm run build` if configured.

### Task 13: CREATE `src/features/categories/useCategories.ts`

- **IMPLEMENT**: Export `useCategories()` hook returning `{ categories, loading, error, refresh, createCategory, updateCategory, deleteCategory }`. The hook calls `listCategories` on mount and exposes helpers.
- **PATTERN**: Thin React hook around the API.
- **IMPORTS**: `useState`, `useCallback`, `useEffect`, `categoryApi`.
- **GOTCHA**: Guard against state updates after unmount.
- **VALIDATE**: `npm run build` if configured.

### Task 14: CREATE `src/features/categories/CategoryList.tsx`

- **IMPLEMENT**: Use `useCategories`. Render categories in a table/list with edit and delete buttons. Edit button opens `CategoryForm` in edit mode. Delete button shows confirmation and calls `deleteCategory`.
- **PATTERN**: Simple functional component, derived from the hook.
- **IMPORTS**: `useCategories`.
- **GOTCHA**: Prevent deletion when expenses reference the category; show error message.
- **VALIDATE**: `npm run build` if configured.

### Task 15: WIRE components in `src/App.tsx`

- **IMPLEMENT**: Add a navigation link or tab for category management. Render `<CategoryList>` and `<CategoryForm>` components.
- **PATTERN**: Simple routing; could use React Router later.
- **IMPORTS**: `CategoryList`, `CategoryForm`.
- **GOTCHA**: Keep UI simple; category management could be a separate page or sidebar.
- **VALIDATE**: `npm run build` if configured.

### Task 16: RUN dev build and manually verify

- **IMPLEMENT**: `npm run tauri dev`. Walk through the manual test cases in **Phase 4**.
- **PATTERN**: Manual smoke test.
- **IMPORTS**: None.
- **GOTCHA**: The first launch must show the setup screen even if the database file already exists but `setup_complete` is `false`.
- **VALIDATE**: `npm run tauri build` to confirm the production build also works.

---

## TESTING STRATEGY

This MVP does not include automated test suites. Validation is performed via manual UI flows and the validation commands listed below. If tests are added later, follow the project conventions in `AGENTS.md`.

### Unit Tests

- Not in scope for this plan. If added later, place `#[cfg(test)] mod tests` inside each `db` module using an in-memory SQLite database (`sqlite::memory:`).

### Integration Tests

- Manual integration test: first launch shows the setup screen; after completing setup, navigate to category management; create, edit, delete categories; verify persistence across restarts.
- Manual integration test: invalid input shows validation errors.
- Manual integration test: deleting a category that is referenced by expenses shows error and prevents deletion.

### Edge Cases

- Category name with only whitespace.
- Category name exceeding maximum length.
- Category name with special characters.
- Concurrent category creation attempts.
- Restarting the app during a category operation.
- Database file missing or locked.

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
# 1. Complete first-launch currency setup.
# 2. Navigate to category management.
# 3. Create a category "Groceries".
# 4. Verify the category appears in the list.
# 5. Edit the category name to "Food".
# 6. Attempt to delete the category while an expense references it; confirm error.
# 7. Delete the category after removing associated expenses.
# 8. Close and reopen the app; confirm categories persist.

# Inspect the database
# The DB is at the Tauri app config dir, e.g.:
# macOS:   ~/Library/Application Support/com.expense.tracker/expense-tracker.db
# Windows: %APPDATA%\com.expense.tracker\expense-tracker.db
# Linux:   ~/.config/com.expense.tracker/expense-tracker.db
# Use any SQLite browser to confirm the categories table.
```

### Level 5: Additional Validation (Optional)

- Use the `agent-browser` skill (see `.agents/skills/agent-browser/SKILL.md`) to drive the app for screenshot validation.
- Use the `e2e-test` skill (see `.agents/skills/e2e-test/SKILL.md`) once automated E2E is set up.

---

## ACCEPTANCE CRITERIA

- [ ] A user can create a new category with a valid name.
- [ ] A user can view all existing categories in a list.
- [ ] A user can edit an existing category name.
- [ ] A user can delete a category when it is not used by existing expenses.
- [ ] Deleting a category that is used by expenses shows a clear error message.
- [ ] Category names are validated (required, max length, uniqueness).
- [ ] Categories are persisted to the local SQLite database.
- [ ] `cargo check`, `cargo clippy`, `npm run lint` (if configured), `npm run typecheck` (if configured), and `npm run build` all succeed.
- [ ] The Tauri production build (`npm run tauri build`) succeeds on the target platform.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1–16).
- [ ] Each task validation passed immediately.
- [ ] All validation commands executed successfully.
- [ ] Manual test confirms category creation, editing, and deletion work.
- [ ] Validation errors display correctly.
- [ ] Category-not-found and category-in-use errors are surfaced.
- [ ] No linting or type checking errors.
- [ ] Acceptance criteria all met.

---

## NOTES

- This plan assumes the Tauri app has not yet been scaffolded. If a scaffold already exists, skip Task 1 and adjust subsequent tasks to match the existing structure.
- The plan reuses the database pool, error type, and command registration pattern from the previous plans. If those files are not yet present, this plan implicitly requires them to be created (in line with the Local SQLite Persistence plan).
- Category deletion validation is enforced via a `count_by_category` check in the `db/categories.rs` helper.
- Keep the MVP tight: do not add advanced features like category hierarchies, tags, or bulk operations.
