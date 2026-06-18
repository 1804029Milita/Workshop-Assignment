# Feature: basic-error-handling

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Add a small, consistent error-handling layer to the React frontend:

- A top-level **React error boundary** that catches render-time exceptions anywhere in the tree and shows a fallback with a single **Reload app** button. Mounted once, in `src/main.tsx`, wrapping `<App />`.
- A shared **`<ErrorBanner message onRetry />`** component used by both `ExpenseList` and `CategoryList` to render hook-level string errors. It centralises the existing ad-hoc error JSX at `src/features/expenses/ExpenseList.tsx:32-39` and `src/features/categories/CategoryList.tsx:15-22` into one component with consistent styling.

The backend `AppError` already serializes as a plain string (`src-tauri/src/error.rs:15-22`), which the frontend already stringifies with `err instanceof Error ? err.message : 'Failed to …'` in the hooks (e.g. `useExpenses.ts:33`). No Rust, no Tauri command, no DB, no schema changes are needed for this plan. No new dependencies. No test runner.

Out of scope (explicit non-goals):
- No global toast/notification queue, no context provider, no event bus.
- No retries with exponential backoff.
- No logging to disk or telemetry.
- No error reporting to a remote service.
- No changes to validation error rendering in `ExpenseForm` / `CategoryForm` (those are form-local arrays, intentionally separate from async-hook errors).
- No new dependencies, no new Tauri commands, no Rust changes.

## User Story

As a desktop expense-tracker user
I want a single, consistent error UI for both the expense and category lists, and a graceful fallback if the app ever crashes during rendering
So that I can understand what went wrong and recover (retry the list or reload the app) without seeing raw stack traces or inconsistent messages.

## Problem Statement

Error UX is currently fragmented:

- The expense list and category list each render their own ad-hoc `<div className="error"><p>{error}</p><button onClick={refresh}>Retry</button></div>` (`ExpenseList.tsx:32-39`, `CategoryList.tsx:15-22`). The CSS for `.error` is not defined anywhere in `src/styles.css` — only `.btn-delete` and `.actions` are styled — so errors render as unstyled text.
- There is no React error boundary (`grep -r "ErrorBoundary|componentDidCatch" src/` → 0 matches). A render-time throw (e.g. a bad `categoryName` access, a future React 18 strict-mode bug) would unmount the entire tree and leave a blank screen.
- The Rust side already does the right thing: `AppError::serialize` emits a human-readable string (`error.rs:15-22`). The frontend just needs to render that string consistently.

## Solution Statement

Add two new files under `src/components/`:

1. `src/components/ErrorBoundary.tsx` — a class component implementing `getDerivedStateFromError` + `componentDidCatch`. Renders `children` when there is no error; otherwise renders a fallback with the error message and a single **Reload app** button (`window.location.reload()`). Mounted in `src/main.tsx:6-9`, wrapping `<App />`.
2. `src/components/ErrorBanner.tsx` — a presentational component `<ErrorBanner message onRetry />` that replaces the inline error JSX in both lists. It reuses the existing `.error` class (so the new CSS rule applies to the boundary fallback too) and the existing global `.actions` and button styles.

Add two small CSS rules to `src/styles.css`:

- `.error` — red-tinted box, padding, border, role text color.
- `.btn-retry` — minor variant on the default button (replaces the un-styled Retry button in the current list fallback).

Update the two lists to use `<ErrorBanner message={error} onRetry={refresh} />` instead of the inline error block. No hook changes. No new types. No new dependencies.

## Feature Metadata

- **Feature Type**: New Capability (introduces an error boundary and a shared banner component) + small Enhancement (deduplicates the two inline error blocks).
- **Estimated Complexity**: Low. 2 new files, 1 edit to `main.tsx`, 2 edits to feature lists, 1 small CSS addition, no backend changes.
- **Primary Systems Affected**:
  - `src/components/ErrorBoundary.tsx` (new)
  - `src/components/ErrorBanner.tsx` (new)
  - `src/main.tsx` (wrap with boundary)
  - `src/features/expenses/ExpenseList.tsx` (use ErrorBanner)
  - `src/features/categories/CategoryList.tsx` (use ErrorBanner)
  - `src/styles.css` (add `.error`, `.btn-retry`)
- **Dependencies**: None new. Uses `react` and `react-dom` (already in `package.json`).

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/main.tsx:1-10` — Entry point. Currently renders `<React.StrictMode><App /></React.StrictMode>`. The boundary must wrap `<App />`, **inside** `StrictMode` is fine (StrictMode in dev double-invokes lifecycle methods, but the boundary only catches renders, not lifecycle double-invokes).
- `src/features/expenses/ExpenseList.tsx:32-39` — Inline error block to be replaced by `<ErrorBanner />`. Note the `refresh` callback comes from `useExpenses`.
- `src/features/categories/CategoryList.tsx:15-22` — Same pattern in the category list. `refresh` comes from `useCategories`.
- `src/features/expenses/useExpenses.ts:5-81` — Data hook. Already exposes `{ error, refresh }`. The `error` is `string | null`. Do not change the hook.
- `src/features/categories/useCategories.ts:6-106` — Same. Do not change.
- `src/styles.css:1-115` — Global stylesheet. Already defines `.btn-delete`, `.actions`, `.deleting`, `.empty`, `.visually-hidden`, `.expense-list`, etc. Append `.error` and `.btn-retry` here, do not replace existing rules.
- `src-tauri/src/error.rs:1-22` — `AppError` already serializes as `serialize_str(&self.to_string())`. The frontend receives a plain string from `invoke()` rejections. The `instanceof Error` checks in the hooks (`useExpenses.ts:33, 56, 73`) correctly read `err.message` from the Tauri-shaped error object.
- `src/App.tsx:1-22` — Parent component. No change required; boundary is mounted above it in `main.tsx`.
- `src/features/expenses/ExpenseForm.tsx:15-69`, `src/features/categories/CategoryForm.tsx:17-70` — Form-local validation/submit errors. **Out of scope**. They use local `errors` / `submitError` state and are intentionally separate from async-hook errors.

### New Files to Create

- `src/components/ErrorBoundary.tsx` — Class error boundary; default export a named `ErrorBoundary` component; props: `{ children: React.ReactNode }`.
- `src/components/ErrorBanner.tsx` — Function component; default export a named `ErrorBanner`; props: `{ message: string; onRetry: () => void }`.

### New Files to Create (if extracting later — NOT for this plan)

> Listed only to flag future direction. Do not create in this iteration:
> - `src/components/ErrorBoundary.module.css` — would isolate boundary styles if they grow.
> - `src/components/Toast.tsx` / `src/lib/notify/` — would back a future global toast/queue.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- React 18 — `ErrorBoundary`: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  - Section: `getDerivedStateFromError` / `componentDidCatch` — Why: required for any error-boundary class component.
- React 18 — `StrictMode` and double-invocation: https://react.dev/reference/react/StrictMode
  - Section: Double-invocation of effects — Why: confirms the boundary is safe to mount under StrictMode.
- Tauri 2 — error from `invoke`: https://v2.tauri.app/develop/calling-rust/
  - Section: Error handling — Why: confirms rejections arrive as a string (because of `AppError::serialize` at `error.rs:15-22`) and `err.message` is the user-facing message.
- MDN — `window.location.reload()`: https://developer.mozilla.org/en-US/docs/Web/API/Location/reload
  - Section: Reloading the page — Why: the boundary's recovery action.

### Patterns to Follow

**Naming Conventions:**
- Component files: PascalCase (`ErrorBoundary.tsx`, `ErrorBanner.tsx`). Default-export a named function.
- CSS classes: lowercase, hyphenated (`.error`, `.btn-retry`). Match existing `.btn-delete`, `.empty`, `.visually-hidden`.
- The new directory `src/components/` follows the existing flat-by-feature-then-shared structure (`src/features/...`, `src/lib/validation/...`).

**Error Handling (frontend):**
- The boundary catches **render-time** throws only. Async errors thrown inside event handlers or inside `useEffect` continue to be handled by the existing per-hook `error` state — the boundary does **not** replace that.
- The boundary fallback uses the same `.error` class the banner uses, so a single CSS rule covers both.
- The boundary does **not** call `console.error` itself, but `componentDidCatch` is the right place if logging is ever added. For this plan, simply receive the error; do not log.

**Error Handling (backend):**
- Do not touch `src-tauri/src/error.rs` — `AppError` already serializes as a string and is the canonical surface for user-facing messages.

**Logging Pattern:** None. No `console.error` in the boundary, no `console.log` anywhere. The existing hooks also do not log.

**Other Relevant Patterns:**
- Existing per-feature error blocks use a `<button onClick={refresh}>Retry</button>` (`ExpenseList.tsx:36`, `CategoryList.tsx:20`). Keep that button text — only the wrapper changes.
- `isMounted` ref pattern in `useExpenses.ts:10-17` and `useCategories.ts:10-17` is not relevant here (the boundary does not own async state).
- No new dependencies, no new TypeScript types beyond a `Props` interface local to each component.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — `ErrorBoundary`

Create `src/components/ErrorBoundary.tsx` as a class component with `getDerivedStateFromError` (sets `hasError: true`) and `componentDidCatch` (no-op for this plan, but present so the boundary is a real React boundary, not a stub). Props: `{ children: React.ReactNode }`. Fallback renders a `<div className="error" role="alert">` containing the error message and a single `<button onClick={() => window.location.reload()} className="btn-retry">Reload app</button>`.

### Phase 2: Foundation — `ErrorBanner`

Create `src/components/ErrorBanner.tsx` as a function component. Props: `{ message: string; onRetry: () => void }`. Renders `<div className="error" role="alert"><p>{message}</p><div className="actions"><button onClick={onRetry} className="btn-retry">Retry</button></div></div>`. Use the same `.error` and `.actions` classes the boundary uses so the styles are shared.

### Phase 3: Integration

- `src/main.tsx:1-10` — wrap `<App />` with `<ErrorBoundary>`. Keep `StrictMode` outside (or inside — either is fine; keep current order, just add the boundary as the inner wrapper).
- `src/features/expenses/ExpenseList.tsx:32-39` — replace the inline error block with `<ErrorBanner message={error} onRetry={refresh} />`.
- `src/features/categories/CategoryList.tsx:15-22` — same replacement.
- `src/styles.css` — append `.error` and `.btn-retry` rules. Use the project's existing color palette (the body text is `#333`, body bg is `#f5f5f5`, danger is `#b00020`). `.error` is a red-tinted box matching the danger palette; `.btn-retry` is a small neutral button.

### Phase 4: Verification

Typecheck and build. Manual smoke covers the boundary (intentionally throw in dev to see fallback), the banner (start the app with a deliberately broken DB path), and the no-regression check (a working app must still render normally).

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

### CREATE `src/components/ErrorBoundary.tsx`

- **IMPLEMENT**: Class component. State `{ hasError: boolean; error: Error | null }`. `getDerivedStateFromError(error)` returns `{ hasError: true, error }`. `componentDidCatch()` is a no-op. Render: if `hasError`, return `<div className="error" role="alert"><p>{error?.message ?? 'Something went wrong.'}</p><button onClick={() => window.location.reload()} className="btn-retry">Reload app</button></div>`. Otherwise return `children`.
- **PATTERN**: React 18 reference docs (linked above). Project convention for components: `export function Foo(...)` (see `ExpenseList.tsx:5`); the boundary, being a class, follows the same export style: `export class ErrorBoundary extends React.Component<Props, State> { ... }`.
- **IMPORTS**: `import React from 'react'`. No other imports. Do not import `ErrorInfo` types beyond what the class needs.
- **GOTCHA**: Do **not** import `Component` as a default and use it as a function — must be a class. Do **not** add `console.error(error)` to `componentDidCatch` (the project has no logger convention; keep it quiet).
- **VALIDATE**: `npx tsc -b --noEmit`

### CREATE `src/components/ErrorBanner.tsx`

- **IMPLEMENT**: Function component. Props `{ message: string; onRetry: () => void }`. Render `<div className="error" role="alert"><p>{message}</p><div className="actions"><button onClick={onRetry} className="btn-retry">Retry</button></div></div>`. The `<p>` is for the message; `<div className="actions">` is for the button (matches the global `.actions` flex rule at `styles.css:31-34`).
- **PATTERN**: Same `.error` class the boundary uses, so one CSS rule covers both. Reuses global `.actions` (`styles.css:31-34`).
- **IMPORTS**: None beyond React types. Use an inline `interface ErrorBannerProps` (no need to export a type).
- **GOTCHA**: The hook returns `error: string | null`. The list already early-returns on `if (error)` (`ExpenseList.tsx:32`, `CategoryList.tsx:15`), so the `message` prop is always a string by the time it reaches the banner. No narrowing needed in the banner.
- **VALIDATE**: `npx tsc -b --noEmit`

### UPDATE `src/main.tsx`

- **IMPLEMENT**: Import the boundary and wrap `<App />`. Keep `StrictMode` as the outermost wrapper. Final structure:
  ```tsx
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
  ```
- **PATTERN**: Mounts the boundary at the top of the React tree, matching the React docs recommendation.
- **IMPORTS**: Add `import { ErrorBoundary } from './components/ErrorBoundary';` at the top.
- **GOTCHA**: Do **not** wrap `StrictMode` inside the boundary — the boundary would then have nothing to catch above it. Order matters.
- **VALIDATE**: `npx tsc -b --noEmit`

### UPDATE `src/features/expenses/ExpenseList.tsx`

- **IMPLEMENT**: Add `import { ErrorBanner } from '../../components/ErrorBanner';`. Replace the `if (error) { return ( <div className="error"> <p>{error}</p> <button onClick={refresh}>Retry</button> </div> ); }` block (`ExpenseList.tsx:32-39`) with `if (error) { return <ErrorBanner message={error} onRetry={refresh} />; }`. Do not touch the loading or empty branches.
- **PATTERN**: Hook returns `error: string | null` and `refresh: () => Promise<void>` (`useExpenses.ts:19-40, 80`). Pass them straight through.
- **IMPORTS**: Add the new import. No removal of existing imports.
- **GOTCHA**: The new import path is `../../components/ErrorBanner` because the file lives at `src/features/expenses/ExpenseList.tsx` and the component lives at `src/components/ErrorBanner.tsx`. Do not introduce a relative-path mistake (`../components/...` would be wrong).
- **VALIDATE**: `npx tsc -b --noEmit`

### UPDATE `src/features/categories/CategoryList.tsx`

- **IMPLEMENT**: Add `import { ErrorBanner } from '../../components/ErrorBanner';`. Replace the `if (error)` block (`CategoryList.tsx:15-22`) with `if (error) { return <ErrorBanner message={error} onRetry={refresh} />; }`. Do not touch other branches.
- **PATTERN**: Same as Task 4; `refresh` is from `useCategories`.
- **IMPORTS**: Add the new import. No removal of existing imports.
- **GOTCHA**: Same path rule as Task 4.
- **VALIDATE**: `npx tsc -b --noEmit`

### UPDATE `src/styles.css`

- **IMPLEMENT**: Append two rule blocks at the end of the file (do not replace existing rules). Use the existing palette (danger `#b00020`, body bg `#f5f5f5`, text `#333`):
  - `.error { color: #b00020; background-color: #fdecec; border: 1px solid #f5c2c2; border-radius: 4px; padding: 0.75rem 1rem; margin: 0.5rem 0; }`
  - `.btn-retry { padding: 0.25rem 0.75rem; background-color: #fff; color: #333; border: 1px solid #ccc; border-radius: 4px; }`
  - `.btn-retry:hover { background-color: #f5f5f5; }`
- **PATTERN**: Class-only, no nesting, no CSS variables, no preprocessor — match the flat style of `styles.css:1-115`.
- **IMPORTS**: None.
- **GOTCHA**: The existing `.btn-delete` uses `#b00020` for the background. The new `.btn-retry` is intentionally a neutral button so the error box's red color remains the dominant signal. Do not give `.btn-retry` a red background.
- **VALIDATE**: `npm run build` (Vite will fail on a malformed CSS rule; ESLint is not installed — see "Deviations" below).

### VERIFY no regressions

- **IMPLEMENT**: Run `npm run typecheck` and `npm run build`. Both must exit 0. No new files in `src-tauri/`, no `package.json` change, no new dependency.
- **PATTERN**: Project's existing CI-equivalent checks.
- **IMPORTS**: N/A.
- **GOTCHA**: If `npx tsc` reports a "module not found" on `./components/ErrorBoundary` or `./components/ErrorBanner`, the file path or filename casing is wrong (Windows is case-insensitive at the FS layer but the bundler is case-sensitive).
- **VALIDATE**: `npm run typecheck` and `npm run build`.

### VERIFY boundary behavior manually (optional dev throw)

- **IMPLEMENT**: In `main.tsx`, temporarily change the line `import App from './App'` to a stub that throws: `import App from './App'` → temporarily replace `<App />` with `<>{(() => { throw new Error('boom'); })()}</>`. Run `npm run dev`, observe the boundary fallback with "boom" and a Reload app button. Click Reload, observe the app reloads. Revert the stub.
- **PATTERN**: Manual smoke only.
- **IMPORTS**: N/A.
- **GOTCHA**: The dev server is interactive; this task is a manual check, not a CI step. If the user declines to run it, document and move on.
- **VALIDATE**: `npm run dev` (manual).

---

## TESTING STRATEGY

There are no automated tests in this repository (see `AGENTS.md` → "Testing and Validation" — "No application tests currently exist"). Verification is typecheck + build, plus manual smoke.

### Unit Tests

- None. No test runner is configured in `package.json` (no `vitest`, `jest`, etc.). Do not add a runner in this plan.

### Integration Tests

- None. Same reason.

### Edge Cases

The implementation agent should walk through each:

1. **No error** — both lists render normally (loading, empty, table). The banner and boundary are not visible.
2. **Load error** — `refresh()` rejects, hook sets `error` (`useExpenses.ts:31-34`), list shows the `<ErrorBanner />` with the message and a Retry button. Clicking Retry calls `refresh()` and clears the error.
3. **Action error (delete/create/update)** — hook sets `error` (`useExpenses.ts:56, 73`), list re-renders the `<ErrorBanner />` block because the `if (error)` branch returns before the table. The list does not optimistically remove on failure (the hook only optimistically removes on success at `useExpenses.ts:68`).
4. **Form-local validation** — `ExpenseForm.tsx:62-69` / `CategoryForm.tsx:62-70` continue to show their local error arrays. They are not affected by the banner. (Out of scope.)
5. **Render-time throw in a child** — boundary catches, fallback shows the thrown error message (or the generic "Something went wrong." fallback) and a Reload app button. Clicking it calls `window.location.reload()`.
6. **Render-time throw in `App` itself** — same as #5; boundary sits above `App`.
7. **Render-time throw inside the boundary fallback** — nothing catches it; the user sees a blank screen. Acceptable for this iteration. Future improvement: nest boundaries.
8. **Long error message** — `<p>` wraps; CSS `padding`/`border-radius` keep the box visually consistent.
9. **Retry spam** — each click calls `refresh`; the hook sets `loading: true` (`useExpenses.ts:21`), so the list shows "Loading expenses..." while the retry is in flight. No infinite loop.
10. **Reload app button** — calls `window.location.reload()`. In Tauri this reloads the WebView; in a browser it reloads the page. Both are acceptable for the local-first app.

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness. Run from the repository root.

### Level 1: Syntax & Style

```
npm run typecheck
```

- Runs `tsc -b --noEmit`. Must exit 0.

`npm run lint` is not actionable in this repo (ESLint is not installed — see `AGENTS.md` and the prior plan's "Deviations" note).

### Level 2: Unit Tests

- None configured. Skip.

### Level 3: Integration Tests

- None configured. Skip.

### Level 4: Manual Validation

1. `npm run dev` (or `npm run tauri dev` for the desktop shell) — launches the app.
2. **Working app** — both lists render normally. Confirm the new error UI is invisible.
3. **Banner path** — temporarily point the list to a known-bad invoke (e.g. edit `expenseApi.ts:9` to call `invoke('does_not_exist')`), or block the DB. Reload the app. Confirm the expense list shows a red error box with the Tauri error message and a Retry button. Revert.
4. **Boundary path** — temporarily make `App` throw on render (e.g. wrap the return in `throw new Error('boom')` inside `App.tsx`). Reload. Confirm the boundary fallback shows "boom" and a Reload app button. Click Reload; confirm the app reloads. Revert.
5. **No-regression** — restore everything. Confirm the app boots, both lists work, and no error UI is visible.

### Level 5: Additional Validation

```
npm run build
```

- Runs `tsc -b && vite build`. Must exit 0. Confirms production bundle (with new CSS) compiles.

---

## ACCEPTANCE CRITERIA

- [ ] `src/components/ErrorBoundary.tsx` exists and exports a class component that catches render-time errors and renders a fallback with the error message and a single Reload app button.
- [ ] `src/components/ErrorBanner.tsx` exists and exports a function component that takes `message` and `onRetry` props and renders an `.error` block with the message and a Retry button.
- [ ] `src/main.tsx` wraps `<App />` with `<ErrorBoundary>` (StrictMode remains the outermost wrapper).
- [ ] `src/features/expenses/ExpenseList.tsx` uses `<ErrorBanner />` for the `if (error)` branch; the inline `<div className="error">` block is removed.
- [ ] `src/features/categories/CategoryList.tsx` uses `<ErrorBanner />` for the `if (error)` branch; the inline `<div className="error">` block is removed.
- [ ] `src/styles.css` has a `.error` rule and a `.btn-retry` rule; existing rules are intact.
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run build` produces a production bundle with no errors.
- [ ] Manual smoke (10 edge cases) all pass.
- [ ] No new files outside `src/components/` and the two list files; no new dependencies; no Rust/Tauri/DB changes.

---

## COMPLETION CHECKLIST

- [ ] `src/components/ErrorBoundary.tsx` created.
- [ ] `src/components/ErrorBanner.tsx` created.
- [ ] `src/main.tsx` updated to wrap `<App />` with `<ErrorBoundary>`.
- [ ] `src/features/expenses/ExpenseList.tsx` inline error block replaced with `<ErrorBanner />`.
- [ ] `src/features/categories/CategoryList.tsx` inline error block replaced with `<ErrorBanner />`.
- [ ] `src/styles.css` extended with `.error` and `.btn-retry`; existing rules preserved.
- [ ] `npm run typecheck` → 0 errors.
- [ ] `npm run build` → success.
- [ ] Manual smoke (10 edge cases) all pass.
- [ ] No new files outside the planned locations; no new dependencies; no Rust/Tauri/DB changes.
- [ ] `AGENTS.md`, `PRD.md`, `instructions.md`, and prior plan files not modified.

---

## NOTES

- The backend `AppError` already serializes as a string (`src-tauri/src/error.rs:15-22`). The frontend does **not** need a typed error class. The hooks already extract the message with `err.message` (e.g. `useExpenses.ts:33`).
- This plan intentionally does **not** introduce a global toast/queue or a context. The user explicitly chose "Boundary + shared ErrorBanner" over "Boundary + global toast system". If a toast is needed later, it would live at `src/lib/notify/` with a `<ToastProvider>` in `main.tsx` and a `useNotify()` hook consumed by the existing hooks.
- The boundary sits **inside** `StrictMode` on purpose. StrictMode double-invokes lifecycle methods in dev, but the boundary is a render boundary, not a lifecycle boundary, so the double-invocation does not produce two error overlays.
- `componentDidCatch` is kept as a no-op for this iteration. The plan deliberately does not add `console.error(error)` because the project has no logger convention. When logging is added, the natural place is `componentDidCatch(error, info)`.
- The fallback button is `window.location.reload()` rather than a "Try Again" that resets boundary state, per the user's choice ("Reload app button"). A Try-Again variant would need an extra `key` prop on the boundary to remount its children — out of scope here.
- The form-local error arrays in `ExpenseForm` and `CategoryForm` are intentionally untouched. They render inside the form (above the submit button), use their own `.errors` / `.submit-error` classes, and are a different concern from async-hook errors. Centralizing them would require either lifting state or adding a context — out of scope.
- `src/components/` is a new directory. It sits next to `src/features/` and `src/lib/`, following the existing flat-by-concern layout. The new directory does not need an `index.ts` barrel.
- ESLint is not installed in this repository. The plan's validation does not include `npm run lint`; verification is `npm run typecheck` + `npm run build` + manual smoke. If linting is later added, both new components and the two updated lists must pass the configured rules.
