# Feature: Local SQLite Persistence

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Local SQLite Persistence is the foundation layer that gives the Expense Tracker desktop app reliable, local-only structured storage. It initializes a SQLite database file in the Tauri app config directory, applies a versioned migration to create the `settings`, `categories`, and `expenses` tables, and exposes a single `Db` state containing a `sqlx::SqlitePool` that the rest of the Rust backend uses for all queries. The frontend does not access SQLite directly; it calls typed Tauri commands that go through this layer.

This feature is the prerequisite for the First-Launch Currency Setup, Category Management, and Expense Creation features. It codifies the project’s local-first principle: no remote API, no network calls, and a single, well-defined persistence boundary.

## User Story

As a developer building the Expense Tracker
I want a single, well-typed local SQLite persistence layer with migrations and a connection pool
So that the rest of the app can store and read settings, categories, and expenses reliably without duplicating connection or migration logic.

## Problem Statement

Without a dedicated persistence layer, each feature would need to open its own SQLite connection, run its own DDL, and define its own error handling. This leads to duplicated boilerplate, inconsistent error messages, and a high risk of schema drift between features. The MVP also needs a clear, idempotent migration story so that the database can be created on first launch and upgraded safely in later versions.

## Solution Statement

Introduce a `db` module under `src-tauri/src/db/` that owns:

- A `Db` newtype wrapping a `sqlx::SqlitePool`.
- A single `init_pool` function that resolves the app config directory, opens `expense-tracker.db` with `create_if_missing`, and runs the initial migration.
- A `migrations` function returning `Vec<tauri_plugin_sql::Migration>` so the SQL plugin can also apply the same DDL if the frontend ever needs direct access.
- A small set of helpers in `db/settings.rs` (and later `db/categories.rs`, `db/expenses.rs`) that perform all SQL using parameter binding.

All Tauri commands take `tauri::State<Db>` and never open their own connections. A custom `AppError` enum with a `serde::Serialize` impl is used to return consistent error messages to the frontend.

## Feature Metadata

- **Feature Type**: New Capability
- **Estimated Complexity**: Medium
- **Primary Systems Affected**:
  - Tauri Rust backend (`src-tauri/`)
  - SQLite database file in the OS app config dir
  - Frontend indirectly (via Tauri commands)
- **Dependencies**:
  - Tauri v2.x
  - `sqlx` with `runtime-tokio` and `sqlite` features
  - `tauri-plugin-sql` for migration registration
  - `thiserror`, `serde`, `serde_json`
  - `chrono` for timestamps

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `PRD.md` (lines 71–120, 1085–1180) - Why: Defines the MVP scope, security model (local-only), data model (settings, categories, expenses), and acceptance criteria for persistence.
- `AGENTS.md` (lines 1–211) - Why: Captures project-wide conventions: local-first, Tauri command wrapper pattern, TypeScript types, minimal validation, clear error messages, and how validation commands will be run after the app is scaffolded.
- `.agents/plans/expense-creation.md` (entire file) - Why: Establishes the data model for categories and expenses, and the Tauri command registration pattern that this plan reuses and standardizes.
- `.agents/plans/first-launch-currency-setup.md` (entire file) - Why: Defines the `settings` table layout and the `is_setup_complete` / `save_currency_setup` / `get_currency_settings` commands that depend on this persistence layer.

Note: There is no existing source code in `src/` or `src-tauri/` yet. The application must be scaffolded as part of this plan (or in a preceding plan). The files listed in **New Files to Create** define the target shape, with overlaps with the other plans marked.

### New Files to Create

- `src-tauri/Cargo.toml` - Rust manifest with Tauri, sqlx, tauri-plugin-sql, thiserror, serde, chrono.
- `src-tauri/src/lib.rs` - Tauri builder that registers plugins and commands, manages `Db` state.
- `src-tauri/src/main.rs` - Entry point that calls `expense_tracker_lib::run()`.
- `src-tauri/src/error.rs` - `AppError` enum with `serde::Serialize` impl.
- `src-tauri/src/db/mod.rs` - `Db` newtype, `init_pool`, `migrations`.
- `src-tauri/src/db/settings.rs` - `get`, `set`, `is_complete`, `get_currency`, `save_currency` helpers.
- `src-tauri/src/db/categories.rs` - `exists`, `list`, `create`, `update`, `delete` helpers (used by later plans).
- `src-tauri/src/db/expenses.rs` - `insert`, `list_all`, `update`, `delete` helpers (used by later plans).
- `src-tauri/src/commands/mod.rs` - Re-exports command modules.
- `src-tauri/src/commands/settings.rs` - Tauri commands for setup status and currency settings.
- `src-tauri/src/commands/categories.rs` - Tauri commands for category management (out of scope for execution here, but defined for completeness).
- `src-tauri/src/commands/expenses.rs` - Tauri commands for expense CRUD (out of scope for execution here, but defined for completeness).
- `src-tauri/migrations/20260101000000_create_initial.sql` - DDL for `settings`, `categories`, `expenses` tables and indexes.
- `src-tauri/capabilities/default.json` - Default capability allowing the custom commands.
- `src-tauri/tauri.conf.json` - Tauri configuration referencing the Vite dev server and the plugin set.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tauri v2 - SQL Plugin](https://v2.tauri.app/plugin/sql/)
  - Sections: Setup, Migrations, Permissions.
  - Why: Shows how to register migrations, how `Migration` is structured, and how to enable the `sqlite` feature.
- [Tauri v2 - Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/)
  - Sections: Commands, Passing Arguments, Error Handling, Async Commands, Accessing Managed State.
  - Why: Shows how to take `tauri::State<Db>` in a command and how to serialize custom errors.
- [Tauri v2 - Capabilities Overview](https://v2.tauri.app/security/capabilities/)
  - Why: Required to allow the custom commands in the default capability.
- [sqlx - SQLite](https://docs.rs/sqlx/latest/sqlx/sqlite/index.html)
  - Sections: `SqlitePool`, `SqliteConnectOptions`, `query`/`query_as`.
  - Why: Shows how to open a SQLite database file with `create_if_missing` and how to run migrations with raw SQL.

### Patterns to Follow

**Naming Conventions**

- Rust: `snake_case` for modules and functions, `PascalCase` for structs/enums.
- Tauri commands: `snake_case` (e.g., `is_setup_complete`, `save_currency_setup`).
- SQL: `snake_case` for table and column names; primary keys are `id TEXT` (UUIDs).

**Error Handling**

- All backend code returns `Result<T, AppError>`.
- `AppError` is serialized to a JSON string for the frontend; no raw stack traces.
- Validation errors are constructed with `AppError::Validation("...")`.
- Database errors are wrapped with `AppError::Database("...")` or `AppError::Sqlx(sqlx::Error)`.

**Layering**

- The `db` module is the only place that issues SQL.
- The `commands` module is the only place that defines Tauri commands.
- The frontend never touches SQLite directly; it calls `invoke('command_name', ...)`.

**Migrations**

- Use a single SQL file in `src-tauri/migrations/` that creates all initial tables idempotently (`CREATE TABLE IF NOT EXISTS`).
- Use `tauri_plugin_sql::Migration` so the same DDL is registered with the SQL plugin.
- Also execute the same SQL via `sqlx::query` during `init_pool` so the backend is self-sufficient and does not require the SQL plugin at runtime.

**Other Relevant Patterns**

- Use `app.path().app_config_dir()` to resolve the database location; never hard-code a path.
- Use `SqliteConnectOptions::new().filename(&path).create_if_missing(true)` to open the pool.
- Use `chrono::Utc::now().to_rfc3339()` for timestamps stored as TEXT.
- Use parameterized queries (`$1`, `$2`, …) for all user input.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

- Add the `src-tauri/` directory with `Cargo.toml`, `tauri.conf.json`, and `capabilities/default.json`.
- Add the migration SQL file in `src-tauri/migrations/`.
- Add `error.rs` with the `AppError` enum and `Serialize` impl.
- Add `db/mod.rs` with the `Db` newtype, `init_pool`, and `migrations`.

### Phase 2: Core Implementation

- Add `db/settings.rs` with the `get`, `set`, `is_complete`, `get_currency`, and `save_currency` helpers.
- Add `db/categories.rs` and `db/expenses.rs` with the helpers required by the other plans (defined but not exercised in this plan).
- Add `commands/mod.rs` and the three command modules (`settings.rs`, `categories.rs`, `expenses.rs`).
- Wire everything in `lib.rs`:
  - Register `tauri_plugin_sql` with `add_migrations`.
  - In the `setup` hook, call `db::init_pool(&app).await?` and `app.manage(db)`.
  - Register all commands in `tauri::generate_handler!`.

### Phase 3: Integration

- The First-Launch Currency Setup and Expense Creation plans already define the frontend wrappers and React components that consume these commands.
- This plan does not add any frontend code; it only standardizes the backend they rely on.
- Confirm that the migration file is identical to the DDL run in `init_pool` to keep schema in sync.

### Phase 4: Testing & Validation

- Run `cargo check` and `cargo clippy` to validate the Rust code.
- Run `npm run tauri dev` (or `npm run build`) only after the app is scaffolded and the frontend code from the other plans is in place.
- Manual smoke test:
  - Delete the `expense-tracker.db` file (if present) and launch the app; confirm the database is recreated and the `settings`, `categories`, and `expenses` tables exist.
  - Complete the First-Launch Currency Setup and confirm the `settings` rows are written.
  - Create a category and an expense and confirm the corresponding rows exist.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: CREATE `src-tauri/Cargo.toml`

- **IMPLEMENT**: Add the Cargo manifest with Tauri v2, `tauri-plugin-sql` (sqlite feature), `sqlx` (runtime-tokio, sqlite), `thiserror`, `serde`, `serde_json`, `chrono`. Include a `[lib]` section with `crate-type = ["staticlib", "cdylib", "rlib"]` and name `expense_tracker_lib`.
- **PATTERN**: Tauri v2 default scaffold.
- **IMPORTS**: None.
- **GOTCHA**: Use the `sqlite` feature for `tauri-plugin-sql` so migrations can be registered.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 2: CREATE `src-tauri/migrations/20260101000000_create_initial.sql`

- **IMPLEMENT**: Create the `settings`, `categories`, and `expenses` tables with `CREATE TABLE IF NOT EXISTS`. Add indexes on `expenses.date` and `expenses.category_id`. Use `TEXT` for IDs, `REAL` for amounts, and `TEXT` for timestamps in RFC 3339.
- **PATTERN**: Single, idempotent migration used by both `tauri-plugin-sql` and `sqlx::query`.
- **IMPORTS**: None.
- **GOTCHA**: Use `IF NOT EXISTS` so the file is safe to run multiple times.
- **VALIDATE**: `cat src-tauri/migrations/20260101000000_create_initial.sql`

### Task 3: CREATE `src-tauri/src/error.rs`

- **IMPLEMENT**: Define `AppError` with `Validation(String)`, `Database(String)`, and `Sqlx(#[from] sqlx::Error)`. Implement `serde::Serialize` to return a JSON string.
- **PATTERN**: Mirror the Tauri v2 custom error type from the calling-rust docs.
- **IMPORTS**: `thiserror::Error`, `serde::{Serialize, Serializer}`.
- **GOTCHA**: All variants must serialize to a string the frontend can display.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 4: CREATE `src-tauri/src/db/mod.rs`

- **IMPLEMENT**: Define `pub struct Db(pub SqlitePool)`. Implement `init_pool(app: &AppHandle) -> Result<Db, AppError>` that resolves the app config dir, ensures it exists, opens `expense-tracker.db` with `create_if_missing`, and runs the migration SQL via `sqlx::query`. Implement `migrations() -> Vec<tauri_plugin_sql::Migration>` returning the same DDL.
- **PATTERN**: Tauri v2 `app.path().app_config_dir()` + `sqlx::sqlite::SqliteConnectOptions`.
- **IMPORTS**: `tauri::{AppHandle, Manager}`, `sqlx::sqlite::SqliteConnectOptions`, `sqlx::SqlitePool`, `tauri_plugin_sql::{Migration, MigrationKind}`.
- **GOTCHA**: The `app_config_dir` may not exist yet; create it with `std::fs::create_dir_all`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 5: CREATE `src-tauri/src/db/settings.rs`

- **IMPLEMENT**: Define `CurrencySettings` struct with `#[serde(rename_all = "camelCase")]`. Implement `get`, `set`, `is_complete`, `get_currency`, and `save_currency` helpers using `sqlx::query` with parameter binding and `chrono::Utc::now().to_rfc3339()` for timestamps.
- **PATTERN**: Parameterized queries; no string concatenation.
- **IMPORTS**: `sqlx::Row`, `chrono::Utc`, `serde::{Deserialize, Serialize}`.
- **GOTCHA**: Use `INSERT ... ON CONFLICT(key) DO UPDATE` for upserts.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 6: CREATE `src-tauri/src/db/categories.rs`

- **IMPLEMENT**: Provide `Category` struct and helpers `list`, `create`, `update`, `delete`, `exists`. Use parameterized SQL.
- **PATTERN**: Same style as `settings.rs`.
- **IMPORTS**: `sqlx::Row`, `uuid::Uuid`, `chrono::Utc`.
- **GOTCHA**: Category deletion must be blocked when expenses reference the category; expose a separate `count_by_category` helper for that check (used by commands).
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 7: CREATE `src-tauri/src/db/expenses.rs`

- **IMPLEMENT**: Provide `Expense` struct and helpers `insert`, `list_all`, `update`, `delete`. Use parameterized SQL.
- **PATTERN**: Same style as `settings.rs`.
- **IMPORTS**: `sqlx::Row`, `uuid::Uuid`, `chrono::Utc`.
- **GOTCHA**: Amounts are stored as `REAL`; the command layer must enforce `> 0`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 8: CREATE `src-tauri/src/commands/mod.rs`

- **IMPLEMENT**: Declare `pub mod settings; pub mod categories; pub mod expenses;`.
- **PATTERN**: Tauri command module wiring.
- **IMPORTS**: None.
- **GOTCHA**: Keep all command files in `pub` so they can be referenced in `tauri::generate_handler!`.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 9: CREATE `src-tauri/src/commands/settings.rs`

- **IMPLEMENT**: Define `is_setup_complete`, `save_currency_setup`, and `get_currency_settings` commands. Validate `currencyCode` (3 uppercase letters) and `currencySymbol` (1–4 chars). Return `Result<_, AppError>`.
- **PATTERN**: Mirror the Tauri v2 `my_custom_command` example with `Result<_, AppError>`.
- **IMPORTS**: `tauri::State`, `crate::db::Db`, `crate::db::settings`, `crate::error::AppError`.
- **GOTCHA**: `is_setup_complete` must not fail the app boot; wrap the call in a function that logs and returns `Ok(false)` on error.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 10: CREATE `src-tauri/src/commands/categories.rs` and `commands/expenses.rs`

- **IMPLEMENT**: Define the Tauri commands for category and expense management per the other plans. Commands should call into the `db` helpers and enforce minimal validation.
- **PATTERN**: Same as `commands/settings.rs`.
- **IMPORTS**: `tauri::State`, `crate::db::Db`, `crate::db::{categories, expenses}`, `crate::error::AppError`.
- **GOTCHA**: Category deletion must return `AppError::Validation("Category is in use by existing expenses.")` when `count_by_category` returns > 0.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 11: CREATE `src-tauri/src/lib.rs`

- **IMPLEMENT**: Define `pub fn run()` that builds the Tauri app, registers `tauri_plugin_sql` with `add_migrations`, manages `Db`, and registers all commands in `tauri::generate_handler!`. In the `setup` hook, call `db::init_pool(&app).await`.
- **PATTERN**: Tauri v2 builder pattern.
- **IMPORTS**: `tauri::Manager`, `tauri_plugin_sql::Builder`, `crate::db::{self, Db}`, `crate::commands`.
- **GOTCHA**: Order of plugin registration vs. `setup` does not matter for the SQL plugin, but `init_pool` must succeed before any command runs.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 12: CREATE `src-tauri/src/main.rs`

- **IMPLEMENT**: Call `expense_tracker_lib::run()`.
- **PATTERN**: Tauri v2 default entry point.
- **IMPORTS**: None.
- **GOTCHA**: Keep the `#![cfg_attr(...)]` attribute to suppress the console window on Windows release builds.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 13: CREATE `src-tauri/capabilities/default.json`

- **IMPLEMENT**: Allow `core:default` and the `app:default` permission set that includes the custom commands. If `tauri-plugin-sql` is used from the frontend, also add `sql:default`, `sql:allow-execute`, `sql:allow-select`.
- **PATTERN**: Tauri v2 default capability.
- **IMPORTS**: None.
- **GOTCHA**: Missing permissions cause silent runtime failures; verify the list.
- **VALIDATE**: `cat src-tauri/capabilities/default.json`

### Task 14: CREATE `src-tauri/tauri.conf.json`

- **IMPLEMENT**: Set `productName`, `version`, `identifier`, `build` (with `beforeDevCommand`, `beforeBuildCommand`, `devUrl`, `frontendDist`), `app.windows`, and `bundle.icon`. Leave `plugins` empty unless the SQL plugin is used from the frontend.
- **PATTERN**: Tauri v2 default config.
- **IMPORTS**: None.
- **GOTCHA**: `frontendDist` must point to the Vite build output (`../dist` if the frontend lives in the repo root).
- **VALIDATE**: `cat src-tauri/tauri.conf.json`

### Task 15: VERIFY build

- **IMPLEMENT**: Run `cd src-tauri && cargo check && cargo clippy --all-targets -- -D warnings`.
- **PATTERN**: Standard Rust validation.
- **IMPORTS**: None.
- **GOTCHA**: If `cargo` is not available, this step is skipped; the plan remains valid for a developer with Rust installed.
- **VALIDATE**: `cd src-tauri && cargo check`

---

## TESTING STRATEGY

This MVP does not include automated test suites. Validation is performed via manual UI flows and the validation commands listed below. If tests are added later, follow the project conventions in `AGENTS.md`.

### Unit Tests

- Not in scope for this plan. If added later, place `#[cfg(test)] mod tests` inside each `db` module using an in-memory SQLite database (`sqlite::memory:`).

### Integration Tests

- Manual integration test: delete the database file, launch the app, confirm the `settings`, `categories`, and `expenses` tables exist.
- Manual integration test: complete First-Launch Currency Setup, confirm the `settings` rows are written and `setup_complete` is `true`.
- Manual integration test: create a category and an expense, confirm the rows exist and foreign keys are respected.

### Edge Cases

- Database file is missing on first launch.
- Database file is present but the schema is older (out of scope for MVP, but the migration file should be idempotent).
- The app config directory is not writable.
- Two app instances try to open the same database file (SQLite locking).
- A command is called before `init_pool` completes (should be impossible because `setup` runs before the webview loads).

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
cd src-tauri
cargo fmt --all
cargo clippy --all-targets -- -D warnings
```

### Level 2: Unit Tests

Not in scope for this plan. If added later:

```bash
cd src-tauri
cargo test
```

### Level 3: Integration Tests

Not in scope for this plan. The Tauri v2 WebDriver example can be wired in later.

### Level 4: Manual Validation

```bash
# Start the dev build
npm run tauri dev

# In the app:
# 1. Complete First-Launch Currency Setup.
# 2. Create a category "Groceries".
# 3. Create an expense of 42.50 in that category.
# 4. Close and reopen the app; confirm data persists.

# Inspect the database
# The DB is at the Tauri app config dir, e.g.:
# macOS:   ~/Library/Application Support/com.expense.tracker/expense-tracker.db
# Windows: %APPDATA%\com.expense.tracker\expense-tracker.db
# Linux:   ~/.config/com.expense.tracker/expense-tracker.db
# Use any SQLite browser to confirm the tables and rows.
```

### Level 5: Additional Validation (Optional)

- Use the `agent-browser` skill (see `.agents/skills/agent-browser/SKILL.md`) to drive the app for screenshot validation.
- Use the `e2e-test` skill (see `.agents/skills/e2e-test/SKILL.md`) once automated E2E is set up.

---

## ACCEPTANCE CRITERIA

- [ ] On first launch, the app creates `expense-tracker.db` in the Tauri app config directory.
- [ ] The migration creates the `settings`, `categories`, and `expenses` tables with the columns and indexes defined in `PRD.md`.
- [ ] The migration is idempotent and can be re-run without errors.
- [ ] All Tauri commands for settings, categories, and expenses compile and are registered with `tauri::generate_handler!`.
- [ ] `cargo check` and `cargo clippy` succeed.
- [ ] The First-Launch Currency Setup feature can read and write to the `settings` table via the new commands.
- [ ] The Expense Creation feature can read and write to the `categories` and `expenses` tables via the new commands.
- [ ] The app boots without errors when the database file is missing.
- [ ] The app continues to function correctly across restarts.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1–15).
- [ ] Each task validation passed immediately.
- [ ] All validation commands executed successfully.
- [ ] Manual test confirms the database is created, tables exist, and CRUD works.
- [ ] No linting or type checking errors.
- [ ] Acceptance criteria all met.

---

## NOTES

- This plan assumes the Tauri app has not yet been scaffolded. If a scaffold already exists, skip the directory and `tauri.conf.json` creation steps and adjust the rest to match the existing structure.
- The plan uses `sqlx` on the Rust side and registers the same DDL with `tauri-plugin-sql` so the frontend could also access the database via `Database.load('sqlite:...')` in the future. The MVP does not require the frontend to do so.
- The `is_setup_complete` command must never fail the app boot; errors should be logged and `Ok(false)` returned.
- The `categories` and `expenses` helpers in `db/` are defined for completeness and reused by the other plans; their Tauri commands live in `commands/categories.rs` and `commands/expenses.rs`.
- Keep the MVP tight: do not add migrations beyond the initial schema, do not add multi-currency, and do not add backup/restore.
