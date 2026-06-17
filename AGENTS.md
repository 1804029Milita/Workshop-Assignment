# AGENTS.md

Global rules for working in this repository.

## Project Overview

This repository is a workshop assignment for agentic AI coding workflows. It currently contains setup instructions, opencode commands/skills, and planning documents rather than a fully scaffolded application.

The active product direction from the current conversation is a **local-first Expense Tracker desktop application** built with **Tauri**, **React + TypeScript**, and **SQLite**. Earlier workshop instructions mention a password manager prompt, but for current implementation work prefer `PRD.md` unless the user explicitly changes the product scope.

## Project Type

**Planning/workshop repo for a Tauri desktop application.**

Current indicators:

- No root `package.json`, `composer.json`, `pom.xml`, `build.gradle`, or application source code yet.
- Existing project context lives in `README.md`, `instructions.md`, `PRD.md`, `.agents/`, and `.opencode/`.
- The intended application architecture is Tauri desktop with a React + TypeScript frontend and local SQLite persistence.

## Tech Stack Summary

| Area | Technology | Current Status |
|---|---|---|
| Desktop shell | Tauri | Planned |
| Frontend | React + TypeScript | Planned |
| Backend bridge | Tauri commands / Rust backend | Planned |
| Persistence | SQLite | Planned |
| Agent tooling | OpenCode / opencode commands and skills | Present |
| Documentation | Markdown PRD and instructions | Present |

## Commands

There are currently no root application build, test, lint, or dev scripts because the app has not been scaffolded yet.

### Current useful commands

```bash
opencode
```

Starts the OpenCode CLI in this repository.

### Expected commands after Tauri app scaffold

Use these only after `package.json` and `src-tauri/` exist:

```bash
npm install
npm run dev
npm run build
npm run tauri dev
npm run tauri build
```

If TypeScript validation is configured:

```bash
npm run typecheck
```

If linting is configured:

```bash
npm run lint
```

For Rust-side validation inside the Tauri backend:

```bash
cd src-tauri
cargo check
```

## Structure

```text
.
├── README.md              # Workshop overview
├── instructions.md        # Setup guide and original project prompt
├── PRD.md                 # Current product requirements for Expense Tracker MVP
├── .agents/               # Agent skills and AGENTS.md template
│   ├── AGENT-template.md
│   └── skills/
├── .opencode/             # OpenCode plugin, commands, and agent configuration
│   ├── commands/
│   ├── package.json
│   └── agent/
└── .gitignore             # Local git ignore rules
```

## Architecture

When implementation begins, follow the architecture described in `PRD.md`:

```text
React + TypeScript UI
        |
        | Tauri invoke() command wrappers
        v
Rust backend / Tauri commands
        |
        v
SQLite database
```

Preferred MVP architecture:

- Local-first: no cloud sync, no remote API, no user accounts.
- Frontend owns UI state, forms, and validation feedback.
- Tauri/Rust backend owns database operations and persistence.
- SQLite stores settings, categories, and expenses.
- Frontend calls typed wrappers around Tauri commands.

## Patterns

### General Agent Patterns

- Read the relevant file before editing it.
- Prefer small, focused changes.
- Do not create new files unless they are needed for the requested task.
- Do not assume missing requirements; ask when a decision affects implementation.
- Keep documentation updates focused and avoid duplicating existing docs unnecessarily.

### Product/Requirement Patterns

- Treat `PRD.md` as the source of truth for the current Expense Tracker MVP.
- If requirements conflict with `instructions.md`, ask the user or follow the most recent explicit product decision.
- Keep MVP scope tight:
  - First-launch currency setup
  - Expense CRUD
  - Category management
  - SQLite persistence
  - Minimal validation

### Code Patterns to Follow Once App Exists

- Use TypeScript types/interfaces for expenses, categories, settings, and command payloads.
- Keep Tauri command wrappers centralized in frontend API files.
- Keep database logic on the Rust/Tauri backend side.
- Validate required fields before saving:
  - Amount must be greater than zero.
  - Date must be valid.
  - Category must exist.
  - Note and payment method are optional.
- Use clear user-facing error messages instead of raw stack traces.
- Prevent inconsistent category deletion; recommended MVP behavior is to block deletion when a category is used by expenses.

## Testing and Validation

No application tests currently exist.

When tests are added, follow the project setup:

- Frontend tests should live near relevant features or in a dedicated `src/**/*.test.*` structure.
- Rust/Tauri database logic should use Rust tests where practical.
- Validate both frontend and backend after feature changes.

Before committing code after implementation, run the available validation commands for the scaffolded project:

```bash
npm run typecheck
npm run lint
npm run build
npm run tauri build
```

If Rust validation is separate:

```bash
cd src-tauri
cargo check
```

## Security Model

MVP is local-only:

- No authentication.
- No remote API.
- No cloud sync.
- No API keys or secrets required.
- Do not add network integrations unless explicitly requested.
- Do not hard-code credentials, tokens, or private data.

## Key Files

| File | Purpose |
|---|---|
| `README.md` | Workshop overview and high-level goal |
| `instructions.md` | Original setup guide and workshop prompt |
| `PRD.md` | Current Expense Tracker MVP requirements |
| `.agents/AGENT-template.md` | Template for global agent rules |
| `.opencode/commands/` | OpenCode command definitions |
| `.agents/skills/` | Installed agent skills |

## On-Demand Context

| Topic | File |
|---|---|
| Product requirements | `PRD.md` |
| Workshop setup | `instructions.md` |
| Agent rule template | `.agents/AGENT-template.md` |
| OpenCode commands | `.opencode/commands/` |

## Notes

- This repository is not yet a complete Tauri application.
- Do not treat `.opencode/package.json` as the app's frontend package file.
- If scaffolding a Tauri app, create a root `package.json` and `src-tauri/` structure.
- If the user asks to build, start from the phased implementation plan in `PRD.md`.
