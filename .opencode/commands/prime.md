---
description: Prime agent with codebase understanding
---

# Prime: Load Project Context

## Objective

Build comprehensive understanding of the codebase by analyzing structure, documentation, and key files.

## Process

### 1. Analyze Project Structure

List all tracked and untracked files:
!`git ls-files`
!`git status`

Show directory tree:
- Linux/macOS: `tree -L 3 -I 'node_modules|__pycache__|.git|dist|build|vendor|.gradle|storage'`

### 2. Detect Project Type

```bash
# Check for Laravel / PHP
ls artisan composer.json 2>/dev/null && echo "Type: Laravel/PHP"

# Check for Spring Boot / Java
ls build.gradle build.gradle.kts pom.xml 2>/dev/null && echo "Type: Java/Spring Boot"

# Check for Node.js frontend
ls package.json 2>/dev/null && echo "Type: Node.js"
```

### 3. Read Core Documentation

- Read PRD.md, README.md, CONTEXT.md or similar spec files
- Read AGENTS.md or CLAUDE.md (global rules)
- Read architecture documentation if present
- Read `.env.example` (Laravel) or `application.yml` (Spring Boot) for environment config

### 4. Identify Key Files

Based on project type, read:

**Laravel:**
- `routes/web.php` — all web routes
- `routes/api.php` — API routes (if exists)
- `app/Providers/AppServiceProvider.php` — bindings and boot logic
- `database/migrations/` — latest migration for schema understanding
- `app/Models/` — key Eloquent models
- `composer.json` — dependencies and scripts
- `package.json` — frontend scripts and dependencies

**Spring Boot:**
- Main entry point (`@SpringBootApplication` class)
- `src/main/resources/application.yml` — configuration
- `pom.xml` or `build.gradle` — dependencies and plugins
- Key controller / service / repository files
- Security config (if present)

### 5. Understand Current State

!`git log -10 --oneline`

## Output Report

Provide a concise summary covering:

### Project Overview
- Purpose and type of application
- Primary technologies and frameworks
- Current version/state

### Architecture
- Overall structure and organization
- Key architectural patterns identified
- Important directories and their purposes

### Tech Stack
- Languages and versions
- Frameworks and major libraries
- Build tools and package managers
- Testing frameworks

### Core Principles
- Code style and conventions observed
- Documentation standards
- Testing approach

### Current State
- Active branch
- Recent changes or development focus
- Any immediate observations or concerns

**Make this summary easy to scan — use bullet points and clear headers.**
