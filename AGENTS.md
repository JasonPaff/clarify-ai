# Clarify AI - Transform Feature Requests into Implementation Plans

A desktop application that uses AI to transform informal feature requests into actionable implementation plans, with deep visibility and control over the planning process.

## 1. Purpose

- **Structured Planning**: Automate the transformation of ad-hoc feature requests into structured, reproducible implementation plans
- **Context-Aware**: Analyze local code repositories to generate plans that account for actual codebase context
- **Multi-Step Orchestration**: Three-step AI workflow (Refine → Research → Plan) with configurable models and prompts at each stage
- **Local-First**: All repository analysis happens locally; plans and data stored on the user's machine
- **Developer Control**: Users can intervene at any step, modify prompts, switch models, or override outputs

## 2. Tech Stack

### Core Framework

- **Next.js** `16.1.2` - React framework with App Router
- **React** `19.2.3` - UI library
- **TypeScript** `^5` - Type-safe JavaScript
- **Tailwind CSS** `^4` - Utility-first CSS framework

### Desktop

- **Electron** `^35.1.0` - Desktop app framework
- **electron-builder** `^25.1.8` - Packaging and distribution
- **electron-serve** `^2.1.1` - Static file serving for production
- **electron-store** `^10.0.1` - Persistent key-value storage

### Database & ORM

- **Drizzle ORM** `^0.45.1` - TypeScript ORM
- **better-sqlite3** `^12.6.0` - SQLite3 bindings for Node.js
- **drizzle-zod** `^0.8.3` - Zod schema generation from Drizzle schemas
- **drizzle-kit** `^0.31.8` - Database migrations and tooling

### AI Integration

- **Vercel AI SDK** `^6.0.39` - Unified AI model interface with streaming
- **@ai-sdk/anthropic** `^3.0.15` - Claude AI provider
- **@ai-sdk/openai** `^3.0.12` - OpenAI provider
- **@ai-sdk/google** `^3.0.10` - Google AI provider

### UI Components & Styling

- **@base-ui/react** `^1.1.0` - Unstyled accessible UI primitives
- **lucide-react** `^0.562.0` - Icon library
- **class-variance-authority** `^0.7.1` - Variant-based component styling
- **clsx** `^2.1.1` - Conditional className utility
- **tailwind-merge** `^3.4.0` - Merge Tailwind classes intelligently
- **tw-animate-css** `^1.4.0` - Animation utilities

### State Management & Data Fetching

- **@tanstack/react-query** `^5.90.18` - Server state management and caching
- **@tanstack/react-query-devtools** `^5.91.2` - DevTools for debugging queries
- **@tanstack/react-form** `^1.27.7` - Form state management
- **@lukemorales/query-key-factory** `^1.3.4` - Type-safe query key generation
- **nuqs** `^2.8.6` - Type-safe URL query state management
- **next-typesafe-url** `^6.1.0` - Type-safe routing with Zod validation

### Validation

- **Zod** `^4.3.5` - TypeScript-first schema validation
- **zod-validation-error** `^5.0.0` - Human-readable Zod error messages

### Development & Linting

- **ESLint** `^9` - Code linting with flat config
- **eslint-config-next** `16.1.2` - Next.js ESLint rules
- **eslint-config-prettier** `^10.1.8` - Prettier compatibility
- **eslint-plugin-perfectionist** `^5.3.1` - Import/export sorting
- **eslint-plugin-better-tailwindcss** `^4.0.1` - Tailwind class validation
- **eslint-plugin-react-snob** `^0.0.26` - Opinionated React rules
- **typescript-eslint** `^8.53.0` - TypeScript ESLint integration
- **Prettier** `^3.8.0` - Code formatting

### Utilities

- **date-fns** `^4.1.0` - Date manipulation
- **react-error-boundary** `^6.1.0` - Error boundary component
- **concurrently** `^9.1.2` - Run multiple commands
- **cross-env** `^7.0.3` - Cross-platform environment variables
- **wait-on** `^8.0.3` - Wait for resources

## 3. Key Features

- Create and manage multiple projects with associated code repositories
- Three-step AI orchestration workflow: Feature Refinement → File Discovery → Implementation Planning
- Multi-model support (Claude, OpenAI, Google AI) with per-step model selection
- Customizable prompt templates for each planning step
- Local SQLite database for persistent project and plan storage
- Native file system access for repository analysis
- Collapsible sidebar navigation with keyboard shortcut (Ctrl/Cmd+B)
- Electron window controls with drag regions
- Dark/light/system theme support via CSS custom properties
- Type-safe routing with automatic parameter validation
- IPC-based communication between Electron main and renderer processes
- TanStack Query for optimistic updates and cache management
- TanStack Form for declarative form handling with field components
- Repository pattern for clean database abstraction
- Query key factories for organized cache invalidation

## 4. Folder Structure

```
clarify-ai/
├── app/                          # Next.js App Router pages
│   ├── (app)/                    # Main application route group
│   │   ├── help/                 # Help page
│   │   ├── projects/             # Projects pages
│   │   │   └── [projectId]/      # Dynamic project routes
│   │   │       ├── features/     # Feature requests
│   │   │       │   └── [featureId]/
│   │   │       ├── repositories/ # Repository management
│   │   │       └── settings/     # Project settings
│   │   ├── settings/             # App settings
│   │   ├── layout.tsx            # App shell layout
│   │   └── page.tsx              # Root redirect
│   ├── globals.css               # Global styles and CSS variables
│   └── layout.tsx                # Root layout with fonts
├── components/
│   ├── data/                     # Data-fetching components (QueryErrorBoundary)
│   ├── features/                 # Feature-specific components
│   ├── layout/                   # Layout components (AppShell, Sidebar, etc.)
│   ├── projects/                 # Project-related components
│   ├── providers/                # Context providers (QueryProvider, ThemeProvider)
│   ├── skeletons/                # Loading skeleton components
│   └── ui/                       # Reusable UI primitives
│       └── form/                 # TanStack Form field components
├── db/
│   ├── repositories/             # Repository pattern implementations
│   ├── schema/                   # Drizzle schema definitions
│   ├── index.ts                  # Database initialization
│   └── types.ts                  # Type re-exports for renderer
├── docs/                         # Design documents and specs
│   └── YYYY_MM_DD/               # Date-organized documentation
│       ├── orchestration/        # AI orchestration outputs
│       ├── plans/                # Implementation plans
│       └── implementation/       # Implementation tracking
├── drizzle/                      # Database migrations
├── electron/
│   ├── ipc/                      # IPC handlers organized by domain
│   │   ├── app.handlers.ts       # App info handlers
│   │   ├── channels.ts           # IPC channel constants
│   │   ├── dialog.handlers.ts    # File dialog handlers
│   │   ├── fs.handlers.ts        # File system handlers
│   │   ├── projects.handlers.ts  # Project CRUD handlers
│   │   ├── repositories.handlers.ts # Repository CRUD handlers
│   │   ├── store.handlers.ts     # Electron store handlers
│   │   └── index.ts              # Handler registration
│   ├── main.ts                   # Electron main process entry
│   └── preload.ts                # Context bridge and API exposure
├── hooks/                        # React hooks
│   ├── queries/                  # TanStack Query hooks
│   └── useElectron.ts            # Electron API hooks
├── lib/                          # Utility functions
│   ├── forms/                    # TanStack Form configuration
│   ├── queries/                  # Query key definitions
│   ├── theme/                    # Theme constants
│   ├── validations/              # Zod validation schemas
│   └── utils.ts                  # Common utilities (cn)
├── public/                       # Static assets
└── types/                        # Global type definitions
    ├── component-types.ts        # Global component types
    └── electron.d.ts             # Electron API type definitions
```

## 5. Architecture

- **Electron + Next.js Hybrid**: Next.js runs as the renderer with static export for production; Electron handles native capabilities
- **IPC Communication**: All native operations (file system, dialogs, database) go through typed IPC channels defined in `electron/ipc/channels.ts`
- **Context Isolation**: Electron preload script exposes a limited, typed `electronAPI` to the renderer via contextBridge
- **Repository Pattern**: Database operations abstracted through repository interfaces in `db/repositories/`
- **TanStack Query**: Server state managed via TanStack Query with query key factories in `lib/queries/`; mutations handle cache invalidation
- **TanStack Form**: Forms use `useAppForm` hook from `lib/forms/form-hook.ts` with pre-built field components
- **Type-Safe Routing**: Routes use `next-typesafe-url` with Zod schemas in `route-type.ts` files for parameter validation
- **Component Composition**: Base UI primitives from `@base-ui/react` wrapped with CVA variants for consistent styling
- **CSS Variables**: Theme colors defined in `globals.css` with light/dark/system mode support via CSS classes
- **Database Migrations**: Drizzle Kit generates SQL migrations in `drizzle/` directory; run automatically on app start

## 6. Development Commands

| Command                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm dev`               | Start Next.js dev server with Turbopack                       |
| `pnpm build`             | Build Next.js for production                                  |
| `pnpm electron:dev`      | Run full Electron + Next.js development environment           |
| `pnpm electron:compile`  | Compile Electron TypeScript to JavaScript                     |
| `pnpm electron:build`    | Build Next.js for Electron (static export) + compile Electron |
| `pnpm electron:dist`     | Full production build + create installers                     |
| `pnpm db:generate`       | Generate Drizzle migrations from schema changes               |
| `pnpm db:migrate`        | Run pending database migrations                               |
| `pnpm lint`              | Run ESLint with auto-fix                                      |
| `pnpm format`            | Format code with Prettier                                     |
| `pnpm typecheck`         | Run TypeScript type checking                                  |
| `pnpm next-typesafe-url` | Regenerate route type definitions                             |

## 7. Project Rules (Important)

### TypeScript

- **Strict mode enabled** with `noUncheckedIndexedAccess`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
- **No JavaScript files** (`allowJs: false`)
- Use `@/*` path alias for imports from project root
- Infer types from Drizzle schemas using `$inferSelect` and `$inferInsert`
- Use `satisfies` keyword for type-safe object literals (see route-type.ts)

### React & Components

- Use **Base UI primitives** (`@base-ui/react`) as the foundation for UI components
- Wrap components with **CVA (class-variance-authority)** for variant-based styling
- Use `ComponentPropsWithRef` for component prop types that extend native elements
- Global types available: `RequiredChildren`, `Children`, `ClassName`, `ButtonMouseEvent`
- Add `"use client"` directive for client components; default to server components
- Use `withParamValidation` HOC from `next-typesafe-url` for pages with dynamic params

### Forms (TanStack Form)

- Use `useAppForm` from `lib/forms/form-hook.ts` for all forms
- Field components: `TextField`, `TextareaField`, `NumberField`, `SelectField`, `CheckboxField`, `SwitchField`
- Form components: `SubmitButton`, `FormError`
- Validation schemas in `lib/validations/` using Zod

### Data Fetching (TanStack Query)

- Query hooks in `hooks/queries/` directory
- Query keys defined using `createQueryKeys` in `lib/queries/`
- Use `useElectronDb()` hook to access Electron IPC database methods
- Mutations must invalidate relevant query keys on success

### Styling

- Use **Tailwind CSS v4** with CSS-first configuration via `@theme inline`
- Color tokens defined as CSS variables in `globals.css` (e.g., `--color-accent`, `--color-muted`)
- Use `cn()` utility from `lib/utils.ts` to merge Tailwind classes
- Electron drag regions: use `drag-region` and `no-drag` classes for window controls
- Import `tw-animate-css` for animation utilities

### Code Organization

- **ESLint Perfectionist**: Imports, exports, objects, and JSX props are auto-sorted alphabetically
- **Prettier**: Code formatting enforced via `pnpm format`
- Use strict equality (`===`/`!==`) - `eqeqeq` rule enabled
- Keep components in domain folders (`components/ui/`, `components/layout/`, `components/features/`)

### Database

- **Drizzle ORM** with SQLite (better-sqlite3)
- Schema files in `db/schema/` with `.schema.ts` suffix
- All tables use: `id` (integer primary key), `createdAt`, `updatedAt` (text timestamps)
- Use `sql` template literal for raw SQL (e.g., `CURRENT_TIMESTAMP`)
- Create indexes for commonly queried fields
- Repository pattern for data access (`db/repositories/`)
- Do not manually run migrations, migrations will run on app start automatically

### Electron/IPC

- All IPC channels defined in `electron/ipc/channels.ts` as const object
- Handlers organized by domain in separate files (`app.handlers.ts`, `fs.handlers.ts`, etc.)
- Use `ipcRenderer.invoke()` for async operations (not `send`/`on`)
- Validate all file paths in main process before operations
- Database runs in main process; renderer accesses via IPC

### Routing

- Use `$path()` from `next-typesafe-url` for type-safe navigation
- Define route params with Zod schemas in `route-type.ts` files
- Use `InferPagePropsType` and `InferLayoutPropsType` for prop types
- Await `routeParams` in async page components

### Anti-patterns to Avoid

- Don't use `any` type - use `unknown` and narrow with type guards
- Don't use `require()` in renderer - use ES imports
- Don't access `window.electronAPI` directly - use `useElectron()` hooks
- Don't define styles inline - use Tailwind classes or CSS variables
- Don't create new components without variants - use CVA pattern
- Don't skip migrations - always use `db:generate` and `db:migrate`
- Don't use `eslint-disable` comments without justification
- Don't use `ts-ignore` or `ts-expect-error` - fix the type issues properly
- Don't use barrel exports

## 8. Project Documentation Conventions (Important)

| Document Type           | Location                                                      |
| ----------------------- | ------------------------------------------------------------- |
| Design Documents        | `docs/design-document.md`                                     |
| Orchestration Outputs   | `docs/YYYY_MM_DD/orchestration/<feature-name>/`               |
| Implementation Plans    | `docs/YYYY_MM_DD/plans/<feature-name>-implementation-plan.md` |
| Implementation Tracking | `docs/YYYY_MM_DD/implementation/<feature-name>/`              |
| Database Migrations     | `drizzle/`                                                    |
| Type Definitions        | `types/`                                                      |
| Route Type Schemas      | `app/**/route-type.ts`                                        |
| Validation Schemas      | `lib/validations/`                                            |

> **Note**: Always verify that target directories exist before creating new files. Use existing patterns in the codebase as templates for new additions.

## 9. Custom Commands

Custom commands in `.claude/commands/` provide high-level workflows. Use slash commands to invoke them.

| Command           | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `/plan-feature`   | Generate implementation plans through 3-4 step orchestration (clarify → refine → discover → plan) |
| `/implement-plan` | Execute implementation plans with structured tracking using subagent architecture             |
| `/gemini-review`  | Run AI-powered code reviews using Gemini CLI with Gemini 3 Pro                                |
| `/create-schema`  | Create or modify database schemas using natural language descriptions                         |
| `/fix-file`       | Fix a file to follow project patterns using specialist agents with automatic review           |
| `/next-feature`   | Identify the next logical feature area based on design document and codebase analysis         |

## 10. Specialist Subagents

Specialist subagents in `.claude/agents/` handle domain-specific implementation tasks. Use them when working in their respective domains.

| Agent                           | Domain                       | When to Use                                                |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `database-schema`               | Database schemas & repos     | Files in `db/schema/` or `db/repositories/`                |
| `ipc-handler`                   | Electron IPC communication   | Files in `electron/ipc/`, `electron/preload.ts`, IPC hooks |
| `tanstack-query`                | Data fetching & server state | Query hooks, mutations, cache management                   |
| `tanstack-form`                 | Form implementations         | Forms in dialogs, pages, features + validation schemas     |
| `tanstack-form-base-components` | Base form components         | Field components in `components/ui/form/`                  |
| `frontend-component`            | UI & feature components      | UI primitives in `components/ui/`, feature components      |
| `clarification-agent`           | Requirement gathering        | Gathering clarifying questions for ambiguous requests      |
| `file-discovery-agent`          | File discovery               | Identifying all files relevant to a feature                |
| `implementation-planner`        | Implementation planning      | Creating comprehensive implementation plans                |
| `gemini-review`                 | Code review                  | AI-powered code reviews using Gemini CLI                   |

---

**IMPORTANT**: These instructions OVERRIDE any default behavior. When working in this codebase, you MUST follow the rules, patterns, and conventions documented above exactly as written. The rules in Section 7 are strict requirements, not suggestions.
