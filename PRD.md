# Product Requirements Document: Expense Tracker Desktop Application

## 1. Executive Summary

Expense Tracker is a local-first desktop application for recording, categorizing, and reviewing personal expenses. It is designed for users who want a simple, private, and reliable way to track spending without cloud accounts, subscriptions, or remote synchronization.

The application will be built with Tauri and a React + TypeScript frontend. Data will be stored locally using SQLite through Tauri's SQLite plugin, keeping the app lightweight while providing structured persistence for expenses and categories.

The MVP goal is to deliver a functional desktop Expense Tracker that supports first-launch currency setup, category management, expense CRUD operations, and basic local storage using SQLite.

## 2. Mission

### Product Mission Statement

Help users understand and manage their spending through a private, simple, and dependable local desktop expense tracker.

### Core Principles

1. **Local-first privacy:** User expense data remains on the user's device.
2. **Simple expense capture:** Adding and editing expenses should be quick and low-friction.
3. **Clear organization:** Categories should make spending easier to review and understand.
4. **Reliable persistence:** Data should be stored safely in SQLite and remain available across app restarts.
5. **MVP focus:** Prioritize the smallest useful product before adding advanced features.

## 3. Target Users

### Primary User Personas

#### Persona 1: Personal Budget Tracker

- **Profile:** An individual who wants to track daily spending manually.
- **Technical comfort:** Comfortable using desktop apps; does not require advanced technical configuration.
- **Needs:**
  - Quickly add expenses after purchases.
  - Group expenses by categories.
  - Keep spending records private and local.
- **Pain points:**
  - Spreadsheet-based tracking feels manual and cluttered.
  - Cloud apps require accounts or raise privacy concerns.
  - Some expense apps include unnecessary complexity.

#### Persona 2: Small Personal Finance Organizer

- **Profile:** A user who wants a simple desktop tool for recurring personal expense tracking.
- **Technical comfort:** Moderate; can complete first-launch setup and basic app configuration.
- **Needs:**
  - Define a fixed currency during setup.
  - Maintain custom categories.
  - Review a simple list of recorded expenses.
- **Pain points:**
  - Losing expense records after app restarts.
  - Confusing interfaces with too many features.
  - Lack of control over local data.

#### Persona 3: Privacy-Conscious User

- **Profile:** A user who deliberately avoids cloud-based finance tools.
- **Technical comfort:** Moderate to high.
- **Needs:**
  - Local-only storage.
  - No account login.
  - Predictable data location and persistence behavior.
- **Pain points:**
  - Concern about syncing sensitive financial data.
  - Difficulty trusting apps that require online accounts.

## 4. MVP Scope

### Core Functionality

#### In Scope

- ✅ First-launch setup screen for selecting a single fixed currency.
- ✅ Expense creation.
- ✅ Expense editing.
- ✅ Expense deletion.
- ✅ Expense list view.
- ✅ Custom category creation.
- ✅ Category editing.
- ✅ Category deletion, with safe handling for existing expenses.
- ✅ Expense fields: amount, date, category, note, and payment method.
- ✅ Minimal validation for expense entries.

#### Out of Scope

- ❌ User accounts.
- ❌ Cloud sync.
- ❌ Multi-currency support.
- ❌ Currency exchange rates.
- ❌ Receipt or image attachments.
- ❌ Budget tracking.
- ❌ Income tracking.
- ❌ Reports and charts.
- ❌ CSV import/export.
- ❌ Merchant/vendor tracking.
- ❌ Tags.
- ❌ Push notifications or reminders.

### Technical

#### In Scope

- ✅ Tauri desktop application shell.
- ✅ React + TypeScript frontend.
- ✅ Local SQLite database.
- ✅ Tauri command layer or frontend-to-backend bridge for database operations.
- ✅ Local app data storage using Tauri's supported app data directory.
- ✅ Basic error handling for database operations.
- ✅ Basic form validation in the frontend.

#### Out of Scope

- ❌ Remote backend.
- ❌ REST or GraphQL API server.
- ❌ Authentication or authorization system.
- ❌ Automated database migrations beyond MVP schema initialization.
- ❌ Offline sync conflict resolution.
- ❌ Plugin architecture.
- ❌ Unit, integration, or end-to-end test suite unless added after MVP planning.

### Integration

#### In Scope

- ✅ SQLite database integration through Tauri plugin or supported Rust-side database access.
- ✅ Operating system desktop packaging for the selected development target.

#### Out of Scope

- ❌ Bank integrations.
- ❌ Payment provider integrations.
- ❌ Email notifications.
- ❌ Cloud backup providers.
- ❌ External reporting services.

### Deployment

#### In Scope

- ✅ Local desktop app development build.
- ✅ Basic packaged desktop app artifact for the development target platform.
- ✅ App settings persisted locally.

#### Out of Scope

- ❌ App store submission.
- ❌ Auto-updater.
- ❌ CI/CD pipeline.
- ❌ Code signing.
- ❌ Distribution to multiple operating systems in MVP.

## 5. User Stories

### Story 1: First-Launch Currency Setup

**As a** new user, **I want to** choose my fixed currency during first launch, **so that** all expenses are displayed consistently using my preferred currency.

**Example:**

- A user opens the app for the first time.
- The app displays a setup screen asking for a currency code and symbol.
- The user selects `USD` with `$`.
- All expense amounts are displayed using `$`.

### Story 2: Create an Expense

**As a** user, **I want to** add a new expense with an amount, date, category, note, and payment method, **so that** I can record spending immediately.

**Example:**

- A user buys groceries for `$42.50`.
- The user opens the app and adds:
  - Amount: `42.50`
  - Date: today
  - Category: `Groceries`
  - Note: `Weekly groceries`
  - Payment method: `Card`

### Story 3: Edit an Expense

**As a** user, **I want to** edit an existing expense, **so that** I can correct mistakes or update details later.

**Example:**

- A user entered `$15.00` but later realizes the correct amount was `$18.50`.
- The user opens the expense and updates the amount.

### Story 4: Delete an Expense

**As a** user, **I want to** delete an expense, **so that** I can remove incorrect or unnecessary records.

**Example:**

- A user accidentally adds a duplicate coffee purchase.
- The user deletes the duplicate entry.

### Story 5: Manage Categories

**As a** user, **I want to** create, edit, and delete categories, **so that** I can organize expenses in a way that matches my spending habits.

**Example:**

- A user creates categories such as:
  - `Food`
  - `Transport`
  - `Utilities`
  - `Entertainment`

### Story 6: View Expense List

**As a** user, **I want to** view my recorded expenses, **so that** I can review what I have spent.

**Example:**

- The app displays expenses in a list with:
  - Date
  - Category
  - Amount
  - Payment method
  - Optional note

### Story 7: Preserve Data Locally

**As a** privacy-conscious user, **I want to** store all expense data locally, **so that** I do not need an account or cloud service.

**Example:**

- The user closes and reopens the app.
- Previously entered expenses and categories remain available.

### Technical Story 8: SQLite Persistence

**As a** developer, **I want to** persist expenses and categories in SQLite, **so that** the app has reliable structured local storage.

**Example:**

- The app initializes a SQLite database on first launch.
- Expense records are inserted, updated, and deleted through SQL commands.
- The database file is stored in the Tauri app data directory.

### Technical Story 9: Validation

**As a** developer, **I want to** validate expense input before saving, **so that** the database remains consistent and users receive helpful feedback.

**Example:**

- If a user submits an expense with amount `0`, the app shows a validation error.
- If the user submits a valid amount and category, the expense is saved.

## 6. Core Architecture & Patterns

### High-Level Architecture

The app will follow a local-first Tauri architecture:

```text
React + TypeScript UI
        |
        | Tauri commands / invoke
        v
Rust backend / SQLite integration
        |
        v
Local SQLite database
```

### Responsibilities

#### Frontend

- Renders screens and forms.
- Handles user input and validation.
- Displays expenses and categories.
- Calls Tauri commands to save, update, delete, and fetch data.

#### Tauri Backend

- Initializes and manages SQLite connection.
- Executes database operations.
- Returns structured results to the frontend.
- Enforces basic data consistency rules.

#### SQLite Database

- Stores categories.
- Stores expenses.
- Stores first-launch setup state and currency configuration.

### Suggested Directory Structure

```text
expense-tracker/
  src/
    app/
      App.tsx
      routes/
    components/
      ExpenseForm.tsx
      ExpenseList.tsx
      CategoryForm.tsx
      CurrencySetup.tsx
    features/
      expenses/
        expenseTypes.ts
        expenseApi.ts
      categories/
        categoryTypes.ts
        categoryApi.ts
      settings/
        settingsTypes.ts
        settingsApi.ts
    lib/
      tauri.ts
      validation.ts
      currency.ts
    main.tsx
  src-tauri/
    src/
      db/
        mod.rs
        schema.rs
        expenses.rs
        categories.rs
        settings.rs
      commands/
        mod.rs
        expenses.rs
        categories.rs
        settings.rs
      main.rs
    tauri.conf.json
    Cargo.toml
  package.json
  tsconfig.json
  README.md
```

### Key Design Patterns and Principles

1. **Local-first data model:** No remote API dependency.
2. **Thin frontend API layer:** Frontend calls typed Tauri command wrappers.
3. **Separation of concerns:** UI, validation, command wrappers, and database logic should remain separate.
4. **Explicit validation:** Required fields should be validated before save operations.
5. **Safe category deletion:** Deleting a category should not orphan expenses.
6. **MVP-first delivery:** Avoid adding reports, budgets, sync, or advanced finance features until the core flow is stable.

### Technology-Specific Patterns

#### Tauri Command Pattern

```ts
import { invoke } from '@tauri-apps/api/core';

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  return invoke('create_expense', { input });
}
```

#### Validation Pattern

```ts
export function validateExpenseInput(input: ExpenseFormValues): string[] {
  const errors: string[] = [];

  if (!input.amount || input.amount <= 0) {
    errors.push('Amount must be greater than zero.');
  }

  if (!input.date) {
    errors.push('Date is required.');
  }

  if (!input.categoryId) {
    errors.push('Category is required.');
  }

  return errors;
}
```

## 7. Tools / Features

### Feature 1: First-Launch Currency Setup

#### Purpose

Collect the user's fixed currency preference before the app allows expense entry.

#### User Flow

1. User opens the app for the first time.
2. App checks whether currency setup has already been completed.
3. If not completed, app displays the currency setup screen.
4. User selects or enters:
   - Currency code, for example `USD`
   - Currency symbol, for example `$`
5. App saves the currency configuration.
6. App navigates to the main expense tracking screen.

#### Requirements

- ✅ Currency code is required.
- ✅ Currency symbol is required.
- ✅ Currency setup can only be completed once during first launch for MVP.
- ✅ Existing expenses use the selected currency for display.
- ❌ Currency switching is out of scope for MVP.

#### Example

```text
Currency Code: USD
Currency Symbol: $
```

### Feature 2: Expense Creation

#### Purpose

Allow users to record a new expense.

#### Required Fields

- Amount
- Date
- Category

#### Optional Fields

- Note
- Payment method

#### Requirements

- ✅ Amount must be greater than zero.
- ✅ Date must be valid.
- ✅ Category must exist.
- ✅ Note is optional.
- ✅ Payment method is optional.
- ✅ Created expense is saved to SQLite.
- ✅ Newly created expense appears in the expense list.

#### Example Payload

```json
{
  "amount": 42.5,
  "date": "2026-06-18",
  "categoryId": "cat_1",
  "note": "Weekly groceries",
  "paymentMethod": "Card"
}
```

### Feature 3: Expense Editing

#### Purpose

Allow users to update an existing expense.

#### Requirements

- ✅ User can update amount, date, category, note, and payment method.
- ✅ Edited expense must pass the same validation rules as creation.
- ✅ Existing expense ID must be preserved.
- ✅ Updated values are persisted to SQLite.

#### Example Payload

```json
{
  "id": "exp_1",
  "amount": 45.0,
  "date": "2026-06-18",
  "categoryId": "cat_1",
  "note": "Updated weekly groceries",
  "paymentMethod": "Card"
}
```

### Feature 4: Expense Deletion

#### Purpose

Allow users to remove an incorrect or unwanted expense.

#### Requirements

- ✅ User can delete an expense by ID.
- ✅ Deleted expense is removed from SQLite.
- ✅ Deleted expense disappears from the expense list.
- ❌ Soft delete is not required for MVP.

### Feature 5: Expense List

#### Purpose

Display recorded expenses in a readable list.

#### Requirements

- ✅ List expenses with date, category, amount, payment method, and optional note.
- ✅ Display amount using the configured currency symbol.
- ✅ Refresh list after create, edit, and delete operations.
- ❌ Sorting and filtering are not required for MVP unless simple default ordering is easy to implement.
- ❌ Charts and summaries are out of scope.

### Feature 6: Category Management

#### Purpose

Allow users to define and maintain categories for organizing expenses.

#### Requirements

- ✅ User can create a category.
- ✅ User can edit a category name.
- ✅ User can delete a category.
- ✅ Category names should be required.
- ✅ Category names should be unique or checked for duplicates.
- ✅ Deleting a category with existing expenses should not break the database.

#### Category Deletion Behavior

The MVP should choose one of the following behaviors before implementation:

1. Prevent deletion if the category has existing expenses.
2. Reassign expenses to an "Uncategorized" category.
3. Delete associated expenses with the category.

Recommended MVP behavior: **Prevent deletion if the category has existing expenses and show a clear message.**

### Feature 7: Local SQLite Persistence

#### Purpose

Store all app data locally in a structured database.

#### Requirements

- ✅ Initialize database on first app launch.
- ✅ Store settings, categories, and expenses.
- ✅ Use SQLite through a Tauri-supported integration.
- ✅ Store database in Tauri's app data directory.
- ✅ Return clear errors if database operations fail.

### Feature 8: Basic Error Handling

#### Purpose

Provide users with understandable feedback when something goes wrong.

#### Requirements

- ✅ Show validation errors for invalid forms.
- ✅ Show save/update/delete errors from the backend.
- ✅ Avoid exposing raw stack traces to end users.
- ❌ Advanced logging infrastructure is out of scope.

## 8. Technology Stack

### Frontend

| Area | Technology | Notes |
|---|---|---|
| Desktop shell | Tauri | Local desktop runtime |
| Frontend framework | React | MVP UI |
| Language | TypeScript | Type-safe frontend and command wrappers |
| Styling | CSS modules, plain CSS, or lightweight utility classes | Final choice can be made during implementation |
| Form handling | Native forms or lightweight form helpers | Avoid heavy dependencies for MVP |
| State management | React state or minimal local state | Avoid Redux unless needed |

### Backend

| Area | Technology | Notes |
|---|---|---|
| Backend language | Rust | Required by Tauri |
| Database | SQLite | Local structured storage |
| Database access | `rusqlite` or `tauri-plugin-sql` | Final choice should match Tauri version and project setup |
| App config | Tauri configuration | Stored in `src-tauri/tauri.conf.json` |

### Suggested Dependency Versions

Exact versions should be confirmed during project setup, but the MVP should target:

| Dependency | Target Version |
|---|---|
| Tauri | `2.x` |
| React | `18.x` or newer |
| TypeScript | `5.x` |
| SQLite | Bundled SQLite driver compatible with selected Tauri/Rust tooling |

### Optional Dependencies

| Dependency | Purpose | MVP Status |
|---|---|---|
| Date formatting library | Display dates consistently | Optional |
| UI component library | Faster UI development | Optional |
| Testing framework | Regression coverage | Post-MVP recommended |
| Zod or similar validator | Shared validation schemas | Optional |

### Third-Party Integrations

No third-party integrations are required for the MVP.

Out of scope:

- Bank APIs
- Cloud backup
- Payment processors
- Currency exchange APIs
- Authentication providers

## 9. Security & Configuration

### Authentication / Authorization

The MVP will not include authentication or authorization.

Because the app is local-only:

- No user accounts are required.
- No remote API calls are required.
- No session tokens are required.
- Data access is limited to the local user account on the device.

### Configuration Management

#### Runtime Configuration

| Setting | Storage | Notes |
|---|---|---|
| Currency code | SQLite settings table | Chosen during first launch |
| Currency symbol | SQLite settings table | Chosen during first launch |
| First-launch completed flag | SQLite settings table | Prevents repeated setup prompts |

#### App Configuration

| File | Purpose |
|---|---|
| `src-tauri/tauri.conf.json` | Tauri app metadata, window settings, security configuration |
| `package.json` | Frontend scripts and dependencies |
| `src-tauri/Cargo.toml` | Rust dependencies |

### Security Scope

#### In Scope

- ✅ Local-only storage.
- ✅ No remote network dependency for core expense tracking.
- ✅ Input validation before database writes.
- ✅ Basic error handling for database failures.
- ✅ Safe handling of category deletion to avoid inconsistent expense references.

#### Out of Scope

- ❌ Data encryption at rest.
- ❌ User authentication.
- ❌ Role-based access control.
- ❌ Secure backup or sync.
- ❌ Audit logging.
- ❌ Malware or threat-model hardening beyond standard desktop app practices.

### Deployment Considerations

- MVP should produce a local desktop build for the development target platform.
- Database file should be stored in the Tauri app data directory.
- Packaging should not require a remote backend.
- App store submission, auto-updates, and code signing are deferred.

## 10. API Specification

The MVP does not require a remote HTTP API. Instead, the frontend should interact with the Tauri backend through typed command wrappers.

### Tauri Command Layer

#### Settings Commands

##### `is_setup_complete`

Returns whether first-launch currency setup has been completed.

```ts
invoke('is_setup_complete')
```

Response:

```json
true
```

##### `save_currency_setup`

Saves the fixed currency configuration.

Request:

```json
{
  "currencyCode": "USD",
  "currencySymbol": "$"
}
```

Response:

```json
{
  "currencyCode": "USD",
  "currencySymbol": "$"
}
```

##### `get_currency_settings`

Returns the configured currency.

Response:

```json
{
  "currencyCode": "USD",
  "currencySymbol": "$"
}
```

#### Category Commands

##### `list_categories`

Returns all categories.

Response:

```json
[
  {
    "id": "cat_1",
    "name": "Groceries"
  },
  {
    "id": "cat_2",
    "name": "Transport"
  }
]
```

##### `create_category`

Creates a category.

Request:

```json
{
  "name": "Groceries"
}
```

Response:

```json
{
  "id": "cat_1",
  "name": "Groceries"
}
```

##### `update_category`

Updates a category.

Request:

```json
{
  "id": "cat_1",
  "name": "Food"
}
```

Response:

```json
{
  "id": "cat_1",
  "name": "Food"
}
```

##### `delete_category`

Deletes a category.

Request:

```json
{
  "id": "cat_1"
}
```

Response:

```json
{
  "success": true
}
```

#### Expense Commands

##### `list_expenses`

Returns all expenses.

Response:

```json
[
  {
    "id": "exp_1",
    "amount": 42.5,
    "date": "2026-06-18",
    "categoryId": "cat_1",
    "categoryName": "Groceries",
    "note": "Weekly groceries",
    "paymentMethod": "Card",
    "createdAt": "2026-06-18T10:30:00Z",
    "updatedAt": "2026-06-18T10:30:00Z"
  }
]
```

##### `create_expense`

Creates an expense.

Request:

```json
{
  "amount": 42.5,
  "date": "2026-06-18",
  "categoryId": "cat_1",
  "note": "Weekly groceries",
  "paymentMethod": "Card"
}
```

Response:

```json
{
  "id": "exp_1",
  "amount": 42.5,
  "date": "2026-06-18",
  "categoryId": "cat_1",
  "categoryName": "Groceries",
  "note": "Weekly groceries",
  "paymentMethod": "Card",
  "createdAt": "2026-06-18T10:30:00Z",
  "updatedAt": "2026-06-18T10:30:00Z"
}
```

##### `update_expense`

Updates an expense.

Request:

```json
{
  "id": "exp_1",
  "amount": 45.0,
  "date": "2026-06-18",
  "categoryId": "cat_1",
  "note": "Updated weekly groceries",
  "paymentMethod": "Card"
}
```

Response:

```json
{
  "id": "exp_1",
  "amount": 45.0,
  "date": "2026-06-18",
  "categoryId": "cat_1",
  "categoryName": "Groceries",
  "note": "Updated weekly groceries",
  "paymentMethod": "Card",
  "createdAt": "2026-06-18T10:30:00Z",
  "updatedAt": "2026-06-18T10:35:00Z"
}
```

##### `delete_expense`

Deletes an expense.

Request:

```json
{
  "id": "exp_1"
}
```

Response:

```json
{
  "success": true
}
```

### Error Response Pattern

```json
{
  "error": "Category is required."
}
```

or:

```json
{
  "error": "Cannot delete category because it is used by existing expenses."
}
```

## 11. Success Criteria

### MVP Success Definition

The MVP is successful when a user can install or run the desktop app, choose a currency during first launch, create categories, add expenses, edit or delete expenses, and reopen the app later with data preserved locally.

### Functional Requirements

- ✅ App launches successfully on the target desktop platform.
- ✅ First-launch currency setup appears when no settings exist.
- ✅ Currency settings are saved after setup.
- ✅ Main app is accessible after setup.
- ✅ User can create categories.
- ✅ User can edit categories.
- ✅ User can delete categories without corrupting expense data.
- ✅ User can create expenses.
- ✅ User can edit expenses.
- ✅ User can delete expenses.
- ✅ Expenses are stored in SQLite.
- ✅ Categories are stored in SQLite.
- ✅ Data persists after closing and reopening the app.
- ✅ Expense amounts display using the selected currency symbol.
- ✅ Invalid expense forms show validation feedback.

### Quality Indicators

- Expense creation, editing, and deletion complete without manual database intervention.
- Category deletion does not leave expenses pointing to missing categories.
- App startup does not require network access.
- UI remains understandable for a non-technical user.
- Database operations return clear errors when they fail.

### User Experience Goals

- A user can add an expense in under 30 seconds after setup.
- The main expense list is understandable without explanation.
- Required fields are obvious.
- Validation errors are specific and actionable.
- The app feels lightweight and private.

## 12. Implementation Phases

### Phase 1: Project Setup and Architecture

**Goal:** Create the Tauri + React + TypeScript project foundation.

**Deliverables:**

- ✅ Tauri app initialized.
- ✅ React + TypeScript frontend scaffolded.
- ✅ Basic app shell and routing/navigation structure.
- ✅ Tauri command bridge established.
- ✅ SQLite dependency and database initialization strategy selected.
- ✅ Basic project scripts added for development and build.

**Validation Criteria:**

- App launches in development mode.
- Frontend can call a simple Tauri command.
- Backend can initialize a SQLite database or return a clear setup error.

**Estimated Timeline:** 0.5–1 day

### Phase 2: Local Data Layer

**Goal:** Implement SQLite storage for settings, categories, and expenses.

**Deliverables:**

- ✅ Settings table for first-launch setup and currency configuration.
- ✅ Categories table.
- ✅ Expenses table.
- ✅ Backend commands for settings, categories, and expenses.
- ✅ Basic database error handling.
- ✅ Typed frontend command wrappers.

**Validation Criteria:**

- Currency setup can be saved and retrieved.
- Categories can be created, listed, updated, and deleted.
- Expenses can be created, listed, updated, and deleted.
- Data persists after app restart.

**Estimated Timeline:** 1–2 days

### Phase 3: Core User Interface

**Goal:** Build the MVP user flows for setup, category management, and expense management.

**Deliverables:**

- ✅ First-launch currency setup screen.
- ✅ Expense list screen.
- ✅ Create/edit expense form.
- ✅ Category management UI.
- ✅ Delete confirmation or safe delete flow.
- ✅ Validation feedback in forms.
- ✅ Currency symbol display for expense amounts.

**Validation Criteria:**

- A new user can complete first-launch setup.
- A user can create categories.
- A user can add, edit, and delete expenses.
- The expense list updates after data changes.
- Required fields are enforced.

**Estimated Timeline:** 2–3 days

### Phase 4: Polish, Validation, and Packaging

**Goal:** Stabilize the MVP and prepare a runnable desktop build.

**Deliverables:**

- ✅ Consistent empty states.
- ✅ Basic loading and error states.
- ✅ Improved form validation.
- ✅ Safer category deletion behavior.
- ✅ Development build tested after restart.
- ✅ Packaged desktop build for target platform.

**Validation Criteria:**

- App can be launched from the packaged build.
- Existing data remains available after restart.
- Common user errors produce helpful messages.
- No required MVP feature is blocked by unresolved defects.

**Estimated Timeline:** 1–2 days

## 13. Future Considerations

### Post-MVP Enhancements

- Reports and summaries by month, week, category, and total spending.
- Budget creation and monitoring.
- Income entries alongside expenses.
- CSV import/export.
- Receipt or image attachments.
- Merchant/vendor tracking.
- Tags for flexible filtering.
- Search and filter controls.
- Sortable expense list.
- Dark mode.
- Settings screen for currency editing, if future requirements allow currency changes.
- Data backup and restore.

### Integration Opportunities

- CSV export for spreadsheet analysis.
- Import from banking CSV statements.
- Optional encrypted local backup files.
- Optional cloud sync in a later product version.

### Advanced Features

- Multi-currency support with exchange rates.
- Recurring expense templates.
- Spending alerts.
- Charts and visual dashboards.
- Data encryption at rest.
- Automatic backups.
- Cross-device sync.
- App store distribution.

## 14. Risks & Mitigations

### Risk 1: SQLite Integration Complexity

**Risk:** Tauri SQLite setup may introduce friction, especially around Rust bindings, schema initialization, and platform-specific packaging.

**Mitigation:**

- Use a well-supported Tauri SQLite plugin or mature Rust SQLite crate.
- Keep schema simple.
- Add database initialization tests or manual validation early.
- Store the database in Tauri's recommended app data directory.

### Risk 2: Category Deletion Creates Inconsistent Data

**Risk:** Deleting a category could leave expenses referencing a missing category.

**Mitigation:**

- Use foreign keys where supported.
- Prevent deletion of categories currently used by expenses.
- Return a clear user-facing error message.
- Validate category references before saving expenses.

### Risk 3: Over-Scoping the MVP

**Risk:** Adding reports, budgets, sync, or multi-currency support could delay the core product.

**Mitigation:**

- Keep MVP acceptance criteria focused on expense CRUD, categories, currency setup, and local persistence.
- Track future enhancements separately.
- Reject features that do not support the first local-only MVP goal.

### Risk 4: Poor User Experience Around Validation

**Risk:** Users may become frustrated if form errors are unclear or appear too late.

**Mitigation:**

- Validate required fields before submission.
- Show specific error messages.
- Preserve entered values after validation failures.
- Use simple labels and required-field indicators.

### Risk 5: Local Data Loss

**Risk:** Users may lose data if the app data directory changes, the database is corrupted, or the app is reinstalled incorrectly.

**Mitigation:**

- Use Tauri's supported app data directory.
- Initialize the database safely.
- Handle database errors clearly.
- Consider backup/export as a post-MVP feature.

## 15. Appendix

### Related Documents

- This PRD is based on the current conversation and grill-me discovery session.
- No external architecture or API documents are required for MVP because the app is local-only.

### Key Dependencies

| Dependency | Purpose |
|---|---|
| Tauri | Desktop application shell |
| Rust | Tauri backend implementation |
| SQLite | Local structured persistence |
| React | Frontend UI |
| TypeScript | Type-safe application code |

### Project Structure

The suggested project structure is:

```text
expense-tracker/
  src/
    app/
    components/
    features/
    lib/
    main.tsx
  src-tauri/
    src/
    tauri.conf.json
    Cargo.toml
  package.json
  tsconfig.json
```

### MVP Data Model

#### `settings`

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT | Primary key |
| `value` | TEXT | Stored setting value |

Example rows:

```text
currency_code = USD
currency_symbol = $
setup_complete = true
```

#### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT | Primary key |
| `name` | TEXT | Required |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

#### `expenses`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT | Primary key |
| `amount` | REAL | Required, greater than zero |
| `date` | TEXT | Required date string |
| `category_id` | TEXT | Foreign key to categories |
| `note` | TEXT | Optional |
| `payment_method` | TEXT | Optional |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### Assumptions Made

- The output file defaults to `PRD.md` because the requested output path was blank.
- Category management includes create, edit, and delete categories.
- Category deletion should be blocked when existing expenses use the category.
- The app targets one desktop platform initially, even though Tauri supports multiple platforms.
- No automated tests are included in the MVP unless explicitly added during implementation planning.
- Exact package versions should be confirmed during project setup.
- The database will be stored in Tauri's recommended app data directory.

### Recommended Next Steps

1. Review this PRD for scope accuracy.
2. Confirm category deletion behavior.
3. Confirm the initial target desktop platform.
4. Convert the MVP scope into implementation tasks or issues.
5. Start with Phase 1: project setup and architecture.
