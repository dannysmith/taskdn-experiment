# Codebase Cleanup Plan

## Overview

Address technical debt accumulated during design exploration. Focus areas:

1. Consolidate duplicate code (status configs, view utilities)
2. Remove dead code (unused files and exports)
3. Extract reusable components
4. Improve consistency (naming, patterns)

## Phase 1: Remove Dead Code

Low risk, immediate wins.

### 1.1 Delete Example Files

**Files to delete:**

- `src/components/example.tsx`
- `src/components/component-example.tsx`

These are shadcn demo files not imported anywhere. Verify with:

```bash
grep -r "example" src/ --include="*.tsx" --include="*.ts" | grep -v "example.tsx"
```

### 1.2 Delete CardGrid

**File:** `src/components/cards/card-grid.tsx`

- Exported but `AreaView` uses inline grid classes instead
- Not worth the abstraction for a simple grid wrapper

**Also update:** `src/components/cards/index.ts` - remove the CardGrid export.

### 1.3 Keep AreaCard (No Action)

**File:** `src/components/cards/area-card.tsx`

- Currently unused but will be needed for future features
- Keep in codebase, no changes needed

---

## Phase 2: Consolidate Status Configuration

This is the highest-impact change. The same status config is defined in 5 places.

### 2.1 Create Centralized Status Config

**Create:** `src/config/status.ts`

```typescript
import type { TaskStatus, ProjectStatus } from '@/types/data'

export interface StatusConfig {
  label: string
  color: string // Combined bg + text classes using CSS variables
}

export const taskStatusConfig: Record<TaskStatus, StatusConfig> = {
  inbox: { label: 'Inbox', color: 'bg-status-inbox/15 text-status-inbox' },
  icebox: { label: 'Icebox', color: 'bg-status-icebox/15 text-status-icebox' },
  ready: { label: 'Ready', color: 'bg-status-ready/15 text-status-ready' },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-status-in-progress/15 text-status-in-progress',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-status-blocked/15 text-status-blocked',
  },
  dropped: {
    label: 'Dropped',
    color: 'bg-status-dropped/15 text-status-dropped',
  },
  done: { label: 'Done', color: 'bg-status-done/15 text-status-done' },
}

export const projectStatusConfig: Record<ProjectStatus, StatusConfig> = {
  planning: {
    label: 'Planning',
    color: 'bg-status-planning/15 text-status-planning',
  },
  ready: { label: 'Ready', color: 'bg-status-ready/15 text-status-ready' },
  'in-progress': {
    label: 'Active',
    color: 'bg-status-in-progress/15 text-status-in-progress',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-status-blocked/15 text-status-blocked',
  },
  paused: { label: 'Paused', color: 'bg-status-paused/15 text-status-paused' },
  done: { label: 'Done', color: 'bg-status-done/15 text-status-done' },
}

// Task status ordering: primary statuses first, then secondary after separator
export const taskPrimaryStatuses: TaskStatus[] = [
  'inbox',
  'ready',
  'in-progress',
  'blocked',
  'done',
]
export const taskSecondaryStatuses: TaskStatus[] = ['icebox', 'dropped']

// Project status ordering
export const projectPrimaryStatuses: ProjectStatus[] = [
  'planning',
  'ready',
  'in-progress',
  'blocked',
]
export const projectSecondaryStatuses: ProjectStatus[] = ['paused', 'done']
```

### 2.2 Update Consumers

**Files to update:**

| File                                                | Current                                                               | Change                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/components/tasks/task-status-pill.tsx`         | Defines & exports `statusConfig`, `allStatuses`                       | Import from `@/config/status`, remove local definitions         |
| `src/components/projects/project-status-pill.tsx`   | Defines `projectStatusConfig`, `primaryStatuses`, `secondaryStatuses` | Import from `@/config/status`, remove local definitions         |
| `src/components/projects/project-status-badges.tsx` | Local `statusConfig`                                                  | Import `projectStatusConfig` from `@/config/status`             |
| `src/components/tasks/project-header.tsx`           | Local `statusConfig`                                                  | Import `projectStatusConfig` from `@/config/status`             |
| `src/components/cards/project-card.tsx`             | Local `statusConfig`                                                  | Import `projectStatusConfig` from `@/config/status`             |
| `src/components/kanban/kanban-column.tsx`           | Imports `statusConfig` from `task-status-pill`                        | Import `taskStatusConfig` from `@/config/status` (rename usage) |
| `src/components/kanban/area-kanban-board.tsx`       | Imports `statusConfig` from `task-status-pill`                        | Import `taskStatusConfig` from `@/config/status` (rename usage) |

**Note:** The pill components also export `statusConfig`/`projectStatusConfig` - these re-exports can be removed since consumers should import from `@/config/status` directly.

**Order matters:** Update the kanban files (`kanban-column.tsx`, `area-kanban-board.tsx`) BEFORE removing exports from `task-status-pill.tsx`, or do all updates atomically. Otherwise the build will break.

**Testing:** Visual regression - all status pills/badges should render identically.

---

## Phase 3: Extract Shared View Utilities

### 3.1 Extract getContextName

**Current locations:**

- `src/components/views/today-view.tsx:65-78`
- `src/components/views/inbox-view.tsx:25-38`

Identical implementation in both.

**Option A:** Add to `AppDataContext`

```typescript
// In app-data-context.tsx
const getTaskContextName = useCallback(
  (task: Task): string | undefined => {
    if (task.projectId) {
      const project = getProjectById(task.projectId)
      return project?.title
    }
    if (task.areaId) {
      const area = getAreaById(task.areaId)
      return area?.title
    }
    return undefined
  },
  [getProjectById, getAreaById]
)
```

**Option B:** Create dedicated hook `src/hooks/use-task-context.ts`

**Recommendation:** Option A - keeps related data logic together in context.

### 3.2 Extract CollapsibleNotesSection

**Current locations:**

- `src/components/views/project-view.tsx:76-117`
- `src/components/views/area-view.tsx:131-173`

Nearly identical collapsible notes UI with same:

- Button styling
- Expand/collapse animation
- Collapsed preview logic (first 100 chars + "...")
- ChevronDown rotation

**Create:** `src/components/collapsible-notes-section.tsx`

```typescript
interface CollapsibleNotesSectionProps {
  notes: string
  title?: string // "About this project" | "About this area"
  defaultExpanded?: boolean
}

export function CollapsibleNotesSection({
  notes,
  title = 'Notes',
  defaultExpanded = false,
}: CollapsibleNotesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  // ... shared implementation
}
```

---

## Phase 4: Code Quality Improvements

Lower priority, can be done incrementally.

### 4.1 Use CVA for TaskCard Variants

**File:** `src/components/cards/task-card.tsx`

Current verbose variant classes (lines 194-244) could use `cva()` which is already installed:

```typescript
import { cva } from 'class-variance-authority'

const taskCardVariants = cva(
  // Base classes
  'group relative rounded-lg border p-3 transition-all duration-200...',
  {
    variants: {
      variant: {
        default: 'bg-card border-border hover:border-border/80...',
        overdue: 'bg-red-50 dark:bg-red-950/30 border-red-200/50...',
        deferred: 'bg-amber-50/50 dark:bg-amber-950/20...',
        done: 'bg-muted/30 border-border/50...',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)
```

### 4.2 Fix Empty handleReorder Callbacks

**Files:**

- `src/components/views/today-view.tsx:82-84`
- `src/components/views/inbox-view.tsx:40-42`

Current no-op handlers are misleading:

```typescript
const handleReorder = React.useCallback(() => {
  // Visual reorder only - not persisted
}, [])
```

**Options:**

1. Make `onTasksReorder` optional in `TaskList` interface, handle undefined
2. Add `TODO:` comment explaining this is intentional placeholder
3. Implement actual reorder logic if needed

**Recommendation:** Option 1 - cleaner API, explicit about what's supported.

### 4.3 Clean Up Legacy Data Exports

**File:** `src/data/app-data.ts`

Exports standalone helper functions that duplicate `AppDataContext` methods:

- `getAreaById()`
- `getProjectById()`
- `getTasksByProjectId()`
- etc.

These operate on static `appData` while context operates on reactive state.

**Options:**

1. Remove standalone exports (breaking if anything uses them directly)
2. Keep with comment explaining non-reactive use case (tests, initial data)
3. Have them read from a shared source

**Recommendation:** Audit usage first. If only used in context initialization, keep but document. If used elsewhere, update to use context.

### 4.4 Standardize Handler Naming

Current inconsistency:

- `onStatusChange` vs `onTaskStatusChange`
- `onTitleChange` vs `onTaskTitleChange`
- `onOpenDetail` vs `onTaskOpenDetail` vs `onEditClick`

**Convention to adopt:**

- Cross-component props: `onTask*` prefix (e.g., `onTaskStatusChange`)
- Internal handlers: short form (e.g., `handleStatusChange`)

This is low priority - only address when touching these files for other reasons.

---

## Implementation Order

```
Phase 1 (Safe, immediate)
├── 1.1 Delete example files (example.tsx, component-example.tsx)
├── 1.2 Delete CardGrid + update cards/index.ts
└── 1.3 Keep AreaCard (no action)

Phase 2 (High impact, medium risk)
├── 2.1 Create src/config/status.ts
└── 2.2 Update all 7 consumers (test after each)

Phase 3 (Medium impact, low risk)
├── 3.1 Extract getContextName to context
└── 3.2 Extract CollapsibleNotesSection component

Phase 4 (Low priority, incremental)
├── 4.1 CVA for TaskCard (optional)
├── 4.2 Fix handleReorder callbacks
├── 4.3 Clean up legacy data exports
└── 4.4 Standardize handler naming (opportunistic)
```

---

## Testing Checklist

After each phase, verify:

- [ ] `bun run build` passes (type checking)
- [ ] `bun run lint` passes
- [ ] App renders without console errors
- [ ] All status badges/pills display correctly
- [ ] Project and area views render notes correctly
- [ ] Task cards display all variants correctly
- [ ] No visual regressions in sidebar or main content

---

## Files Changed Summary

**New files:**

- `src/config/status.ts`
- `src/components/collapsible-notes-section.tsx`

**Deleted files:**

- `src/components/example.tsx`
- `src/components/component-example.tsx`
- `src/components/cards/card-grid.tsx`

**Modified files:**

- `src/components/cards/index.ts` (remove CardGrid export)
- `src/components/tasks/task-status-pill.tsx`
- `src/components/projects/project-status-pill.tsx`
- `src/components/projects/project-status-badges.tsx`
- `src/components/tasks/project-header.tsx`
- `src/components/cards/project-card.tsx`
- `src/components/kanban/kanban-column.tsx`
- `src/components/kanban/area-kanban-board.tsx`
- `src/components/views/today-view.tsx`
- `src/components/views/inbox-view.tsx`
- `src/components/views/project-view.tsx`
- `src/components/views/area-view.tsx`
- `src/context/app-data-context.tsx`

**Kept (no changes):**

- `src/components/cards/area-card.tsx` (for future use)
