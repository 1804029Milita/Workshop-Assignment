---
description: Initialize PHP Laravel or Java Spring Boot project for local development
---

# Initialize Project

## Detect Project Type

Check which project type this is:

```bash
# Laravel / PHP project
ls artisan composer.json 2>/dev/null && echo "LARAVEL"

# Java / Spring Boot project
ls build.gradle build.gradle.kts pom.xml 2>/dev/null && echo "JAVA"
```

---

## PHP / Laravel (Blade) Setup

Post-requisites:
- PHP 8.1+ (`php -v`)
- Composer (`composer --version`)
- Node.js 18+ (`node -v`)
- Database (MySQL/PostgreSQL/SQLite configured in `.env`)

### 1. Install Dependencies

```bash
composer install
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` to set database credentials, mail config, and app URL.

### 3. Run Database Migrations

```bash
php artisan migrate
# Seed demo data if available:
php artisan db:seed
```

### 4. Build Frontend Assets

```bash
# Development (Vite hot-reload)
npm run dev

# Production build
npm run build
```

### 5. Start Development Server

```bash
php artisan serve
```

Opens at http://localhost:8000.

### 6. Validate Setup

```bash
curl -s http://localhost:8000 | head -20
php artisan route:list
php artisan tinker --execute="echo 'DB OK: ' . DB::connection()->getDatabaseName();"
```

### Useful Artisan Commands

```bash
php artisan make:model Post -mfsc   # Model + migration + factory + seeder + controller
php artisan make:livewire PostList   # Livewire component
php artisan make:mail OrderShipped   # Mail class
php artisan queue:work               # Process queued jobs
php artisan storage:link             # Create public storage symlink
```

### Cleanup

```bash
# Stop dev server: Ctrl+C
# Reset database: php artisan migrate:fresh --seed
# Clear cache: php artisan optimize:clear
```

---

## Java / Spring Boot Setup

Post-requisites:
- Java 17+ (`java -version`)
- Gradle wrapper (`./gradlew`) or Maven wrapper (`./mvnw`)

### 1. Configure Application

```bash
# Default settings in src/main/resources/application.properties / application.yml
# Override via env or CLI args:
# ./gradlew bootRun --args='--app.default-currency=USD'
```

### 2. Build the Project

```bash
./gradlew build
# or
./mvnw clean package
```

### 3. Run Database Migrations

```bash
# Flyway / Liquibase run automatically on startup
# Or JPA ddl-auto=update for dev
```

### 4. Start Development Server

```bash
./gradlew bootRun
# or
./mvnw spring-boot:run
```

Starts on port 8080 with live-reload (devtools).

### 5. Validate Setup

```bash
curl -s http://localhost:8080/actuator/health
curl -s http://localhost:8080 | head -20
```

### Access Points

- Web UI / API: http://localhost:8080
- DevTools H2 console (if enabled): http://localhost:8080/h2-console

### Cleanup

```bash
# Stop dev server: Ctrl+C
# Full clean: ./gradlew clean
```

---

## Docker Setup (Either Project Type)

```bash
docker compose up -d --build
docker compose down
```
