# Phase 1: Foundation & Data Layer - Implementation Plan

**Generated**: 2026-01-20
**Original Request**: Plan Phase 1 of the feature request workflow implementation
**Source**: docs/2026_01_20/plans/feature-request-workflow-implementation-order.md

## Analysis Summary

- Feature request refined with project context
- Discovered 24 files across 6 directories
- Generated 18-step implementation plan

---

## Overview

**Estimated Duration**: 2-3 days
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

- Create three new database schemas (feature-request-runs, step-configurations, feature-request-context-files) following established Drizzle ORM patterns
- Update the existing feature-requests schema with archivedAt, staleSteps fields and expanded status enum
- Implement corresponding repository classes, IPC handlers, and preload bridge methods for all new entities
- Update validation schemas to support new workflow states

## Prerequisites

- [ ] Verify existing database is migrated and working (`pnpm db:migrate`)
- [ ] Ensure development environment runs without errors (`pnpm electron:dev`)
- [ ] Confirm all existing tests pass (if applicable)

## Implementation Steps

### Step 1: Update Feature Requests Schema with New Fields

**What**: Add archivedAt, staleSteps fields and expand the status enum in the existing feature-requests schema
**Why**: These fields enable soft deletion support, stale step tracking for re-runs, and accurate workflow state representation
**Confidence**: High

**Files to Modify:**
- `db/schema/feature-requests.schema.ts` - Add new fields and expand status values

**Changes:**
- Add `archivedAt` nullable text field for soft deletion timestamps
- Add `staleSteps` text field to store JSON array of step identifiers needing re-run
- Expand status field to support: 'draft', 'refining', 'refined', 'researching', 'researched', 'planning', 'planned', 'completed', 'failed'
- Add index on `archivedAt` field for efficient filtering of archived records

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema file compiles without TypeScript errors
- [ ] New fields are properly typed with $inferSelect and $inferInsert
- [ ] All validation commands pass

---

### Step 2: Create Feature Request Runs Schema

**What**: Create new schema file for tracking individual AI execution runs per workflow step
**Why**: This enables comprehensive logging of each AI step execution including model used, token metrics, timing, and outputs
**Confidence**: High

**Files to Create:**
- `db/schema/feature-request-runs.schema.ts` - New schema for run tracking

**Changes:**
- Define `featureRequestRuns` table with fields: id (primary key), featureRequestId (foreign key with cascade delete), step (text: 'refine' | 'research' | 'plan'), modelId (text), inputContent (text), outputContent (text), inputTokens (integer), outputTokens (integer), durationMs (integer), status (text: 'pending' | 'running' | 'completed' | 'failed'), errorMessage (text nullable), startedAt (text timestamp), completedAt (text timestamp nullable), createdAt, updatedAt
- Add foreign key reference to featureRequests table with onDelete cascade
- Create indexes on featureRequestId, step, and status fields
- Export FeatureRequestRun and NewFeatureRequestRun types using $inferSelect and $inferInsert

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema file follows existing patterns from repository-overviews.schema.ts
- [ ] Foreign key relationship properly configured with cascade delete
- [ ] Appropriate indexes defined for query performance
- [ ] All validation commands pass

---

### Step 3: Create Step Configurations Schema

**What**: Create new schema for storing per-step model and prompt configuration overrides
**Why**: This allows users to customize AI behavior at each workflow step with different models, prompts, and parameters
**Confidence**: High

**Files to Create:**
- `db/schema/step-configurations.schema.ts` - New schema for step configs

**Changes:**
- Define `stepConfigurations` table with fields: id (primary key), featureRequestId (foreign key with cascade delete), step (text: 'refine' | 'research' | 'plan'), modelProvider (text), modelId (text), customSystemPrompt (text nullable), customUserPromptTemplate (text nullable), temperature (real/numeric nullable), thinkingEnabled (integer as boolean), createdAt, updatedAt
- Add foreign key reference to featureRequests table with onDelete cascade
- Create unique index on (featureRequestId, step) combination to prevent duplicate configs
- Create index on featureRequestId for efficient lookups
- Export StepConfiguration and NewStepConfiguration types

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema follows project conventions with proper timestamp defaults
- [ ] Unique constraint prevents duplicate step configurations per feature request
- [ ] All validation commands pass

---

### Step 4: Create Feature Request Context Files Schema

**What**: Create new schema for tracking file attachments associated with feature requests
**Why**: This tracks which files are included in the AI context for each feature request, supporting repository files, documents, and images
**Confidence**: High

**Files to Create:**
- `db/schema/feature-request-context-files.schema.ts` - New schema for context files

**Changes:**
- Define `featureRequestContextFiles` table with fields: id (primary key), featureRequestId (foreign key with cascade delete), filePath (text), fileType (text: 'repository' | 'document' | 'image'), displayName (text), sizeBytes (integer), includedInContext (integer as boolean, default true), createdAt, updatedAt
- Add foreign key reference to featureRequests table with onDelete cascade
- Create indexes on featureRequestId and fileType fields
- Create unique index on (featureRequestId, filePath) to prevent duplicate file entries
- Export FeatureRequestContextFile and NewFeatureRequestContextFile types

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema supports all required file types
- [ ] Unique constraint prevents duplicate file paths per feature request
- [ ] All validation commands pass

---

### Step 5: Register New Schemas in Database Index and Drizzle Config

**What**: Import and register all new schemas in the database initialization and Drizzle config
**Why**: The schemas must be registered for the ORM to recognize them and for migrations to be generated
**Confidence**: High

**Files to Modify:**
- `db/index.ts` - Import and spread new schemas into schema object
- `drizzle.config.ts` - Add new schema file paths to schema array

**Changes:**
- In db/index.ts: Add imports for featureRequestRunsSchema, stepConfigurationsSchema, featureRequestContextFilesSchema
- In db/index.ts: Spread new schemas into the combined schema object
- In drizzle.config.ts: Add paths for feature-request-runs.schema.ts, step-configurations.schema.ts, feature-request-context-files.schema.ts

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All new schemas imported and registered
- [ ] DrizzleDatabase type includes new schema types
- [ ] All validation commands pass

---

### Step 6: Generate Database Migrations

**What**: Generate Drizzle migrations for all schema changes
**Why**: Create new database tables and indexes as needed
**Confidence**: High

**Files to Create:**
- New migration file(s) in `drizzle/` directory (auto-generated)

**Changes:**
- Run `pnpm db:generate` to generate migration SQL from schema changes
- Review generated migration file to ensure correctness

**Validation Commands:**
```bash
pnpm db:generate
```

**Success Criteria:**
- [ ] Migration file generated with correct CREATE TABLE statements
- [ ] All foreign keys and indexes included in migration

---

### Step 7: Create Feature Request Runs Repository

**What**: Implement repository class for feature request runs CRUD operations
**Why**: Repository pattern provides clean data access abstraction following project conventions
**Confidence**: High

**Files to Create:**
- `db/repositories/feature-request-runs.repository.ts` - Repository implementation

**Changes:**
- Define FeatureRequestRunsRepository interface with methods: create, getById, getByFeatureRequestId, getByFeatureRequestIdAndStep, update, delete, getLatestByFeatureRequestId
- Implement createFeatureRequestRunsRepository factory function
- Follow patterns from repository-overviews.repository.ts for implementation style
- Include updatedAt auto-update in update method using sql template

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All CRUD operations implemented following existing patterns
- [ ] TypeScript types properly inferred from schema
- [ ] Query methods support filtering by step and status
- [ ] All validation commands pass

---

### Step 8: Create Step Configurations Repository

**What**: Implement repository class for step configurations CRUD and upsert operations
**Why**: Enables data access for per-step AI configuration overrides
**Confidence**: High

**Files to Create:**
- `db/repositories/step-configurations.repository.ts` - Repository implementation

**Changes:**
- Define StepConfigurationsRepository interface with methods: create, getById, getByFeatureRequestId, getByFeatureRequestIdAndStep, update, delete, upsert
- Implement createStepConfigurationsRepository factory function
- Include upsert method for convenient create-or-update behavior (similar to repository-overviews.repository.ts)
- Follow existing repository patterns for consistency

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Upsert method handles both create and update cases
- [ ] Methods properly filter by featureRequestId and step
- [ ] All validation commands pass

---

### Step 9: Create Feature Request Context Files Repository

**What**: Implement repository class for context files CRUD operations
**Why**: Enables management of file attachments associated with feature requests
**Confidence**: High

**Files to Create:**
- `db/repositories/feature-request-context-files.repository.ts` - Repository implementation

**Changes:**
- Define FeatureRequestContextFilesRepository interface with methods: create, getById, getByFeatureRequestId, getByFeatureRequestIdAndType, update, delete, setIncludedInContext, bulkCreate
- Implement createFeatureRequestContextFilesRepository factory function
- Include setIncludedInContext convenience method for toggling file inclusion
- Include bulkCreate for batch file additions

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All CRUD operations implemented
- [ ] Bulk operations support adding multiple files efficiently
- [ ] Toggle method for includedInContext works correctly
- [ ] All validation commands pass

---

### Step 10: Add IPC Channels for New Entities

**What**: Define IPC channel constants for all new database entities
**Why**: IPC channels enable communication between Electron main and renderer processes
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add new channel definitions

**Changes:**
- Add `featureRequestRuns` channel group with: create, getById, getByFeatureRequestId, getByFeatureRequestIdAndStep, update, delete, getLatestByFeatureRequestId
- Add `stepConfigurations` channel group with: create, getById, getByFeatureRequestId, getByFeatureRequestIdAndStep, update, delete, upsert
- Add `featureRequestContextFiles` channel group with: create, getById, getByFeatureRequestId, getByFeatureRequestIdAndType, update, delete, setIncludedInContext, bulkCreate
- Follow existing naming pattern: 'db:entityName:methodName'

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All channels follow existing naming conventions
- [ ] Channel names match repository method names
- [ ] All validation commands pass

---

### Step 11: Create IPC Handlers for Feature Request Runs

**What**: Implement IPC handlers that wire channel invocations to repository methods
**Why**: Handlers expose repository functionality to the renderer process via IPC
**Confidence**: High

**Files to Create:**
- `electron/ipc/feature-request-runs.handlers.ts` - IPC handlers

**Changes:**
- Create registerFeatureRequestRunsHandlers function accepting repository parameter
- Register ipcMain.handle for each channel, delegating to repository methods
- Follow pattern from projects.handlers.ts for structure
- Include proper typing for all handler parameters and return types

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All repository methods exposed via IPC handlers
- [ ] Handler function follows existing naming pattern
- [ ] All validation commands pass

---

### Step 12: Create IPC Handlers for Step Configurations

**What**: Implement IPC handlers for step configurations entity
**Why**: Enables renderer access to step configuration data operations
**Confidence**: High

**Files to Create:**
- `electron/ipc/step-configurations.handlers.ts` - IPC handlers

**Changes:**
- Create registerStepConfigurationsHandlers function accepting repository parameter
- Register handlers for all step configuration operations including upsert
- Follow established handler patterns

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All repository methods exposed via IPC
- [ ] Upsert handler properly implemented
- [ ] All validation commands pass

---

### Step 13: Create IPC Handlers for Feature Request Context Files

**What**: Implement IPC handlers for context files entity
**Why**: Enables renderer access to context file management operations
**Confidence**: High

**Files to Create:**
- `electron/ipc/feature-request-context-files.handlers.ts` - IPC handlers

**Changes:**
- Create registerFeatureRequestContextFilesHandlers function accepting repository parameter
- Register handlers for all context file operations including bulkCreate and setIncludedInContext
- Follow established handler patterns

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All repository methods exposed via IPC
- [ ] Bulk operations handler properly implemented
- [ ] All validation commands pass

---

### Step 14: Register New Handlers in Handler Registration

**What**: Import and call new handler registration functions in the central registration file
**Why**: Handlers must be registered during app startup for IPC to function
**Confidence**: High

**Files to Modify:**
- `electron/ipc/register-handlers.ts` - Add handler registrations

**Changes:**
- Import new handler registration functions and repository factories
- Create repository instances using createFeatureRequestRunsRepository, createStepConfigurationsRepository, createFeatureRequestContextFilesRepository
- Call registration functions with repository instances
- Maintain alphabetical ordering per ESLint perfectionist rules

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All new handlers registered in proper order
- [ ] Repository instances created with database connection
- [ ] All validation commands pass

---

### Step 15: Update Electron Preload with New API Methods

**What**: Expose new database operations to renderer via context bridge
**Why**: Preload script is the secure bridge between main and renderer processes
**Confidence**: High

**Files to Modify:**
- `electron/preload.ts` - Add API methods and types

**Changes:**
- Import new schema types (FeatureRequestRun, NewFeatureRequestRun, etc.)
- Add featureRequestRuns object to db namespace in ElectronAPI interface with typed methods
- Add stepConfigurations object to db namespace with typed methods
- Add featureRequestContextFiles object to db namespace with typed methods
- Implement corresponding ipcRenderer.invoke calls in electronAPI object

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All new API methods properly typed
- [ ] Methods invoke correct IPC channels
- [ ] Interface matches repository signatures
- [ ] All validation commands pass

---

### Step 16: Update types/electron.ts with New Type Exports

**What**: Export new schema types for use in renderer components
**Why**: Types file provides type definitions accessible to renderer without importing from db directly
**Confidence**: High

**Files to Modify:**
- `types/electron.ts` - Add type exports and update ElectronAPI

**Changes:**
- Add type re-exports for FeatureRequestRun, NewFeatureRequestRun from feature-request-runs.schema.ts
- Add type re-exports for StepConfiguration, NewStepConfiguration from step-configurations.schema.ts
- Add type re-exports for FeatureRequestContextFile, NewFeatureRequestContextFile from feature-request-context-files.schema.ts
- Update ElectronAPI interface to include new db methods matching preload.ts

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All new types exported for renderer use
- [ ] ElectronAPI interface synchronized with preload.ts
- [ ] All validation commands pass

---

### Step 17: Update Feature Request Validation Schema

**What**: Update Zod validation schema with expanded status enum values
**Why**: Forms and API validation need to recognize new workflow states
**Confidence**: High

**Files to Modify:**
- `lib/validations/feature-request.ts` - Update status enum

**Changes:**
- Expand featureRequestStatusSchema enum to include: 'draft', 'refining', 'refined', 'researching', 'researched', 'planning', 'planned', 'completed', 'failed'
- Ensure updateFeatureRequestSchema and editFeatureRequestFormSchema use updated enum
- Export new FeatureRequestStatus type

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Status enum matches schema definition
- [ ] Existing form validations continue to work
- [ ] All validation commands pass

---

### Step 18: Full Integration Verification

**What**: Verify the complete data layer works end-to-end
**Why**: Ensures all pieces integrate correctly before moving to Phase 2
**Confidence**: High

**Validation Commands:**
```bash
pnpm run lint --fix && pnpm run typecheck && pnpm electron:dev
```

**Success Criteria:**
- [ ] Application starts without errors
- [ ] Database migrations applied successfully
- [ ] No TypeScript errors in any modified/created files
- [ ] IPC channels respond correctly (can be verified via console logs in development)
- [ ] All lint and typecheck commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint --fix`
- [ ] Database migrations generate and apply without errors
- [ ] Application starts in development mode without errors
- [ ] All new schemas follow existing patterns (timestamps, foreign keys, indexes)
- [ ] All repositories follow existing factory function pattern
- [ ] All IPC handlers follow existing registration pattern
- [ ] Preload and types/electron.ts are synchronized

## Notes

- **Schema Field Naming**: Use camelCase for TypeScript property names; Drizzle will convert to snake_case for SQL columns automatically via the column name parameter
- **Boolean Fields**: SQLite lacks native boolean type; use integer with 0/1 values following project convention
- **JSON Fields**: Store as text and parse/stringify in application layer (e.g., staleSteps array)
- **Migration Strategy**: Single migration containing all new tables is acceptable; Drizzle Kit handles this automatically
- **Foreign Key Behavior**: All new tables use cascade delete to maintain referential integrity when parent feature requests are deleted
- **Index Strategy**: Foreign key columns and frequently filtered columns (status, step) should have indexes for query performance
- **Type Export Pattern**: Types are exported from schema files using $inferSelect/$inferInsert, then re-exported via types/electron.ts for renderer access

---

## File Discovery Results

### Critical (Must Modify)
- `db/schema/feature-requests.schema.ts` - Add archivedAt, staleSteps, expand status enum
- `db/index.ts` - Import and register new schemas
- `drizzle.config.ts` - Add new schema file paths
- `types/electron.ts` - Export new types

### High Priority (Reference Patterns)
- `db/schema/repositories.schema.ts` - Schema pattern with foreign keys
- `db/schema/repository-overviews.schema.ts` - Schema with model tracking
- `db/schema/feature-request-repositories.schema.ts` - Junction table pattern
- `db/repositories/feature-requests.repository.ts` - Repository implementation pattern
- `db/repositories/repository-overviews.repository.ts` - Advanced repository pattern
- `lib/validations/feature-request.ts` - Update status enum

### Files to Create
- `db/schema/feature-request-runs.schema.ts`
- `db/schema/step-configurations.schema.ts`
- `db/schema/feature-request-context-files.schema.ts`
- `db/repositories/feature-request-runs.repository.ts`
- `db/repositories/step-configurations.repository.ts`
- `db/repositories/feature-request-context-files.repository.ts`
- `electron/ipc/feature-request-runs.handlers.ts`
- `electron/ipc/step-configurations.handlers.ts`
- `electron/ipc/feature-request-context-files.handlers.ts`
