# AGENTS.md

This file provides guidance to AI Coding agents when working with code in this repository.

## Project Overview

UI design playground for a project and task management app using React 19 + TypeScript + Vite + shadcn/ui (base-nova style with Base UI primitives).

## Commands

```bash
bun dev          # Start dev server
bun run build    # Type-check and build for production
bun run lint     # Run ESLint
bun run preview  # Preview production build
```

## Architecture

### Tech Stack

- **React 19** with TypeScript
- **Vite 7** with `@tailwindcss/vite` plugin (Tailwind v4)
- **shadcn/ui** (base-nova style) - components use `@base-ui/react` primitives, not Radix
- **Styling**: Tailwind CSS v4 with OKLCH color space, `class-variance-authority` for variants, `tailwind-merge` + `clsx` via `cn()` utility
- **Icons**: `lucide-react`

### Key Patterns

**Path alias**: `@/` maps to `./src/`

**Component structure**: UI components in `src/components/ui/` follow shadcn patterns but wrap Base UI primitives (e.g., `@base-ui/react/button`) instead of Radix.

**Styling utility**: Use `cn()` from `@/lib/utils` for merging class names:

```tsx
import { cn } from '@/lib/utils'
cn('base-classes', variant && 'conditional-class', className)
```

**CSS variables**: Theme tokens defined in `src/index.css` using OKLCH colors (e.g., `--primary`, `--background`). Both light and dark mode supported via `.dark` class.

### Using shadcn Components

**Prefer shadcn over raw Tailwind.** When building UI:

1. First check if a suitable shadcn component already exists in `src/components/ui/`
2. If not, install it: `bunx shadcn@latest add <component-name>`
3. Look for pre-built layouts at https://ui.shadcn.com/blocks - copy and adapt these rather than building from scratch
4. Compose existing shadcn components together following their patterns
5. Only write custom Tailwind as a last resort

Configuration in `components.json` specifies:

- Style: `base-nova`
- Aliases: `@/components/ui`, `@/lib/utils`, `@/hooks`
- Icon library: `lucide`

## Data Model

This UI will eventually be the frontend for a Tauri desktop app that reads/writes markdown files on disk. The file format is defined by the **S1: Core Data Store** specification.

### Three Entity Types

| Entity | Purpose | Status Values |
|--------|---------|---------------|
| **Area** | Ongoing responsibility (never "finished") | `active`, `archived` |
| **Project** | Finishable collection of tasks | `planning`, `ready`, `blocked`, `in-progress`, `paused`, `done` |
| **Task** | Single actionable item | `inbox`, `icebox`, `ready`, `in-progress`, `blocked`, `dropped`, `done` |

### Relationships

- Projects optionally belong to an Area (`areaId`)
- Tasks optionally belong to a Project (`projectId`) and/or directly to an Area (`areaId`)
- A task's "effective area" is its direct `areaId` if set, otherwise inherited from its project's area

### Current Data Structure

For UI exploration, data lives in `src/data/app-data.ts` as a TypeScript object with flat arrays:

```typescript
interface AppData {
  areas: Area[]
  projects: Project[]
  tasks: Task[]
}
```

Types are defined in `src/types/data.ts`. Helper functions in `app-data.ts` provide lookups (`getProjectById`, `getTasksByProjectId`, etc.) and derived values (`getProjectCompletion`, `getEffectiveAreaId`).

### Key Fields

**Tasks** have: `title`, `status`, `createdAt`, `updatedAt`, optional `projectId`, `areaId`, `due`, `scheduled`, `deferUntil`, `notes`

**Projects** have: `title`, optional `status`, `areaId`, `description`, `startDate`, `endDate`, `notes`

**Areas** have: `title`, optional `status`, `type`, `description`, `notes`

The `notes` field holds markdown body content (what would be below the frontmatter in the actual files).

## UI Design Principles

The UI should feel **slick and polished**, inspired by Cultured Code's Things 3:

- Clean, minimal chrome with focus on content
- Smooth transitions and subtle animations
- Clear visual hierarchy
- **Keyboard-first navigation** - all core interactions should be accessible via keyboard
- Support standard shortcuts (arrow keys, Enter, Escape, Tab) for navigation and actions
