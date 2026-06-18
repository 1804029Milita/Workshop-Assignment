# Feature: expense-list

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Display a tabular list of all stored expenses with per-row delete, with backend-driven sorting (date desc, then created_at desc) and a joined category name. Empty/loading/error states are shown inline. This is a frontend wiring/UI feature — the underlying Tauri command (`list_expenses`) and the SQL query (with `JOIN categories`) already exist and return an enriched `Expense` row that already includes `categoryName`.

Scope of this plan is intentionally minimal ("basic list + delete"), matching the user's stated scope:

- Read all expenses via `useExpenses` (already does this on mount via `refresh`).
- Render rows in a `<table>` showing Date / Category / Amount / Payment / Note / Actions.
- Format amount with the user's currency symbol, format date with the user's locale.
- Per-row Delete button that confirms, calls `removeExpense`, shows in-flight "Deleting..." state, and disables that row's button while in flight.
- Show empty/loading/error states consistent with `CategoryList`.

Out of scope (explicit non-goals for this iteration):
- No filtering, sorting, or search controls.
- No inline edit, no row expansion, no bulk delete.
- No summary/totals.
- No new Tauri commands, no SQL changes — `list_expenses`, `delete_expense`, and the joined `Expense` type are all already in place.

## User Story

As a desktop expense-tracker user
I want to see all my expenses in a table with date, category, amount, payment, and note, and be able to delete one
So that I can review what I have spent and remove mistakes or duplicates.

## Problem Statement

`ExpenseList.tsx` exists at `src/features/expenses/ExpenseList.tsx:1` but is wired into `App.tsx` at `src/App.tsx:15` without dedicated CSS classes, currency formatting, or a `key` strategy, and the global stylesheet (`src/styles.css`) only defines `.btn-delete`. The list must be a real, styled, accessible table with proper empty/loading/error states and a working delete-with-confirm flow that matches the conventions used by `CategoryList` (`src/features/categories/CategoryList.tsx:1`).

## Solution Statement

Keep the existing `useExpenses` hook as the data source (it already exposes `expenses`, `loading`, `error`, `refresh`, `removeExpense`, and tracks `isMounted` for safe async updates — see `src/features/expenses/useExpenses.ts:5`). Render the list in a `<table>` with the columns Date / Category / Amount / Payment / Note / Actions. Add a `useState` `deletingExpenseId` to track the in-flight row, show "Deleting..." in the button, and clear it on success or failure. Confirm via `window.confirm` (the same idiom used by `CategoryList.tsx:54`). Add table-specific CSS to `src/styles.css`, mirroring the existing minimal class-based styling (no CSS-in-JS, no Tailwind). Use the prop `currencySymbol` for amount formatting — the parent already passes `"$"` in `src/App.tsx:12` and `:15`; do not hardcode a currency.

## Feature Metadata

- **Feature Type**: Enhancement (refining the existing `ExpenseList` into a polished, styled, accessible list with delete — the data path already works).
- **Estimated Complexity**: Low. Single-file UI change + small CSS additions. No backend, no schema, no new types, no new commands.
- **Primary Systems Affected**:
  - `src/features/expenses/ExpenseList.tsx` (the list component)
  - `src/styles.css` (add table/list styles)
- **Dependencies**:
  - `react`, `react-dom` (already in `package.json`)
  - `useExpenses` from `src/features/expenses/useExpenses.ts` (already implemented)
  - `Expense` type from `src/features/expenses/expenseTypes.ts` (already includes `categoryName`)
  - Tauri command `delete_expense` (already wired via `expenseApi.ts:17`)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/features/expenses/ExpenseList.tsx:1-84` — The component being refined. Current behaviour: shows loading/error/empty states, renders a 6-column table, supports delete-with-confirm with `deletingExpenseId` per-row state. The plan reuses this structure verbatim; do not invent a new component shape.
- `src/features/expenses/useExpenses.ts:5-81` — Data hook. Already returns `{ expenses, categories, loading, error, refresh, addExpense, removeExpense }`. `removeExpense(id)` returns `Promise<boolean>` and already optimistically removes the row on success (`useExpenses.ts:67-69`). `isMounted` ref guards against setState-after-unmount (`useExpenses.ts:10-17`).
- `src/features/expenses/expenseTypes.ts:8-18` — `Expense` interface. Already has `categoryName: string` (joined from DB) so the list does **not** need a separate categories lookup to render the name.
- `src/features/expenses/expenseApi.ts:17-19` — `deleteExpense(id)` thin wrapper around `invoke('delete_expense', { id })`. The Rust command lives at `src-tauri/src/commands/expenses.rs:108-111` and returns `Result<(), AppError>`.
- `src/features/categories/CategoryList.tsx:1-81` — Reference for table style, empty/loading/error branches, and the `window.confirm` pattern at `CategoryList.tsx:54`.
- `src/App.tsx:1-22` — Parent already renders `<ExpenseList currencySymbol="$" />` at `App.tsx:15`. The plan must preserve the `currencySymbol` prop and default to `'$'`.
- `src/styles.css:1-51` — Existing class-based styles. Already defines `.btn-delete` and `.actions`. Plan adds list/table styles here, in the same BEM-flat, class-only style.
- `src/lib/validation/expense.ts:1-20` — Validation lives here. List rendering does **not** call this; do not import it into `ExpenseList`.

### New Files to Create

- None. All changes are to existing files.

### New Files to Create (if extracting later — NOT for this plan)

> Listed only to flag that the current structure is acceptable for MVP. Do not create these in this iteration:
> - `src/features/expenses/ExpenseRow.tsx` — would host the per-row delete UI; not needed while the list is small.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- React 18 docs — `useState`, `useCallback`, `useEffect`, `useRef`: https://react.dev/reference/react
  - Section: `useState` — Why: per-row `deletingExpenseId` mirrors the existing pattern in `ExpenseList.tsx:7`.
- Tauri 2 `invoke` API: https://v2.tauri.app/develop/calling-rust/
  - Section: Passing arguments — Why: confirms the `{ id }` payload shape used at `expenseApi.ts:18`.
- MDN — `HTMLTableElement` accessibility: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  - Section: Accessibility / captions — Why: `<table>` should be wrapped semantically; a visually-hidden caption is recommended so screen readers announce the list.

### Patterns to Follow

**Naming Conventions:**
- Component files: PascalCase (`ExpenseList.tsx`). Hooks: `useCamelCase.ts` (`useExpenses.ts`). Types: `camelCase.ts` (`expenseTypes.ts`). API wrappers: lowercase + suffix (`expenseApi.ts`).
- CSS classes: lowercase, hyphenated where needed (`.list-header`, `.btn-delete`, `.empty`, `.error`, `.loading`). Mirror this for new classes: `.expense-list`, `.expense-list table`, `.expense-list .amount`, `.expense-list .actions`.

**Error Handling:**
- Hook catches errors, stringifies with `err instanceof Error ? err.message : 'Failed to …'`, sets `error` state (`useExpenses.ts:31-34`). Component renders the error string inside `.error` and offers a "Retry" button that calls `refresh` (`ExpenseList.tsx:32-39`).
- Do not swallow `removeExpense` returning `false` silently. If the hook did not optimistically remove the row, the list still shows it — that is the contract; do not introduce a second `setError` here (`useExpenses.ts:71-74` already sets the hook-level error).

**Logging Pattern:** None. This project has no logger. Do not add `console.log` for routine events. If a `window.confirm` is rejected, just early-return.

**Other Relevant Patterns:**
- `isMounted` ref + `if (isMounted.current)` before every setState in async paths (`useExpenses.ts:10-17, 27-29, 33-34, 36-38`). Mirrored in the component only when introducing new async work — not needed for this plan since `removeExpense` is awaited.
- `useState` initial value must be a stable literal; do not call `new Date()` in the initializer of `deletingExpenseId` (it does not, but flag if added).
- Optimistic removal is already in the hook (`useExpenses.ts:68`). The list does not need to do its own filter.
- Sort order comes from the backend (`src-tauri/src/db/expenses.rs:75` — `ORDER BY e.date DESC, e.created_at DESC`). Do not add client-side sorting.

---

## IMPLEMENTATION PLAN

### Phase 1: Component refactor (no logic change)

Make the existing `ExpenseList` the canonical implementation. Read the current file first (`src/features/expenses/ExpenseList.tsx:1-84`) and use it as the baseline. Confirm the JSX still matches the contract described in "Solution Statement" above; if it does, no functional change is needed. Add a `<caption className="visually-hidden">Expenses</caption>` for accessibility and ensure the table uses `cellPadding`/`cellSpacing` via CSS only (no inline attributes).

### Phase 2: Styles

Append the following classes to `src/styles.css` (do not rewrite existing rules):
- `.expense-list` — outer wrapper, white background, border-radius, padding, box-shadow, full-width on small screens.
- `.expense-list .list-header` — flex row, space-between, margin-bottom.
- `.expense-list table` — `width: 100%`, `border-collapse: collapse`.
- `.expense-list th`, `.expense-list td` — `text-align: left`, `padding: 0.5rem 0.75rem`, `border-bottom: 1px solid #eee`.
- `.expense-list th` — `background: #fafafa`, `font-weight: 600`, `font-size: 0.85rem`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `color: #555`.
- `.expense-list tbody tr:hover` — `background: #fafafa`.
- `.expense-list .amount` — `text-align: right`, `font-variant-numeric: tabular-nums`, `font-weight: 600`.
- `.expense-list .actions` — reuse existing global `.actions` (`styles.css:31-34`); no new rule needed.
- `.expense-list .empty` — reuse global `.empty`; the rule for `.empty` does not exist yet, add `.empty { color: #777; padding: 1rem; text-align: center; }`.
- `.expense-list .visually-hidden` — `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;` (utility class — define once, not nested).

### Phase 3: Verification

Run the validation commands in the order shown. No tests exist (see `AGENTS.md` — "No application tests currently exist"), so verification is typecheck + lint + production build.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task Format Guidelines

Use information-dense keywords for clarity:

- **CREATE**: New files or components
- **UPDATE**: Modify existing files
- **ADD**: Insert new functionality into existing code
- **REMOVE**: Delete deprecated code
- **REFACTOR**: Restructure without changing behavior
- **MIRROR**: Copy pattern from elsewhere in codebase

### READ `src/features/expenses/ExpenseList.tsx`

- **IMPLEMENT**: Confirm the file still matches the structure described in `ExpenseList.tsx:1-84`. If it does, do not edit it in Task 2; jump to Task 3 (styles) and Task 4 (a11y caption).
- **PATTERN**: `ExpenseList.tsx:7` (`deletingExpenseId` state), `ExpenseList.tsx:17-26` (confirm + delete), `CategoryList.tsx:54` (confirm idiom).
- **IMPORTS**: `react`, `./useExpenses`, `./expenseTypes`.
- **GOTCHA**: The hook is **also** used by `ExpenseForm` (`ExpenseForm.tsx:7`). Do not change `useExpenses`'s public surface; `removeExpense` must keep returning `Promise<boolean>` and must keep its optimistic-update behaviour.
- **VALIDATE**: `npx tsc -b --noEmit`

### UPDATE `src/features/expenses/ExpenseList.tsx`

- **IMPLEMENT**: Make the minimum set of edits that:
  1. Add a visually-hidden caption inside the `<table>`: `<caption className="visually-hidden">Expenses</caption>` as the first child of the `<table>` (`ExpenseList.tsx:50`).
  2. Ensure the table is wrapped by an element that already carries the `.expense-list` class (it does at `ExpenseList.tsx:46`).
  3. Keep the `deletingExpenseId` per-row state and the "Deleting..." label exactly as at `ExpenseList.tsx:72-76`.
  4. Keep the `formatAmount` using `currencySymbol` prop — default `'$'`.
  5. Keep `formatDate` using `toLocaleDateString()` — locale-agnostic.
  6. Do **not** add a sort/filter UI, edit button, or summary.
  7. Do **not** add inline styles. Use classes only.
- **PATTERN**: `CategoryList.tsx:34-67` for the table structure; `ExpenseList.tsx:50-81` for the existing JSX.
- **IMPORTS**: No new imports. `useState` and the `Expense` type are already imported at `ExpenseList.tsx:1-3`.
- **GOTCHA**: Do not pass an `onClick` that captures a stale `expense` — the existing closure at `ExpenseList.tsx:71` is correct. Do not switch `window.confirm` to a custom modal — the codebase uses `window.confirm` everywhere (`CategoryList.tsx:54`).
- **VALIDATE**: `npx tsc -b --noEmit`

### UPDATE `src/styles.css`

- **IMPLEMENT**: Append (do not replace) the rules listed in Phase 2. The new classes are `.expense-list`, `.expense-list .list-header`, `.expense-list table`, `.expense-list th`, `.expense-list td`, `.expense-list tbody tr:hover`, `.expense-list .amount`, `.empty`, and `.visually-hidden`. Keep all existing rules intact (`styles.css:1-51`).
- **PATTERN**: Existing class-only, no nesting, no CSS variables, no preprocessor — match the flat style at `styles.css:1-51`.
- **IMPORTS**: None.
- **GOTCHA**: `styles.css` is imported once from `src/main.tsx`. Do not create a second stylesheet.
- **VALIDATE**: `npm run lint` (will not lint CSS, but verifies nothing else broke). For CSS, run `npm run build` — Vite will fail loudly if a CSS import is malformed.

### VERIFY parent wiring

- **IMPLEMENT**: Confirm `src/App.tsx:15` still passes `currencySymbol="$"` to `<ExpenseList />`. No change expected; this task is a guard rail.
- **PATTERN**: `src/App.tsx:12,15`.
- **IMPORTS**: N/A.
- **GOTCHA**: If a future change moves the list to a new page, keep the `currencySymbol` prop name to preserve the contract used by `ExpenseForm` and `ExpenseList`.
- **VALIDATE**: `npx tsc -b --noEmit`

### VERIFY delete round-trip manually

- **IMPLEMENT**: Run `npm run tauri dev` (or `npm run dev` if the dev server alone is enough for visual smoke). Open the app, add an expense, confirm it appears in the list ordered by date desc, click Delete, accept the confirm, observe the row disappear. Decline the confirm and observe nothing changes. Click Delete while a row is already deleting and observe the button is disabled.
- **PATTERN**: Manual smoke test only. The Tauri command is exercised through `useExpenses` → `expenseApi.deleteExpense` → `invoke('delete_expense', { id })` → `src-tauri/src/commands/expenses.rs:108-111`.
- **IMPORTS**: N/A.
- **GOTCHA**: No automated test exists; this is the only check for the runtime path. If the list does not appear at all, check `useExpenses.ts:42-44` (initial `refresh` on mount).
- **VALIDATE**: `npm run tauri dev` (or `npm run dev`).

---

## TESTING STRATEGY

There are no automated tests in this repository (see `AGENTS.md` → "Testing and Validation" — "No application tests currently exist"). Verification is typecheck + lint + build, plus manual smoke.

### Unit Tests

- None. No test runner is configured in `package.json` (no `vitest`, `jest`, etc.). Do not add a runner in this plan.

### Integration Tests

- None. Same reason. The Tauri command round-trip is exercised manually.

### Edge Cases

The list must behave correctly in all of the following. The implementation agent should walk through each in a manual smoke pass:

1. **No expenses yet** — empty state shown at `ExpenseList.tsx:41-43`. Verify text reads "No expenses yet. Add your first expense above."
2. **Many expenses, mixed dates** — backend sorts by `date DESC, created_at DESC` (`expenses.rs:75`). Verify newest date appears first; within the same date, the most recently created appears first.
3. **Expense with empty `note`/`paymentMethod`** — both render as `"-"` (see `ExpenseList.tsx:67-68`). Verify the cell does not show `undefined` or `null`.
4. **Currency symbol change** — pass a non-default `currencySymbol` (e.g. `"€"`) and verify all amounts re-format accordingly. (Not used in production, but the contract is exposed.)
5. **Delete confirm declined** — `window.confirm` returns falsy → no state change, no spinner.
6. **Delete confirm accepted, success** — row disappears (optimistic in `useExpenses.ts:68`), no error state.
7. **Delete in flight** — only the targeted row's button is disabled and reads "Deleting..."; other rows are unaffected.
8. **Backend delete failure** — `removeExpense` returns `false`, hook sets `error` (`useExpenses.ts:72-74`), row remains in the list, the inline error branch (`ExpenseList.tsx:32-39`) shows the message and a Retry button.
9. **Initial load error** — `refresh` rejects, list shows the error branch with a Retry button.
10. **Stale `Expense` type** — if a backend field is removed, TS will fail the `expense.categoryName` access at `ExpenseList.tsx:65`. Surface that as a typecheck failure, not a runtime crash.

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness. Run from the repository root.

### Level 1: Syntax & Style

```
npm run lint
```

- Runs ESLint over `*.ts,*.tsx` with `--max-warnings 0`. Must exit 0.

```
npx tsc -b --noEmit
```

- The `typecheck` script does the same; either is fine.

### Level 2: Unit Tests

- None configured. Skip.

### Level 3: Integration Tests

- None configured. Skip.

### Level 4: Manual Validation

1. `npm run tauri dev` — launches the Tauri shell. (If Tauri is not set up locally, `npm run dev` is acceptable for the React-only smoke.)
2. In the app:
   - Add two expenses on different dates; confirm date-desc ordering.
   - Add an expense without a note; confirm `"-"` is shown.
   - Click Delete on a row, decline the confirm, confirm the row stays.
   - Click Delete, accept the confirm, confirm the row disappears and no error appears.
   - Click Delete on a row, accept the confirm, while in flight try to delete another row and confirm the second click is unaffected.

### Level 5: Additional Validation

- `npm run build` — runs `tsc -b && vite build`. Must exit 0. Confirms the production bundle compiles (CSS included).

---

## ACCEPTANCE CRITERIA

- [ ] `ExpenseList` renders the existing 6-column table (Date, Category, Amount, Payment, Note, Actions) with the column order from `ExpenseList.tsx:53-59`.
- [ ] Each row's Category cell shows the joined `categoryName` (no client-side lookup).
- [ ] Each row's Amount cell is right-aligned, monospaced numerics, prefixed by `currencySymbol` and formatted to two decimals.
- [ ] Each row's Date cell uses `toLocaleDateString()` and shows the user's locale date.
- [ ] Empty `note` and empty `paymentMethod` render as `"-"` (not `null`/`undefined`).
- [ ] Loading state shows "Loading expenses..." inside `.loading`.
- [ ] Error state shows the error message and a Retry button that calls `refresh`.
- [ ] Empty state shows "No expenses yet. Add your first expense above." inside `.empty`.
- [ ] Delete requires `window.confirm`; declining leaves the list unchanged.
- [ ] While a delete is in flight, that row's button reads "Deleting..." and is disabled; other rows are unaffected.
- [ ] On delete success, the row is removed (via the hook's optimistic update); no error appears.
- [ ] On delete failure, the row remains, the error state shows the message, and a Retry is available.
- [ ] Sort order is `date DESC, created_at DESC` (provided by the backend, not the client).
- [ ] `npm run lint` passes with zero warnings.
- [ ] `npx tsc -b --noEmit` (or `npm run typecheck`) passes with zero errors.
- [ ] `npm run build` produces a production bundle with no errors.
- [ ] No new files, no new dependencies, no new Tauri commands, no SQL changes.

---

## COMPLETION CHECKLIST

- [ ] `src/features/expenses/ExpenseList.tsx` reviewed; only the minimum a11y change (caption) is applied unless a structural drift is found.
- [ ] `src/styles.css` extended with the new classes listed in Phase 2; existing rules preserved.
- [ ] `src/App.tsx` confirmed unchanged (still passes `currencySymbol`).
- [ ] `npm run lint` → 0 warnings.
- [ ] `npx tsc -b --noEmit` → 0 errors.
- [ ] `npm run build` → success.
- [ ] Manual smoke (10 edge cases in "Edge Cases") all pass.
- [ ] No new files, no new dependencies, no new Tauri commands, no SQL changes.
- [ ] `AGENTS.md` and `PRD.md` not modified.

---

## NOTES

- The feature is intentionally small because the data path is already in place: `useExpenses` loads and joins categories, `expenseApi.deleteExpense` invokes the Rust command, and the Rust command deletes by id. Anything beyond "list + delete" would be a new feature, not an enhancement.
- The `Expense` type at `src/features/expenses/expenseTypes.ts:8-18` already carries `categoryName`, so the component does not need a separate categories fetch. The categories array on the hook is only used by `ExpenseForm`.
- `useExpenses` is shared between `ExpenseList` and `ExpenseForm` (`ExpenseForm.tsx:7`). This means a successful `addExpense` updates the list instantly (optimistic prepend at `useExpenses.ts:51`), and a successful `removeExpense` removes the row instantly (optimistic filter at `useExpenses.ts:68`). The component does not need to call `refresh` after a delete — but if the hook ever changes that contract, the Retry button on the error branch is the safety net.
- The currency symbol is passed as a prop rather than read from settings because `useSettings` is not present in this iteration (only `useExpenses` and `useCategories` exist as hooks). When a settings hook is added, the prop can be replaced by a context read; for now the parent's `currencySymbol="$"` at `src/App.tsx:12,15` is the single source of truth.
- `window.confirm` is the project's chosen confirm pattern (`CategoryList.tsx:54`). Do not introduce a custom modal for delete confirmation in this plan.
- Accessibility: the visually-hidden `<caption>` is the only a11y addition in this plan. A future iteration could add per-row `aria-label` on the delete button (e.g. `Delete expense of $12.34 on 2024-05-01`) and keyboard focus styles — flag for a follow-up plan, do not include here.
