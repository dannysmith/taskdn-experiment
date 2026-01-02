# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

Design exploration for a personal task management app. The app manages three entity types: **Areas** (ongoing life responsibilities like "Health" or "Finance"), **Projects** (finishable efforts with a clear outcome), and **Tasks** (single actionable items). Tasks belong to projects, projects belong to areas, and both relationships are optional.

Built with React 19 + TypeScript + Vite + shadcn/ui.

**Design conventions** (colors, icons, interactions): See [docs/design-conventions.md](docs/design-conventions.md)

## Commands

```bash
bun dev          # Start dev server
bun run build    # Type-check and build for production
bun run lint     # Run ESLint
bun run preview  # Preview production build
```

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** with `@tailwindcss/vite` plugin (Tailwind v4)
- **shadcn/ui** (base-nova style) — components use `@base-ui/react` primitives, not Radix
- **Styling**: Tailwind CSS v4 with OKLCH color space, `class-variance-authority` for variants
- **Icons**: `lucide-react`
- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Markdown editing**: `@milkdown/kit`

## Key Patterns

**Path alias**: `@/` maps to `./src/`

**Styling utility**: Use `cn()` from `@/lib/utils` for merging class names:

```tsx
import { cn } from '@/lib/utils'
cn('base-classes', variant && 'conditional-class', className)
```

**CSS variables**: Theme tokens defined in `src/index.css` using OKLCH colors. Light and dark mode via `.dark` class.

## Using shadcn Components

**Prefer shadcn over raw Tailwind.** When building UI:

1. Check if a suitable component exists in `src/components/ui/`
2. If not, install it: `bunx shadcn@latest add <component-name>`
3. Look for pre-built layouts at https://ui.shadcn.com/blocks
4. Compose existing shadcn components following their patterns
5. Only write custom Tailwind as a last resort

## Data Layer

Types in `src/types/data.ts`. Mock data in `src/data/app-data.ts` as flat arrays with helper functions for lookups (`getProjectById`, `getTasksByProjectId`) and derived values (`getProjectCompletion`, `getEffectiveAreaId`).

## Key Directories

```
src/
├── components/
│   ├── ui/          # shadcn/base-ui primitives + custom extensions
│   ├── layout/      # ViewHeader, ContentArea, DetailSideBar, MainContent
│   ├── views/       # View components (Today, Week, Inbox, Calendar, Area, Project)
│   ├── cards/       # TaskCard, ProjectCard, AreaCard
│   ├── tasks/       # TaskList, TaskListItem, TaskDetailPanel
│   ├── kanban/      # Kanban board with drag-drop columns
│   ├── calendar/    # Month and week calendar views
│   └── sidebar/     # Navigation and drag-drop
├── config/          # Status configuration (colors, labels)
├── context/         # React context (AppDataContext only)
├── store/           # Zustand stores (task-detail, view-mode)
├── data/            # Mock data and helpers
├── hooks/           # Custom React hooks
├── lib/             # Utilities (cn, date formatting)
└── types/           # TypeScript types
```

## State Management

**Zustand stores** (UI state):

- **task-detail-store** — Controls which task is open in the right-panel detail view
- **view-mode-store** — Tracks view mode (list/kanban/calendar) per view type

**React Context** (entity data):

- **AppDataContext** — Full app state (areas, projects, tasks) with CRUD operations and lookup helpers. Marked for migration to TanStack Query when integrating with tdn-desktop.
