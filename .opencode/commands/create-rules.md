---
description: Create global rules (AGENTS.md) from codebase analysis
---

# Create Global Rules

Generate a AGENTS.md file by analyzing the codebase and extracting patterns.

---

## Objective

Create project-specific global rules that give AI agent context about:
- What this project is
- Technologies used
- How the code is organized
- Patterns and conventions to follow
- How to build, test, and validate

---

## Phase 1: DISCOVER

### Identify Project Type

First, determine what kind of project this is:

| Type | Indicators |
|------|------------|
| Laravel (Blade) | `artisan` in root, `composer.json` with `laravel/framework`, `resources/views/` with `.blade.php` files, `routes/web.php` |
| Laravel API | `artisan` in root, no Blade views, `routes/api.php`, returns JSON |
| Livewire Laravel | Laravel + `livewire/livewire` in composer.json, `app/Livewire/` components |
| Spring Boot API | `pom.xml` with `<parent>` spring-boot-starter-parent, or `build.gradle` with `org.springframework.boot` plugin, `@SpringBootApplication` |
| Spring Boot MVC | Spring Boot API + templates under `src/main/resources/templates/`, `@Controller` returning templates |
| Spring Cloud Microservice | `spring-cloud-starter` deps, `@EnableEurekaClient`, `@EnableFeignClients`, bootstrap.yml |
| Web App (Full-stack) | Separate client/server dirs, API routes |
| Web App (Frontend) | Angular/Next.js/React/Vue/Svelte, no server code |
| API/Backend (other) | Express/Fastify/FastAPI/etc, no frontend |
| Library/Package | `main`/`exports` in package.json, publishable |
| CLI Tool | `bin` in package.json, command-line interface |
| Monorepo | Multiple packages, workspaces config |
| Script/Automation | Standalone scripts, task-focused |

### Analyze Configuration

Look at root configuration files:

**Laravel / PHP:**
```
composer.json         → dependencies, PHP version, scripts, autoload
.env / .env.example   → environment config (DB, mail, app URL)
phpunit.xml           → PHPUnit configuration
artisan               → Laravel CLI entry point
package.json          → Node deps for frontend build (Vite, Alpine, Livewire)
tailwind.config.js    → Tailwind CSS config (common with Blade)
vite.config.js        → Vite bundler config
```

**Spring Boot / JVM:**
```
pom.xml              → Maven project: groupId, artifactId, parent, dependencies, plugins, profiles
build.gradle(.kts)   → Gradle project: plugins, dependencies, tasks, source sets
settings.gradle(.kts)→ Gradle multi-module setup
mvnw / gradlew       → Maven/Gradle wrapper (preferred entry point)
lombok.config        → Lombok configuration
```

**Other ecosystems:**
```
package.json         → dependencies, scripts, type
tsconfig.json        → TypeScript settings
pyproject.toml       → Python project metadata
*.config.js/ts       → Various tool configs
```

### Map Directory Structure

Explore the codebase to understand organization:

**Standard Laravel layout:**
```
app/
├── Console/                     # Artisan commands
│   └── Commands/
├── Exceptions/                  # Error handlers
│   └── Handler.php
├── Http/
│   ├── Controllers/             # Web controllers (return Blade views)
│   ├── Middleware/               # Request middleware
│   ├── Requests/                 # Form request validation classes
│   └── Resources/                # API Resources (JSON transformations)
├── Livewire/                    # Livewire components (if used)
│   └── Components/
├── Models/                      # Eloquent models
├── Providers/                   # Service providers
│   ├── AppServiceProvider.php
│   └── RouteServiceProvider.php
├── Services/                    # Business logic layer
├── Repositories/                # Repository pattern (optional)
├── Enums/                       # PHP enums
└── Traits/                      # Shared traits
bootstrap/
config/                          # Configuration files
    ├── app.php
    ├── database.php
    └── ...
database/
├── migrations/                  # Database migrations
├── factories/                   # Model factories
└── seeders/                     # Database seeders
public/
├── index.php                    # Front controller
├── build/                       # Built assets (Vite output)
└── storage/                     # Symlink to storage/app/public
resources/
├── views/                       # Blade templates
│   ├── layouts/                 # Layout files
│   ├── components/              # Blade components
│   └── livewire/                # Livewire views (if used)
├── css/                         # Source CSS
└── js/                          # Source JS
routes/
├── web.php                      # Web routes (Blade pages)
├── api.php                      # API routes
├── console.php                  # Artisan command routes
└── channels.php                 # Broadcasting channels
storage/
├── app/
├── logs/
└── framework/
tests/
├── Feature/                     # Feature / integration tests
├── Unit/                        # Unit tests
└── TestCase.php                 # Base test class
```

**Standard Spring Boot layout:**
```
src/
├── main/
│   ├── java/com/company/project/
│   │   ├── ProjectApplication.java        # @SpringBootApplication entry point
│   │   ├── config/                        # @Configuration @Bean definitions
│   │   ├── controller/ or web/            # @RestController @RequestMapping
│   │   ├── service/                       # @Service business logic (interface + impl)
│   │   ├── repository/ or dao/            # Spring Data JPA @Repository interfaces
│   │   ├── model/ or entity/ or domain/   # @Entity JPA entities
│   │   ├── dto/                           # Data transfer objects
│   │   ├── mapper/                        # MapStruct mappers or manual conversions
│   │   ├── exception/                     # @RestControllerAdvice, custom exceptions
│   │   ├── security/                      # Security config, filters, auth providers
│   │   ├── validation/                    # Custom validators, annotations
│   │   └── util/                          # Utility/helper classes
│   └── resources/
│       ├── application.yml               # Main config (preferred over .properties)
│       ├── application-dev.yml           # Profile-specific config
│       ├── application-prod.yml
│       ├── db/migration/                  # Flyway or Liquibase migrations
│       └── templates/                     # Thymeleaf/Mustache templates (if MVC)
└── test/
    ├── java/com/company/project/
    │   ├── controller/                    # @WebMvcTest
    │   ├── service/                       # Unit tests with Mockito
    │   ├── repository/                    # @DataJpaTest
    │   └── integration/                   # @SpringBootTest
    └── resources/
        └── application-test.yml          # Test config (or testcontainers)
```

**For other project types, explore similarly:**
- Where does source code live?
- Where are tests?
- Any shared code?
- Configuration locations?

---

## Phase 2: ANALYZE

### Extract Tech Stack

**From composer.json (Laravel):**
- PHP version (`require.php`)
- Laravel version (`require.laravel/framework`)
- Database driver (MySQL, PostgreSQL, SQLite — check `.env` `DB_CONNECTION`)
- Additional packages (`livewire/livewire`, `spatie/laravel-permission`, `barryvdh/laravel-debugbar`, `laravel/sanctum`, `laravel/horizon`)
- Frontend build (`laravel/vite-plugin`, `tailwindcss`, `alpinejs`)
- Testing tools (`phpunit/phpunit`, `mockery/mockery`, `pestphp/pest`)
- Queue driver (Redis, Database, SQS — check `.env` `QUEUE_CONNECTION`)
- Cache driver (Redis, File, Memcached — check `.env` `CACHE_STORE`)

**From pom.xml or build.gradle (Spring Boot):**
- Java/Kotlin version (`java.version`, `kotlin.version`)
- Spring Boot version (`<parent>` or `spring-boot-dependencies` BOM)
- Database driver and version (spring-boot-starter-data-jpa, r2dbc, etc.)
- Testing dependencies (spring-boot-starter-test, testcontainers, wiremock)
- Build plugins (spring-boot-maven-plugin, jib, spotless, checkstyle)
- Additional starters (spring-boot-starter-security, spring-boot-starter-cache, etc.)

**For other ecosystems:**
- Runtime/Language (Node, Python, Bun, Deno, browser)
- Framework(s)
- Database (if any)
- Testing tools
- Build tools
- Linting/formatting

### Identify Patterns

Study existing code for:

**Laravel / PHP patterns:**
- **MVC architecture**: routes → controllers → models → views (standard)
- **Service layer**: `App\Services\*` for business logic (fat models / thin controllers)
- **Form Requests**: `App\Http\Requests\*` for validation, authorization rules
- **Blade components**: `@props`, anonymous components (`resources/views/components/`), class-based components (`app/View/Components/`)
- **Blade templating**: `@extends`, `@section`, `@include`, `@yield`, `@push`/`@stack`, `@error`, `@auth`
- **Eloquent conventions**: model relationships (`belongsTo`, `hasMany`, `morphMany`), `$fillable`/`$guarded`, `$casts`, accessors/mutators, query scopes
- **Route model binding**: implicit or explicit binding in `RouteServiceProvider`
- **Validation**: Form Requests or inline `$request->validate([...])`
- **Authorization**: Gates, policies (`php artisan make:policy`)
- **Middleware**: Custom middleware for request filtering
- **Notifications**: `php artisan make:notification`, mail/database/slack channels
- **Events & Listeners**: `php artisan make:event`, `php artisan make:listener`
- **Queued jobs**: `php artisan make:job`, `ShouldQueue` interface
- **Localization**: `__()`, `@lang()`, lang files in `resources/lang/` or `lang/`
- **Testing patterns**:
  - `RefreshDatabase` trait for DB-backed tests
  - HTTP tests with `get()`, `post()`, `assertViewHas()`, `assertSee()`
  - `actingAs()` for authenticated requests
  - `DatabaseMigrations` or `DatabaseTransactions`
  - Factories with `Database\Factories\*` and `create()` / `make()`
  - Pest PHP: `it()`, `test()`, `expect()` fluent assertions

**Spring / Java patterns:**
- **Layered architecture**: controller → service → repository (standard)
- **Hexagonal/Onion**: ports and adapters, domain → application → infrastructure
- **DTO pattern**: separate request/response objects (immutable records)
- **Interface-based services**: `UserService` interface, `UserServiceImpl` implementation
- **Constructor injection**: prefer `private final` fields + constructor over `@Autowired`
- **Validation**: `@Valid`, `@NotBlank`, custom validators in DTOs
- **Exception handling**: `@RestControllerAdvice` with `@ExceptionHandler`, consistent error response structure
- **Mapping**: MapStruct, ModelMapper, or manual `toDto()`, `toEntity()` methods
- **Pagination**: Spring Data `Pageable`, `Page<T>` responses
- **Security**: Spring Security filters, JWT tokens, method-level `@PreAuthorize`
- **Logging**: SLF4J + Logback, `@Slf4j` (Lombok), structured logging pattern
- **API docs**: SpringDoc OpenAPI `@Operation`, `@Schema` annotations
- **Auditing**: `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`
- **Testing layers**:
  - `@WebMvcTest` for controller slice tests (mocked services)
  - `@DataJpaTest` for repository tests (embedded DB or testcontainers)
  - `@SpringBootTest` for integration tests
  - Unit tests with Mockito `@Mock`, `@InjectMocks`

**Generic patterns:**
- **Naming**: How are files, functions, classes named?
- **Structure**: How is code organized within files?
- **Errors**: How are errors created and handled?
- **Types**: How are types/interfaces defined?
- **Tests**: How are tests structured?

### Find Key Files

Identify files that are important to understand:

**Laravel:**
- `.env` — application environment configuration
- `config/app.php` — app-wide config, providers, aliases
- `config/database.php` — database connections config
- `routes/web.php` — all web routes (entry point for understanding)
- `app/Providers/AppServiceProvider.php` — boot/bindings
- `app/Exceptions/Handler.php` — error rendering
- `app/Models/User.php` — user model (auth, relationships)
- `database/migrations/` — schema evolution
- `database/seeders/DatabaseSeeder.php` — seed orchestration
- `tests/TestCase.php` — base test class (sets up traits, config)

**Spring Boot:**
- Main application class (`@SpringBootApplication`)
- Application configuration files (application.yml, application-{profile}.yml)
- Security configuration (`SecurityFilterChain` bean, `@EnableWebSecurity`)
- API documentation config (SpringDoc, Swagger)
- Database schema / migration files
- Dockerfile / docker-compose
- CI/CD config (.github/workflows, Jenkinsfile, etc.)

---

## Phase 3: GENERATE

### Create AGENTS.md

Use the template at `.agents/AGENT-template.md` as a starting point.

**Output path**: `AGENTS.md` (project root)

**Adapt to the project:**
- Remove sections that don't apply
- Add sections specific to this project type
- Keep it concise - focus on what's useful

**Key sections to include:**

1. **Project Overview** - What is this and what does it do?
2. **Tech Stack** - What technologies are used?
3. **Commands** - How to build, test, lint, run?

   **Laravel:**
   ```bash
   php artisan test                      # Run all tests
   php artisan serve                     # Start dev server
   composer run-script lint              # Lint (if configured)
   npm run build                         # Build frontend
   ```

   **Spring Boot:**
   ```bash
   ./mvnw clean test           # Run all tests
   ./mvnw spring-boot:run      # Start dev server
   ./mvnw clean verify         # Full build with integration tests
   ```

4. **Structure** - How is the code organized?
5. **Patterns** - What conventions should be followed?
6. **Key Files** - What files are important to know?

**Optional sections (add if relevant):**
- Architecture (MVC, hexagonal, layered, CQRS, event-driven)
- API endpoints (list key REST resources)
- Database patterns (migrations, Eloquent/JPA, factories/seeders)
- Security model (auth provider, role hierarchy, endpoint protection)
- On-demand context references
- Blade component conventions
- Livewire component patterns (if used)

---

## Phase 4: OUTPUT

```markdown
## Global Rules Created

**File**: `AGENTS.md`

### Project Type

{Detected project type — e.g., "Laravel 11 (PHP 8.2, Blade, MySQL)" or "Spring Boot REST API (Java 21, Maven, PostgreSQL)"}

### Tech Stack Summary

{Key technologies detected}

### Structure

{Brief structure overview following Phase 1 conventions}

### Next Steps

1. Review the generated `AGENTS.md`
2. Add any project-specific notes
3. Remove any sections that don't apply
4. Optionally create reference docs in `.agents/reference/`
```

---

## Tips

- Keep AGENTS.md focused and scannable
- Don't duplicate information that's in other docs (link instead)
- Focus on patterns and conventions, not exhaustive documentation
- Update it as the project evolves
