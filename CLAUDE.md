# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clarify AI is a desktop application that transforms informal feature requests into actionable implementation plans using AI.
Built as an Electron + Next.js hybrid with a local-first architecture.

## Commands

```bash
pnpm dev                 # Run Next.js dev server (port 3000)
pnpm electron:dev        # Run Electron + Next.js together in dev mode
pnpm electron:build      # Build for Electron (static export)
pnpm electron:dist       # Build and package with electron-builder
pnpm lint                # ESLint with auto-fix
pnpm format              # Prettier formatting
pnpm typecheck           # TypeScript type checking
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Run Drizzle migrations
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4
- **Desktop**: Electron 35 with context isolation and sandbox enabled
- **AI**: Vercel AI SDK with Anthropic, OpenAI, and Google providers
- **State**: Zustand
- **Database**: Drizzle ORM (SQLite)
- **Components**: @base-ui/react (unstyled, accessible primitives)

### Project Structure
- `app/` - Next.js App Router pages and layouts
- `components/` - React components (features/, layout/, projects/, ui/)
- `electron/` - Main process (main.ts) and preload script (preload.ts)
- `hooks/` - Custom React hooks including Electron API hooks
- `types/` - TypeScript definitions (electron.d.ts, component-types.ts)
- `docs/` - Base UI component documentation

### Electron IPC Architecture
The app uses context isolation for security. The renderer process accesses Node capabilities through `window.electronAPI`, exposed via the preload script:
- `electronAPI.fs` - File operations (read, write, stat, exists, readDirectory)
- `electronAPI.dialog` - Native dialogs (openDirectory, openFile, saveFile)
- `electronAPI.store` - Persistent key-value storage (electron-store)
- `electronAPI.app` - App info (version, paths)

Path validation in main.ts prevents directory traversal attacks.

### Global Types
Defined in `types/component-types.ts` and available globally:
- `Children<TProps>` - Props with optional children
- `RequiredChildren<TProps>` - Props with required children
- `ClassName<TProps>` - Props with optional className
- `ButtonMouseEvent` - Typed button mouse event
- `Prettify<T>` - Type utility for cleaner hover info

### Import Alias
Use `@/*` to import from project root (e.g., `@/components/ui/Button`).

## Code Style

- TypeScript strict mode with `noUncheckedIndexedAccess`
- ESLint flat config with perfectionist (sorted imports/objects), better-tailwindcss, and react-snob
- Prettier with double quotes and semicolons
- Tailwind CSS v4 for styling
