# Feature: Expense Creation

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

The Expense Creation feature allows users to record a new expense in the local-first Expense Tracker desktop application. Each expense includes an amount, date, category, optional note, and optional payment method. The feature covers the full path from the React + TypeScript form to the Tauri Rust command, persisting the expense into the local SQLite database via the `tauri-plugin-sql` plugin. After a successful save, the newly created expense must be available to the expense list screen.

This feature is part of the MVP defined in `PRD.md` and is one of the first user-visible capabilities after the first-launch currency setup and category management screens are available.

## User Story

As a user
I want to add a new expense with an amount, date, category, note, and payment method
So that I can record spending immediately and see it in my expense list.

## Problem Statement

The MVP requires that users be able to record personal expenses offline, with a simple, reliable input flow. Without an Expense Creation feature, the app has no core value and cannot demonstrate local persistence through SQLite. The creation flow must enforce minimal validation (amount > 0, valid date, category must exist) and return clear errors instead of raw stack traces.

## Solution Statement

Add a typed `create_expense` Tauri command on the Rust side that accepts a `CreateExpenseInput`, validates the input, ensures the referenced category exists, inserts the row into the `expenses` table, and returns the persisted `Expense`. On the frontend, add a `ExpenseForm` React component and an `expenseApi.ts` wrapper that invokes the command. The expense list screen refreshes by calling a new `list_expenses` Tauri command. SQLite is accessed through `tauri-plugin-sql` with a migration that creates the `categories` and `expenses` tables.

## Feature Metadata

- **Feature Type**: New Capability
- **Estimated Complexity**: Medium
- **Primary Systems Affected**:
  - React + TypeScript frontend (`src/`)
  - Tauri Rust backend (`src-tauri/`)
  - Local SQLite database
- **Dependencies**:
  - Tauri v2.x
  - `@tauri-apps/api`
  - `@tauri-apps/plugin-sql`
  - `tauri-plugin-sql` (with `sqlite` feature)
  - `serde`, `serde_json`
  - `uuid` (for stable IDs on the frontend or backend)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `PRD.md` (lines 71–83, 155–178, 221–230, 1085–1180) - Why: Defines the MVP scope, user story, payload shape, and data model for expenses. Source of truth for required fields and validation.
- `AGENTS.md` (lines 1–211) - Why: Captures project-wide conventions: local-first, Tauri command wrapper pattern, TypeScript types, minimal validation, clear error messages, and how validation commands will be run after the app is scaffolded.

Note: There is no existing source code in `src/` or `src-tauri/` yet. The application must be scaffolded as part of this plan (or in a preceding plan), and the files listed in **New Files to Create** below define the target shape.

### New Files to Create

- `src-tauri/src/db/mod.rs` - Database initialization, migration registration, and connection helper.
- `src-tauri/src/db/expenses.rs` - Expense SQL helpers (insert, list).
- `src-tauri/src/db/categories.rs` - Category SQL helpers (exists check).
- `src-tauri/src/commands/expenses.rs` - `create_expense` and `list_expenses` Tauri commands.
- `src-tauri/src/commands/mod.rs` - Command module wiring.
- `src-tauri/src/error.rs` - App error enum with `serde::Serialize`.
- `src-tauri/src/lib.rs` - Tauri builder with `tauri-plugin-sql` registered.
- `src-tauri/tauri.conf.json` - Plugins section enables `sql:default`, `sql:allow-execute`, `sql:allow-select`.
- `src-tauri/capabilities/default.json` - Add SQL plugin permissions.
- `src/features/expenses/expenseTypes.ts` - `Expense`, `CreateExpenseInput`, `ExpenseFormValues`.
- `src/features/expenses/expenseApi.ts` - Typed Tauri command wrappers.
- `src/features/expenses/ExpenseForm.tsx` - React form component.
- `src/features/expenses/ExpenseList.tsx` - React list that refreshes after save.
- `src/features/expenses/useExpenses.ts` - React hook for fetching expenses.
- `src/lib/validation/expense.ts` - Minimal validation helper.
- `src/main.tsx`, `src/App.tsx` - Wire up routes/screens.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tauri v2 - Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/)
  - Sections: Commands, Passing Arguments, Error Handling, Async Commands.
  - Why: Defines how to define `#[tauri::command]` functions, how to pass JSON args, how to serialize custom errors, and how to register commands with `tauri::generate_handler!`.
- [Tauri v2 - SQL Plugin](https://v2.tauri.app/plugin/sql/)
  - Sections: Setup, Usage, Syntax, Migrations, Permissions.
  - Why: Shows how to install `tauri-plugin-sql`, enable the `sqlite` feature, register migrations, and use `Database.load('sqlite:...')` from the frontend with `$N` parameter syntax.
- [Tauri v2 - Capabilities Overview](https://v2.tauri.app/security/capabilities/)
  - Why: Required for adding `sql:default`, `sql:allow-execute`, and `sql:allow-select` permissions to the default capability.
- [React - useState](https://react.dev/reference/react/useState)
  - Why: Used to manage form state and submit status.

### Patterns to Follow

**Naming Conventions**

- TypeScript:
  - `PascalCase` for types/interfaces (e.g., `Expense`, `CreateExpenseInput`).
  - `camelCase` for functions and variables (e.g., `createExpense`, `expenseFormValues`).
  - Tauri command names use `snake_case` (e.g., `create_expense`, `list_expenses`).
- Rust:
  - `snake_case` for modules and functions.
  - `PascalCase` for structs, enums, and traits.
  - Use `thiserror` for the app error type.

**Error Handling**

- Rust commands return `Result<T, AppError>` where `AppError` implements `serde::Serialize` (mirror the `ErrorKind` example from the Tauri docs).
- Frontend never sees raw stack traces; commands return human-readable error messages.
- Validation errors are returned with messages like `"Amount must be greater than zero."`, `"Date is required."`, `"Category is required."`.

**Layering**

- Frontend:
  - `expenseApi.ts` is the only place that calls `invoke('create_expense', ...)` and `invoke('list_expenses')`.
  - Components consume hooks (`useExpenses`) and validation utilities.
- Backend:
  - `commands/expenses.rs` is the boundary. It performs validation and calls `db/expenses.rs` for SQL.
  - `db/` modules are the only place that issues SQL strings.

**Other Relevant Patterns**

- Use `Database.load('sqlite:expense-tracker.db')` once at app startup and pass the connection via frontend state, OR re-load on demand per page. The plan uses a per-call load with a small cache to keep things simple for MVP.
- Use `crypto.randomUUID()` for new IDs on the frontend, or generate them on the backend with the `uuid` crate. The plan generates IDs on the backend to keep the contract simple.
- Use ISO date strings (`YYYY-MM-DD`) for the `date` field.
- Amount is stored as a SQLite `REAL`; the form enforces a positive number with up to two decimal places.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

- Scaffold the Tauri app if it is not already present: `npm create tauri-app@latest`, choose React + TypeScript, Vite, npm.
- Add the SQL plugin: `npm run tauri add sql` and enable the `sqlite` feature in `src-tauri/Cargo.toml`.
- Add `thiserror` and `uuid` to `src-tauri/Cargo.toml`.
- Update `src-tauri/capabilities/default.json` to allow `sql:default`, `sql:allow-execute`, `sql:allow-select`.
- Define the `AppError` enum and `serde::Serialize` implementation in `src-tauri/src/error.rs`.
- Create migration `v1_create_initial_tables.sql` (in code as a `Migration`) that creates:
  - `categories(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`
  - `expenses(id TEXT PRIMARY KEY, amount REAL NOT NULL, date TEXT NOT NULL, category_id TEXT NOT NULL, note TEXT, payment_method TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id))`
  - Index on `expenses(date)` and `expenses(category_id)`.
- Register the migration in `src-tauri/src/db/mod.rs` and load it via `add_migrations("sqlite:expense-tracker.db", migrations)` in `lib.rs`.

### Phase 2: Core Implementation

- Implement `commands/expenses.rs`:
  - `#[tauri::command] async fn create_expense(app: AppHandle, input: CreateExpenseInput) -> Result<Expense, AppError>`.
  - Validates `amount > 0`, non-empty `date`, non-empty `category_id`.
  - Calls `db::categories::exists(&app, &input.category_id)`. If not, returns `AppError::CategoryNotFound`.
  - Generates a UUID for the new expense id.
  - Inserts the row using `INSERT INTO expenses (id, amount, date, category_id, note, payment_method, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`.
  - Returns the new `Expense` with `id`, `created_at`, `updated_at`.
  - `#[tauri::command] async fn list_expenses(app: AppHandle) -> Result<Vec<Expense>, AppError>` returns all expenses joined with `categoryName` for display.
- Register both commands in `tauri::generate_handler![commands::expenses::create_expense, commands::expenses::list_expenses]`.
- Frontend types in `src/features/expenses/expenseTypes.ts`:
  - `Expense`, `CreateExpenseInput`, `ExpenseFormValues` matching the Rust payload shape.
- Frontend API in `src/features/expenses/expenseApi.ts`:
  - `createExpense(input: CreateExpenseInput): Promise<Expense>` and `listExpenses(): Promise<Expense[]>` using `invoke`.
- Frontend validation in `src/lib/validation/expense.ts` returning `string[]`.
- Frontend components in `src/features/expenses/ExpenseForm.tsx` and `src/features/expenses/ExpenseList.tsx`.
- Frontend hook `useExpenses` in `src/features/expenses/useExpenses.ts`:
  - Fetches expenses on mount and after a successful create.

### Phase 3: Integration

- Mount the `ExpenseForm` and `ExpenseList` in `src/App.tsx` after the first-launch setup screen.
- After a successful create, refresh the list and clear the form.
- Display the configured currency symbol from the `get_currency_settings` command next to the amount in the form and the list (out of scope for the present plan to implement, but the symbol should be passed in as a prop or read from a simple settings context).

### Phase 4: Testing & Validation

- Manual end-to-end test:
  - Launch the app, complete first-launch currency setup if not yet done.
  - Add a category (e.g., "Groceries") via the existing category management screen.
  - Add a new expense with amount `42.50`, today’s date, the new category, note, and payment method.
  - Verify the new expense appears in the list and persists after restarting the app.
- Validation tests:
  - Submit with amount `0` and confirm the error message.
  - Submit with no category and confirm the error message.
  - Submit with a non-existent category id and confirm `Category not found.` is returned.
- Database inspection:
  - Open `expense-tracker.db` (in the Tauri app config dir) with a SQLite browser and confirm the new row.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: SCAFFOLD tauri-app (only if `src-tauri/` and root `package.json` are missing)

- **IMPLEMENT**: Run `npm create tauri-app@latest .` in the repo root with React + TypeScript + Vite + npm. Accept default values except for the app name.
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

### Task 3: ADD dependencies for app error and id generation

- **IMPLEMENT**: `cd src-tauri && cargo add thiserror uuid --features uuid/v4`
- **PATTERN**: Use `thiserror` for ergonomic error enums, `uuid` for stable IDs.
- **IMPORTS**: `thiserror`, `uuid` (with `v4` feature).
- **GOTCHA**: `uuid` v4 feature must be enabled in `Cargo.toml`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 4: CREATE `src-tauri/src/error.rs`

- **IMPLEMENT**: Define `AppError` enum covering `Validation(String)`, `CategoryNotFound`, `Database(String)`, and a `#[serde(transparent)]` variant for other errors. Implement `serde::Serialize` so commands can return it.
- **PATTERN**: Mirror the custom error type shown in the Tauri v2 Calling Rust docs.
- **IMPORTS**: `serde::Serialize`, `thiserror::Error`.
- **GOTCHA**: All variants must serialize to a JSON value the frontend can render as a string.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 5: CREATE `src-tauri/src/db/mod.rs` with migrations

- **IMPLEMENT**: Provide `pub fn migrations() -> Vec<Migration>` returning a single migration that creates `categories` and `expenses` with the columns above. Add indexes on `expenses.date` and `expenses.category_id`.
- **PATTERN**: Follow the `Migration` struct from the SQL plugin docs.
- **IMPORTS**: `tauri_plugin_sql::{Migration, MigrationKind}`.
- **GOTCHA**: SQL is one string per migration; use `;` separators. Use `IF NOT EXISTS` to keep migrations idempotent.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 6: CREATE `src-tauri/src/db/expenses.rs` and `categories.rs`

- **IMPLEMENT**: In `categories.rs`, expose `pub async fn exists(app: &AppHandle, id: &str) -> Result<bool, AppError>`. In `expenses.rs`, expose `pub async fn insert(app: &AppHandle, expense: &NewExpense) -> Result<Expense, AppError>` and `pub async fn list_all(app: &AppHandle) -> Result<Vec<Expense>, AppError>`. Use `$1..$8` placeholders for SQLite.
- **PATTERN**: Use `tauri_plugin_sql::MigrationKind::Up`; the connection is obtained via the `Database` JS binding, so on the Rust side we only register migrations and rely on the frontend `Database.load` to apply them. For command-side queries, use the JS plugin from the frontend OR use `tauri::State` to hold a `sqlx::SqlitePool` if using direct sqlx. The plan uses the JS plugin and the backend commands call into a `tauri::State<Db>` that holds a `sqlx::SqlitePool` initialized in `lib.rs`. This requires the `sqlx` dependency in `Cargo.toml`.
- **IMPORTS**: `sqlx::{SqlitePool, Row}`, `tauri::AppHandle`, `crate::error::AppError`.
- **GOTCHA**: Decide once whether backend uses `tauri-plugin-sql` (frontend-only) or direct `sqlx` (Rust commands). The plan uses direct `sqlx` for backend commands so commands can run in Rust. Add `sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite"] }` to `Cargo.toml`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 7: CREATE `src-tauri/src/db/pool.rs` and wire pool in `lib.rs`

- **IMPLEMENT**: Add a function `pub async fn init_pool() -> Result<SqlitePool, sqlx::Error>` that opens `expense-tracker.db` in the app config dir and runs the same DDL. Manage it with `app.manage(Db(pool))`. Register the SQL plugin for frontend queries.
- **PATTERN**: Tauri v2 `manage` + `State` pattern.
- **IMPORTS**: `tauri::Manager`, `sqlx::SqlitePool`, `tauri_plugin_sql::Builder`.
- **GOTCHA**: Both the SQL plugin and `sqlx` will open the same file. Use a single owner (`sqlx`) for backend commands, and use the SQL plugin only for simple frontend reads if needed. The plan restricts SQL to Rust commands and does not require the SQL plugin permissions; if kept, set capabilities accordingly.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 8: CREATE `src-tauri/src/commands/expenses.rs`

- **IMPLEMENT**: Define `CreateExpenseInput`, `NewExpense`, and `Expense` structs with `#[derive(Serialize, Deserialize)]` and `#[serde(rename_all = "camelCase")]`. Implement `create_expense` and `list_expenses` commands that pull `tauri::State<Db>` and call into `db::*`. Validate inputs and return `Result<_, AppError>`.
- **PATTERN**: Mirror the Tauri v2 `my_custom_command` example with `Result<_, String>` semantics, but use `AppError` for richer errors.
- **IMPORTS**: `tauri::State`, `crate::db::Db`, `crate::error::AppError`, `uuid::Uuid`, `chrono::Utc` (or `time` crate).
- **GOTCHA**: Use `#[serde(rename_all = "camelCase")]` to align with the JavaScript payload keys.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 9: REGISTER commands in `lib.rs`

- **IMPLEMENT**: In `tauri::Builder`, call `.invoke_handler(tauri::generate_handler![commands::expenses::create_expense, commands::expenses::list_expenses])`. Use `.setup(|app| { ... })` to initialize the pool and manage it.
- **PATTERN**: Tauri v2 builder pattern.
- **IMPORTS**: `mod commands;`, `mod db;`.
- **GOTCHA**: Order of plugins matters; initialize the pool before any command runs by doing it in `setup`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 10: UPDATE capabilities

- **IMPLEMENT**: If the SQL plugin is kept, add `sql:default`, `sql:allow-execute`, `sql:allow-select` to `src-tauri/capabilities/default.json`. If the SQL plugin is removed, skip this task.
- **PATTERN**: Follow [Tauri v2 - Capabilities Overview](https://v2.tauri.app/security/capabilities/).
- **IMPORTS**: None.
- **GOTCHA**: Permissions are additive; missing a permission silently fails at runtime.
- **VALIDATE**: `cat src-tauri/capabilities/default.json`

### Task 11: CREATE `src/features/expenses/expenseTypes.ts`

- **IMPLEMENT**: Export `Expense`, `CreateExpenseInput`, and `ExpenseFormValues`. Use `camelCase` field names.
- **PATTERN**: Mirror Rust payload shape from Task 8.
- **IMPORTS**: None.
- **GOTCHA**: Optional fields must be `string | undefined`; do not use `null`.
- **VALIDATE**: `npx tsc --noEmit` (once `npm run typecheck` is configured).

### Task 12: CREATE `src/features/expenses/expenseApi.ts`

- **IMPLEMENT**: Export `createExpense(input)` and `listExpenses()` that call `invoke('create_expense', { input })` and `invoke('list_expenses')`.
- **PATTERN**: Follow [Tauri v2 - Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/#passing-arguments).
- **IMPORTS**: `import { invoke } from '@tauri-apps/api/core';`.
- **GOTCHA**: The argument key is `input`, matching the Rust parameter name.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 13: CREATE `src/lib/validation/expense.ts`

- **IMPLEMENT**: Export `validateExpenseInput(values: ExpenseFormValues): string[]` enforcing amount > 0, non-empty date, non-empty categoryId. Use the same messages as the PRD.
- **PATTERN**: Mirror the example in `PRD.md`.
- **IMPORTS**: None.
- **GOTCHA**: Amount may be a string from the form; coerce to number first.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 14: CREATE `src/features/expenses/ExpenseForm.tsx`

- **IMPLEMENT**: Controlled component with `useState` for amount, date, categoryId, note, paymentMethod. On submit: validate, call `createExpense`, refresh list, reset form. Display validation errors and command errors.
- **PATTERN**: React form with local state and clear error messages (per `AGENTS.md`).
- **IMPORTS**: React, `expenseApi`, `validateExpenseInput`, `ExpenseFormValues`, `Category` type.
- **GOTCHA**: Prevent default form submit; do not block the UI on submit.
- **VALIDATE**: `npm run build` if configured.

### Task 15: CREATE `src/features/expenses/useExpenses.ts`

- **IMPLEMENT**: Export `useExpenses()` hook returning `{ expenses, loading, error, refresh }`. `refresh` calls `listExpenses()`.
- **PATTERN**: Thin React hook around the API.
- **IMPORTS**: `useState`, `useCallback`, `useEffect`, `expenseApi`.
- **GOTCHA**: Cancel pending loads on unmount to avoid setting state on an unmounted component (use an `isMounted` ref or `AbortController`).
- **VALIDATE**: `npm run build` if configured.

### Task 16: CREATE `src/features/expenses/ExpenseList.tsx`

- **IMPLEMENT**: Use `useExpenses`. Render date, category name, amount (with currency symbol), payment method, and note. Show empty state if there are no expenses.
- **PATTERN**: Simple functional component, derived from the API hook.
- **IMPORTS**: `useExpenses`, currency symbol prop.
- **GOTCHA**: Display the amount with `toLocaleString` or simple `toFixed(2)`; do not assume decimals.
- **VALIDATE**: `npm run build` if configured.

### Task 17: WIRE components in `src/App.tsx`

- **IMPLEMENT**: If first-launch setup is not complete (check via existing `is_setup_complete` command), render the setup screen. Otherwise, render the expense screen with `ExpenseForm` and `ExpenseList`.
- **PATTERN**: Tabs/routes as a simple conditional; React Router can be added later.
- **IMPORTS**: `ExpenseForm`, `ExpenseList`, existing `is_setup_complete` and `get_currency_settings` wrappers.
- **GOTCHA**: The currency symbol should be fetched once and passed to the list and form.
- **VALIDATE**: `npm run build` if configured.

### Task 18: RUN dev build and manually verify

- **IMPLEMENT**: `npm run tauri dev`. Complete first-launch setup, create a category, submit a new expense, and confirm it appears in the list and persists after restart.
- **PATTERN**: Manual smoke test.
- **IMPORTS**: None.
- **GOTCHA**: Tauri dev builds open a separate window; ensure the dev server is running.
- **VALIDATE**: `npm run tauri build` to confirm the production build also works.

---

## TESTING STRATEGY

This MVP does not include automated test suites. Validation is performed via manual UI flows and the validation commands listed below. If tests are added later, follow the project conventions in `AGENTS.md`:

- Frontend tests would live near features in `src/**/*.test.ts(x)` using Vitest or Jest.
- Rust tests would live in `#[cfg(test)] mod tests` inside each module.

### Unit Tests

- Not in scope for this plan.

### Integration Tests

- Manual integration test: run the desktop app, add a category, add an expense, restart the app, confirm the expense is still present.
- Manual integration test: enter an invalid amount and confirm the validation message is shown.
- Manual integration test: delete the database file and confirm migrations re-run on next launch.

### Edge Cases

- Amount entered with extra decimals (e.g., `42.555`).
- Amount as a string in scientific notation (e.g., `1e2`).
- Date in the future.
- Date in the past.
- Category id that does not exist (direct API call).
- Concurrent submissions while a previous submission is in flight.
- Restarting the app during a save.
- Database file missing or locked by another process.

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Rust
cd src-tauri
cargo fmt --all
cargo clippy --all-targets -- -D warnings

# Frontend
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

Not in scope for this plan. The Tauri v2 WebDriver example can be wired in later:

- [Tauri v2 - WebDriver Overview](https://v2.tauri.app/develop/tests/webdriver/)

### Level 4: Manual Validation

```bash
# Start the dev build
npm run tauri dev

# In the app:
# 1. Complete first-launch currency setup with USD / $.
# 2. Create a category "Groceries".
# 3. Add a new expense: amount 42.50, today, Groceries, note "Weekly groceries", payment method "Card".
# 4. Confirm the expense appears in the list.
# 5. Close the app and reopen.
# 6. Confirm the expense is still present.

# Inspect the database
# The DB is at the Tauri app config dir, e.g.:
# macOS: ~/Library/Application Support/com.tauri.dev/expense-tracker.db
# Windows: %APPDATA%\com.tauri.dev\expense-tracker.db
# Linux: ~/.config/com.tauri.dev/expense-tracker.db
```

### Level 5: Additional Validation (Optional)

- Use the `agent-browser` skill (see `.agents/skills/agent-browser/SKILL.md`) to drive the app for screenshot validation.
- Use the `e2e-test` skill (see `.agents/skills/e2e-test/SKILL.md`) once automated E2E is set up.

---

## ACCEPTANCE CRITERIA

- [ ] A user can submit the Expense Creation form with a positive amount, a valid date, an existing category, an optional note, and an optional payment method.
- [ ] On success, the new expense is persisted to the local SQLite database.
- [ ] On success, the new expense appears in the expense list without a full app reload.
- [ ] On validation failure, the form displays specific, actionable error messages.
- [ ] On backend failure, the form displays the error message returned by the Tauri command, not a raw stack trace.
- [ ] Submitting an amount of `0` or a negative value shows `"Amount must be greater than zero."`.
- [ ] Submitting without a selected category shows `"Category is required."`.
- [ ] Submitting with a category id that does not exist returns `"Category not found."`.
- [ ] The expense persists across app restarts.
- [ ] `cargo check`, `cargo clippy`, `npm run lint` (if configured), `npm run typecheck` (if configured), and `npm run build` all succeed.
- [ ] The Tauri production build (`npm run tauri build`) succeeds on the target platform.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1–18).
- [ ] Each task validation passed immediately.
- [ ] All validation commands executed successfully.
- [ ] Manual test confirms the new expense is created and persisted.
- [ ] Validation errors display correctly.
- [ ] Category-not-found error is surfaced.
- [ ] No linting or type checking errors.
- [ ] Acceptance criteria all met.

---

## NOTES

- This plan assumes the Tauri app has not yet been scaffolded. If a scaffold already exists, skip Task 1 and adjust subsequent tasks to match the existing structure.
- The plan uses `sqlx` on the Rust side for backend commands and does not require the SQL plugin permissions. If the team prefers to use `tauri-plugin-sql` exclusively from the frontend, the backend commands can be removed and replaced with direct frontend calls using `Database.load('sqlite:...')`. The decision should be confirmed before implementation.
- The MVP does not require automated tests. If tests are added later, follow the patterns in `AGENTS.md`.
- Currency symbol display assumes the first-launch currency setup feature has already been completed. If not, the form should still function using a placeholder symbol.
- Keep the MVP tight: do not add sorting, filtering, or search in this plan.
