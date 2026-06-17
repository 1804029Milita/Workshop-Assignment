---
description: Create a git commit with all uncommitted changes
---

# Commit: Stage and Commit Changes

## 1. Review Changes

Check the current state of the working tree:

```bash
git status
git diff HEAD
git status --porcelain
```

Review all uncommitted changes carefully to understand what will be committed.

## 2. Stage Files

Add all relevant untracked and changed files:

```bash
git add -A
```

If selective staging is needed, stage files by category.

## 3. Create Commit

Write an atomic commit message with a conventional commit prefix:

- `feat:` — A new feature
- `fix:` — A bug fix
- `docs:` — Documentation changes
- `style:` — Formatting, missing semicolons, etc.
- `refactor:` — Code restructuring
- `perf:` — Performance improvements
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks
- `build:` — Build system changes
- `ci:` — CI configuration changes

The commit message should be concise but descriptive of what changed and why.
