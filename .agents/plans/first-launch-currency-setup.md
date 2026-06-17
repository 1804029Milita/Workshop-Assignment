# Feature: First-Launch Currency Setup

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

The First-Launch Currency Setup feature presents a one-time configuration screen to new users of the local-first Expense Tracker desktop application. During the first launch of the app, the user is asked to choose a fixed currency (code and symbol). The choice is persisted in the local SQLite database and used by the rest of the app to display expense amounts consistently. Once completed, the setup screen is not shown again; subsequent launches go directly to the main app.

This feature is the first user-visible capability in the MVP defined in `PRD.md` and is a precondition for Expense Creation and Expense List, which both need to render amounts with the selected currency symbol.

## User Story

As a new user
I want to choose my fixed currency during first launch
So that all expenses are displayed consistently using my preferred currency.

## Problem Statement

The MVP requires a single, fixed currency per installation. Without a first-launch setup, the app has no agreed currency code or symbol to display amounts with, and the UX would be inconsistent. The setup must be enforced once, persist across restarts, and never block the user from completing it (clear validation, recoverable errors).

## Solution Statement

Add three Tauri commands on the Rust side:

- `is_setup_complete` returns `true` once the `settings` table contains a `setup_complete` flag set to `true`.
- `save_currency_setup` accepts `{ currencyCode, currencySymbol }`, validates both fields, upserts the `settings` rows, and sets `setup_complete = true`.
- `get_currency_settings` returns `{ currencyCode, currencySymbol }` for the rest of the app to consume.

The settings table is created by a new migration that runs alongside the `categories` and `expenses` tables (or is added first if those are not yet present). The React frontend adds a `CurrencySetup` screen, a `useSettings` hook, and a `settingsApi` wrapper. `App.tsx` shows the `CurrencySetup` screen until `is_setup_complete` returns `true`, and then renders the main app shell.

## Feature Metadata

- **Feature Type**: New Capability
- **Estimated Complexity**: Low/Medium
- **Primary Systems Affected**:
  - React + TypeScript frontend (`src/`)
  - Tauri Rust backend (`src-tauri/`)
  - Local SQLite database (new `settings` table)
- **Dependencies**:
  - Tauri v2.x
  - `@tauri-apps/api`
  - `tauri-plugin-sql` (for migrations) and `sqlx` (for backend commands) - or a single `tauri-plugin-sql` approach if the team prefers
  - `serde`, `serde_json`, `thiserror`
  - `chrono` or `time` for the timestamp of the setup record

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `PRD.md` (lines 71–83, 154–165, 1085–1180) - Why: Defines the MVP scope, the user story for first-launch setup, the required payload shape, and the MVP data model (settings table).
- `AGENTS.md` (lines 1–211) - Why: Captures project-wide conventions: local-first, Tauri command wrapper pattern, TypeScript types, minimal validation, clear error messages, and how validation commands will be run after the app is scaffolded.
- `.agents/plans/expense-creation.md` (entire file) - Why: Establishes the shared Rust/TS plumbing (database pool, error type, command registration). The Currency Setup plan reuses and extends that plumbing rather than redefining it.

Note: There is no existing source code in `src/` or `src-tauri/` yet. The application must be scaffolded as part of this plan (or in a preceding plan). The files listed in **New Files to Create** define the target shape, with overlaps marked.

### New Files to Create

- `src-tauri/src/db/settings.rs` - `Settings` row helpers: `get(app) -> Result<Option<Settings>, AppError>`, `save(app, settings) -> Result<(), AppError>`, `is_complete(app) -> Result<bool, AppError>`.
- `src-tauri/src/commands/settings.rs` - `is_setup_complete`, `save_currency_setup`, `get_currency_settings` Tauri commands.
- `src-tauri/src/db/mod.rs` - Update to include the `settings` table in the initial migration.
- `src-tauri/src/lib.rs` - Update to register the new settings commands.
- `src/features/settings/settingsTypes.ts` - `CurrencySettings`, `SaveCurrencySetupInput`.
- `src/features/settings/settingsApi.ts` - Typed Tauri command wrappers.
- `src/features/settings/useSettings.ts` - React hook for reading the current currency.
- `src/features/settings/CurrencySetup.tsx` - React component for the one-time setup screen.
- `src/lib/validation/currency.ts` - Validation helper for currency code and symbol.
- `src/App.tsx` - Update to gate the main app behind `is_setup_complete`.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tauri v2 - Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/)
  - Sections: Commands, Passing Arguments, Error Handling, Async Commands.
  - Why: Defines how to define `#[tauri::command]` functions, pass JSON args, serialize custom errors, and register commands.
- [Tauri v2 - SQL Plugin](https://v2.tauri.app/plugin/sql/)
  - Sections: Setup, Migrations, Permissions.
  - Why: Shows how to register migrations and (optionally) use the plugin from the frontend.
- [Tauri v2 - Capabilities Overview](https://v2.tauri.app/security/capabilities/)
  - Why: Required if the SQL plugin is used from the frontend; otherwise the default capability is sufficient.
- [React - useState](https://react.dev/reference/react/useState)
  - Why: Used to manage the setup form state.

### Patterns to Follow

**Naming Conventions**

- TypeScript: `PascalCase` for types, `camelCase` for functions and variables, Tauri command names `snake_case` (e.g., `is_setup_complete`, `save_currency_setup`).
- Rust: `snake_case` for modules and functions, `PascalCase` for structs/enums.

**Error Handling**

- Commands return `Result<T, AppError>` (the same `AppError` defined in the Expense Creation plan).
- Validation errors are returned with messages like `"Currency code is required."`, `"Currency symbol is required."`, `"Currency code must be 3 letters."`.

**Layering**

- Frontend: `settingsApi.ts` is the only place that calls `invoke('is_setup_complete', ...)`, `invoke('save_currency_setup', ...)`, and `invoke('get_currency_settings')`.
- Backend: `commands/settings.rs` validates inputs and calls `db/settings.rs` for SQL.

**Other Relevant Patterns**

- Persist `setup_complete` as a separate row in the `settings` table (e.g., `key = 'setup_complete'`, `value = 'true'`), consistent with the PRD's settings table description.
- Use ISO timestamp (`YYYY-MM-DDTHH:MM:SSZ`) for the `updated_at` value of currency settings.
- The setup screen must be the only screen shown until `is_setup_complete` resolves to `true`.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

- Confirm or perform the Tauri app scaffold (see the Expense Creation plan, Task 1).
- Confirm `tauri-plugin-sql`, `sqlx` (sqlite), `thiserror`, `serde`, `uuid`, and `chrono`/`time` are in `Cargo.toml`.
- Add a migration that creates the `settings` table:
  - `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`
- If the `categories` and `expenses` tables do not yet exist, add them in the same migration to keep schema simple (the MVP does not yet require a full migration system).
- Register the migration via `tauri_plugin_sql::Builder::default().add_migrations("sqlite:expense-tracker.db", migrations).build()`.
- Manage a `sqlx::SqlitePool` in Tauri state, initialized in the `setup` hook (same pattern as the Expense Creation plan).

### Phase 2: Core Implementation

- Implement `commands/settings.rs`:
  - `#[tauri::command] async fn is_setup_complete(state: State<Db>) -> Result<bool, AppError>`.
  - `#[tauri::command] async fn save_currency_setup(state: State<Db>, input: SaveCurrencySetupInput) -> Result<CurrencySettings, AppError>`.
  - `#[tauri::command] async fn get_currency_settings(state: State<Db>) -> Result<Option<CurrencySettings>, AppError>`.
- Implement `db/settings.rs` with `get`, `save`, and `is_complete` helpers.
- Register the commands in `tauri::generate_handler!` in `lib.rs`.
- Frontend types in `settingsTypes.ts`:
  - `CurrencySettings`, `SaveCurrencySetupInput` matching the Rust payload shape.
- Frontend API in `settingsApi.ts`:
  - `isSetupComplete()`, `saveCurrencySetup(input)`, `getCurrencySettings()` using `invoke`.
- Frontend validation in `lib/validation/currency.ts`:
  - Code: non-empty, exactly 3 letters, uppercase.
  - Symbol: non-empty, max length 4.
- React components:
  - `useSettings` hook returns `{ currency, loading, error, refresh }` and exposes a `saveCurrency` helper.
  - `CurrencySetup` screen with two fields, validation errors, submit button, and clear error display.

### Phase 3: Integration

- In `App.tsx`, on mount call `isSetupComplete()`. While the call is pending, render a small loading state. When `true`, render the main app shell. When `false`, render `<CurrencySetup onComplete={refresh} />`.
- Pass the loaded `currency` from `useSettings` down to child screens via context or props so that Expense Creation and Expense List can render amounts with the configured symbol.
- After a successful save, call `refresh()` (or simply remount the hook) to flip the gate to the main app.

### Phase 4: Testing & Validation

- Manual end-to-end test:
  - Launch the app for the first time. Verify the setup screen is shown.
  - Submit empty fields and verify validation errors.
  - Submit valid `USD` and `$` and verify the main app shell appears.
  - Restart the app and verify the setup screen does not appear again.
  - Inspect the database and confirm the `settings` rows exist.
- Negative path:
  - Manually set `setup_complete` to `false` in the database and confirm the setup screen reappears.
  - Submit invalid currency code (`usd`) and confirm the validation error.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: VERIFY or SCAFFOLD tauri-app

- **IMPLEMENT**: If `src-tauri/Cargo.toml` is not present, follow the Expense Creation plan's Task 1 to scaffold the app.
- **PATTERN**: Tauri v2 default scaffold.
- **IMPORTS**: Node.js 18+, npm, Rust toolchain.
- **GOTCHA**: If a scaffold already exists, skip this task.
- **VALIDATE**: `ls src-tauri/Cargo.toml && ls package.json`

### Task 2: ADD database dependencies

- **IMPLEMENT**: `cd src-tauri && cargo add sqlx --features "runtime-tokio,sqlite" thiserror chrono`
- **PATTERN**: Reuse the dependency set from the Expense Creation plan.
- **IMPORTS**: `sqlx`, `thiserror`, `chrono`.
- **GOTCHA**: Use the same major versions across plans to avoid version drift.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 3: ADD or UPDATE migration in `src-tauri/src/db/mod.rs`

- **IMPLEMENT**: Provide a `pub fn migrations() -> Vec<Migration>` that creates the `settings` table (and, if not present, `categories` and `expenses` from the Expense Creation plan).
- **PATTERN**: Mirror the Tauri SQL plugin `Migration` struct.
- **IMPORTS**: `tauri_plugin_sql::{Migration, MigrationKind}`.
- **GOTCHA**: SQL must be idempotent (`CREATE TABLE IF NOT EXISTS`).
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 4: CREATE `src-tauri/src/db/settings.rs`

- **IMPLEMENT**: Expose `pub async fn get(state: &Db, key: &str) -> Result<Option<String>, AppError>`, `pub async fn set(state: &Db, key: &str, value: &str) -> Result<(), AppError>`, and convenience wrappers `is_complete`, `get_currency`, `save_currency`.
- **PATTERN**: Use `sqlx::query!`/`sqlx::query` with `$1` placeholders.
- **IMPORTS**: `sqlx::Row`, `crate::error::AppError`, `crate::db::Db`.
- **GOTCHA**: Use `INSERT ... ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at` for upsert behavior.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 5: CREATE `src-tauri/src/commands/settings.rs`

- **IMPLEMENT**: Define `SaveCurrencySetupInput` and `CurrencySettings` with `#[serde(rename_all = "camelCase")]`. Implement the three commands, returning `Result<_, AppError>`. Validate currency code (3 uppercase letters) and symbol (1–4 chars).
- **PATTERN**: Mirror the `my_custom_command` example from the Tauri v2 docs.
- **IMPORTS**: `tauri::State`, `chrono::Utc`, `crate::db::Db`, `crate::error::AppError`.
- **GOTCHA**: `is_setup_complete` must never fail the app boot; return `Ok(false)` on database read errors and log a warning.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 6: REGISTER commands in `lib.rs`

- **IMPLEMENT**: Add `mod commands;` and `mod db;` if not already present. Register the new commands in `tauri::generate_handler![..., commands::settings::is_setup_complete, commands::settings::save_currency_setup, commands::settings::get_currency_settings]`.
- **PATTERN**: Tauri v2 builder pattern.
- **IMPORTS**: None.
- **GOTCHA**: Command names are global; ensure uniqueness.
- **VALIDATE**: `cd src-tauri && cargo check`

### Task 7: CREATE `src/features/settings/settingsTypes.ts`

- **IMPLEMENT**: Export `CurrencySettings` and `SaveCurrencySetupInput` with `camelCase` keys.
- **PATTERN**: Mirror the Rust payload.
- **IMPORTS**: None.
- **GOTCHA**: Use `string` for code and symbol; do not introduce enums for MVP.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 8: CREATE `src/features/settings/settingsApi.ts`

- **IMPLEMENT**: Export `isSetupComplete`, `saveCurrencySetup`, `getCurrencySettings` wrapping `invoke`.
- **PATTERN**: Tauri command wrapper pattern from `AGENTS.md`.
- **IMPORTS**: `import { invoke } from '@tauri-apps/api/core';`.
- **GOTCHA**: Pass the argument under the `input` key to match the Rust parameter name.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 9: CREATE `src/lib/validation/currency.ts`

- **IMPLEMENT**: Export `validateCurrencySetup(input: SaveCurrencySetupInput): string[]` enforcing non-empty code (3 uppercase letters) and non-empty symbol (1–4 chars).
- **PATTERN**: Mirror the validation style from the Expense Creation plan.
- **IMPORTS**: None.
- **GOTCHA**: Symbol may include UTF-8 characters; do not restrict to ASCII.
- **VALIDATE**: `npm run typecheck` if configured.

### Task 10: CREATE `src/features/settings/useSettings.ts`

- **IMPLEMENT**: Export `useSettings()` returning `{ currency, loading, error, isSetupComplete, refresh, saveCurrency }`. The hook calls `isSetupComplete` on mount, then `getCurrencySettings` if complete, and exposes a `saveCurrency` helper that calls `saveCurrencySetup` and refreshes.
- **PATTERN**: Thin React hook around the API.
- **IMPORTS**: `useState`, `useCallback`, `useEffect`, `settingsApi`.
- **GOTCHA**: Guard against state updates after unmount.
- **VALIDATE**: `npm run build` if configured.

### Task 11: CREATE `src/features/settings/CurrencySetup.tsx`

- **IMPLEMENT**: Controlled component with `useState` for `code` and `symbol`. On submit: validate, call `saveCurrency`, call `onComplete` on success. Show validation errors and command errors.
- **PATTERN**: React form, clear error messages.
- **IMPORTS**: React, `settingsApi`, `validateCurrencySetup`, `SaveCurrencySetupInput`.
- **GOTCHA**: Provide a small selection of common currency codes as suggestions to make the form easy to complete.
- **VALIDATE**: `npm run build` if configured.

### Task 12: UPDATE `src/App.tsx` to gate on setup

- **IMPLEMENT**: Use `useSettings` to determine if the setup is complete. Render a loading state during the initial check, the `CurrencySetup` screen if not complete, and the main app shell otherwise.
- **PATTERN**: Conditional rendering at the top of the component tree.
- **IMPORTS**: `useSettings`, `CurrencySetup`.
- **GOTCHA**: The main app shell may be a simple `<div>Loading main app...</div>` placeholder until Expense Creation lands.
- **VALIDATE**: `npm run build` if configured.

### Task 13: RUN dev build and manually verify

- **IMPLEMENT**: `npm run tauri dev`. Walk through the manual test cases in **Phase 4**.
- **PATTERN**: Manual smoke test.
- **IMPORTS**: None.
- **GOTCHA**: The first launch must show the setup screen even if the database file already exists but `setup_complete` is `false`.
- **VALIDATE**: `npm run tauri build` to confirm the production build also works.

---

## TESTING STRATEGY

This MVP does not include automated test suites. Validation is performed via manual UI flows and the validation commands listed below. If tests are added later, follow the project conventions in `AGENTS.md`.

### Unit Tests

- Not in scope for this plan.

### Integration Tests

- Manual integration test: first launch shows the setup screen; completing it shows the main shell; restart skips the setup screen.
- Manual integration test: invalid input shows validation errors and does not write to the database.
- Manual integration test: deleting the `settings` rows in the database causes the setup screen to reappear on next launch.

### Edge Cases

- Currency code with lowercase letters (`usd`).
- Currency code with whitespace (` USD `).
- Currency code with non-letters (`US1`).
- Symbol longer than 4 characters.
- Symbol containing emoji.
- Database file missing on first launch.
- Two `settings` rows for the same key.
- Network failure on boot (should be impossible because the app is local; ensure no external calls are made).

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
# 1. On first launch, the CurrencySetup screen must appear.
# 2. Submit empty fields. Confirm validation errors.
# 3. Submit "USD" and "$". Confirm the main app shell appears.
# 4. Close and reopen the app. Confirm the setup screen does not appear.
# 5. Open the database, confirm the settings rows for "currency_code", "currency_symbol", and "setup_complete".

# Negative path:
# 1. UPDATE settings SET value = 'false' WHERE key = 'setup_complete';
# 2. Restart the app. Confirm the setup screen reappears.
```

### Level 5: Additional Validation (Optional)

- Use the `agent-browser` skill (see `.agents/skills/agent-browser/SKILL.md`) to drive the app for screenshot validation.
- Use the `e2e-test` skill (see `.agents/skills/e2e-test/SKILL.md`) once automated E2E is set up.

---

## ACCEPTANCE CRITERIA

- [ ] On a fresh install, the CurrencySetup screen is the first thing shown.
- [ ] Submitting a valid currency code (3 uppercase letters) and a non-empty symbol (1–4 chars) saves the settings and reveals the main app shell.
- [ ] Submitting an empty code shows `"Currency code is required."`.
- [ ] Submitting an empty symbol shows `"Currency symbol is required."`.
- [ ] Submitting a code that is not exactly 3 uppercase letters shows `"Currency code must be 3 letters."`.
- [ ] After successful save, the `settings` table contains rows for `currency_code`, `currency_symbol`, and `setup_complete = 'true'`.
- [ ] Restarting the app does not show the setup screen.
- [ ] Setting `setup_complete = 'false'` in the database causes the setup screen to reappear.
- [ ] The expense list (once implemented) renders amounts with the saved currency symbol.
- [ ] `cargo check`, `cargo clippy`, `npm run lint` (if configured), `npm run typecheck` (if configured), and `npm run build` all succeed.
- [ ] The Tauri production build (`npm run tauri build`) succeeds on the target platform.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1–13).
- [ ] Each task validation passed immediately.
- [ ] All validation commands executed successfully.
- [ ] Manual test confirms the setup screen appears once and the main app is reachable.
- [ ] Validation errors display correctly.
- [ ] Database contains the expected settings rows.
- [ ] No linting or type checking errors.
- [ ] Acceptance criteria all met.

---

## NOTES

- This plan assumes the Tauri app has not yet been scaffolded. If a scaffold already exists, skip Task 1 and adjust subsequent tasks to match the existing structure.
- The plan reuses the database pool, error type, and command registration pattern from the Expense Creation plan. If those files are not yet present, this plan implicitly requires them to be created (in line with the Expense Creation plan).
- Currency code validation is intentionally strict (3 uppercase letters) to keep the data consistent. If a future feature requires symbols (e.g., `BTC`), the validation can be relaxed.
- The MVP does not include a "change currency" screen. The PRD marks currency editing as out of scope.
- Keep the MVP tight: do not add a currency picker dropdown, a list of all ISO codes, or a "skip for now" option.
