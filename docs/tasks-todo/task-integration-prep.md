# Integration Prep: taskdn-experiment → tdn-desktop

Pre-integration refactoring tasks to prepare this UI exploration codebase for incorporation into the Tauri desktop app.

## Context

This codebase (`taskdn-experiment`) contains UI components, patterns, and interactions for the Taskdn task management app. It uses mock data and React Context for state. The destination codebase (`tdn-desktop`) is a Tauri app using:

- **Zustand** for global UI state
- **TanStack Query** for persistent data (from Rust backend)
- **Command system** for user actions
- Same **shadcn/ui** component library (base-nova style)

The goal is to migrate components piece-by-piece into tdn-desktop, while implementing the real backend, state management, tauri commands etc. This document tracks refactoring needed to make that migration smooth.

---

## 1. Component Extractions

### 1.1 Extract DateButton to ui/

**File:** `src/components/tasks/task-detail-panel.tsx` (lines 296-381)

**Action:** Extract the `DateButton` component and its supporting types/styles to `src/components/ui/date-button.tsx`.

**Why:** This is a reusable date picker trigger pattern. It's currently inline in TaskDetailPanel but could be used in other contexts (quick capture, kanban cards, etc.).

**Details:**

- Extract `DateButtonProps` interface
- Extract `dateButtonStyles` object
- Export both the component and styles for variant customization
- Update TaskDetailPanel import

---

### 1.2 Extract SearchableSelect to ui/

**File:** `src/components/tasks/task-detail-panel.tsx` (lines 207-291)

**Action:** Extract the `SearchableSelect` component to `src/components/ui/searchable-select.tsx`.

**Why:** This is a generic popover + command pattern for searchable dropdowns. Used for project/area selection but applicable anywhere.

**Details:**

- Extract `SearchableSelectProps` interface
- Consider making the icon prop more flexible (ReactNode already, but document it)
- Update TaskDetailPanel import

---

## 2. File Organization

### 2.1 Create layout/ Directory

**Action:** Create `src/components/layout/` directory with structural components.

**Why:** tdn-desktop uses `components/layout/` for MainWindow, sidebars, etc. Aligning structure makes the mental model consistent.

**Files to create** (naming follows tdn-desktop convention):

- `layout/ViewHeader.tsx` - Extract header from App.tsx (lines 97-116)
- `layout/ContentArea.tsx` - Main content wrapper
- `layout/DetailSideBar.tsx` - Right sidebar container (lines 121-132 of App.tsx)

Note: tdn-desktop uses PascalCase with "SideBar" (two words), e.g., `LeftSideBar.tsx`, `RightSideBar.tsx`.

**Current App.tsx structure to extract:**

```tsx
// Header section (line 97-116)
<header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
  <h1>...</h1>
  {/* badges, status pill, view toggle */}
</header>

// Right sidebar (lines 121-132)
<aside className={`bg-sidebar border-l ...`}>
  <TaskDetailPanel />
</aside>
```

---

### 2.2 Move Orphaned Files

**Files at component root:**

- `src/components/main-content.tsx`
- `src/components/collapsible-notes-section.tsx`

**Actions:**

- Move `main-content.tsx` → `layout/MainContent.tsx`
- Move `collapsible-notes-section.tsx` → `ui/collapsible-notes.tsx` (it's a reusable UI pattern)

---

## 3. Type System Cleanup

### 3.1 Consider Renaming selection.ts

**Current:** `src/types/selection.ts`

**Consider:** Renaming to `navigation.ts`

**Why:** "Selection" is ambiguous (could mean selected tasks). "Navigation" better describes the purpose (tracking which view/area/project is active).

**Impact:** Low - only a few files import this. Search for `from '@/types/selection'`.

---

### 3.2 Add Type Documentation Comments

**File:** `src/types/data.ts`

**Action:** Add JSDoc comments noting these types will eventually be generated from Rust:

```ts
/**
 * Core data types matching the Taskdn S1 specification.
 *
 * NOTE: When integrating with tdn-desktop, these types will be replaced
 * by types generated via tauri-specta from the Rust backend. The shape
 * should remain similar, but source of truth moves to Rust.
 */
```

---

## 4. shadcn/ui Verification

### 4.1 Compare UI Components

**Action:** Run a diff between `src/components/ui/` in both codebases.

**Commands:**

```bash
diff -rq /path/to/taskdn-experiment/src/components/ui \
         /path/to/tdn-desktop/src/components/ui
```

**Known matches:**

- `button.tsx` - Identical (verified)

**To verify:**

- `sidebar.tsx`
- `resizable.tsx`
- `popover.tsx`
- `dialog.tsx`
- `command.tsx`
- All others

**Resolution:** For any differences, adopt tdn-desktop's version (canonical).

---

### 4.2 Components Only in taskdn-experiment

UI components that exist here but not in tdn-desktop:

- `collapsible.tsx`
- `combobox.tsx`
- `markdown-preview.tsx`
- `progress-circle.tsx`
- `view-toggle.tsx`

These will need to be copied to tdn-desktop during integration.

---

## 5. CSS/Theming

### 5.1 Document Custom Tokens

**File:** `src/index.css`

**Action:** Create clear sections in the CSS file documenting custom tokens:

```css
/* ==========================================================================
   TASKDN CUSTOM TOKENS
   These extend the base shadcn theme for task management UI.
   When merging into tdn-desktop, add these to theme-variables.css
   ========================================================================== */

/* Status colors - used by status pills, checkboxes, kanban columns */
--status-inbox: oklch(...);
...

/* Entity accent colors - subtle tints for project/area UI */
--entity-project: oklch(...);
...

/* Icon colors - nav item icons in sidebar */
--icon-today: oklch(...);
...
```

---

### 5.2 Verify No Conflicts with tdn-desktop

**Action:** Compare CSS custom property names between codebases.

**Check for:**

- Same property name, different value
- Naming convention mismatches

**tdn-desktop file:** `src/theme-variables.css`

---

## 6. Hook Documentation

### 6.1 Add JSDoc to Complex Hooks

**Files:**

- `src/hooks/use-sidebar-order.ts`
- `src/hooks/use-calendar-order.ts`

**Action:** Add JSDoc comments explaining:

- What problem the hook solves
- When each returned function should be called
- How it interacts with the data layer

**Example:**

```ts
/**
 * Manages sidebar display order separately from entity data.
 *
 * This hook tracks the visual ordering of areas and projects in the sidebar,
 * allowing drag-and-drop reordering without modifying the underlying entities.
 *
 * When a project is moved to a different area, this hook updates both:
 * 1. The display order (local state)
 * 2. The project's areaId (via updateProjectArea from AppDataContext)
 *
 * @returns Object with ordered data and reorder functions
 */
export function useSidebarOrder() { ... }
```

---

## 7. Data Access Documentation

### 7.1 Document Components That Access Context Directly

**Why:** During Tauri integration, components that directly call `useAppData()` will need the most rework (migrating to TanStack Query hooks).

**Components with direct useAppData() access:**

| Component               | File                          | Notes                     |
| ----------------------- | ----------------------------- | ------------------------- |
| TaskDetailPanel         | `tasks/task-detail-panel.tsx` | Heavy usage (~15 calls)   |
| ProjectView             | `views/project-view.tsx`      | Data fetching + mutations |
| TodayView               | `views/today-view.tsx`        | Filtering + mutations     |
| WeekView                | `views/week-view.tsx`         | Similar to TodayView      |
| InboxView               | `views/inbox-view.tsx`        | Filtering + mutations     |
| AreaView                | `views/area-view.tsx`         | Data fetching + mutations |
| NoAreaView              | `views/no-area-view.tsx`      | Similar to AreaView       |
| CalendarView            | `views/calendar-view.tsx`     | Data fetching + mutations |
| AppSidebar              | `sidebar/left-sidebar.tsx`    | Via useSidebarOrder       |
| AppContent (in App.tsx) | `App.tsx`                     | Header data               |

**Action:** Add `// TODO(tauri-integration): Migrate to TanStack Query` comments at the top of each file's useAppData() usage.

---

## 8. Create MIGRATION-NOTES.md

**Action:** Create `docs/MIGRATION-NOTES.md` containing:

1. **Component inventory** - All components with brief descriptions and their purpose
2. **Data flow documentation** - How data currently flows through the app
3. **Integration instructions** - Step-by-step notes for bringing each component into tdn-desktop
4. **Known issues/quirks** - Any gotchas discovered during this refactoring

**Structure:**

```md
# Migration Notes: taskdn-experiment → tdn-desktop

## Component Inventory

### Layout Components

### Task Components

### View Components

### UI Primitives (shadcn extensions)

## Data Flow

### Current Architecture (React Context)

### Target Architecture (Zustand + TanStack Query)

## Integration Sequence

### Phase 1: UI Primitives

### Phase 2: Layout Shell

### Phase 3: Views (one at a time)

## Notes & Gotchas
```

**Timing:** Create this document after completing the refactoring tasks above. Update it as we work.

---

## 9. State Management Migration (Zustand)

> **Note:** This section is intentionally last. The tasks above are independent and can proceed without Zustand migration. Consider the tradeoffs before proceeding here.

### 9.1 Convert TaskDetailContext to Zustand

**Current:** `src/context/task-detail-context.tsx`

**Target pattern:** Match `tdn-desktop/src/store/ui-store.ts` style.

**New file:** `src/store/task-detail-store.ts`

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface TaskDetailState {
  openTaskId: string | null
  openTask: (taskId: string) => void
  closeTask: () => void
}

export const useTaskDetailStore = create<TaskDetailState>()(
  devtools(
    (set) => ({
      openTaskId: null,
      openTask: (taskId) => set({ openTaskId: taskId }, undefined, 'openTask'),
      closeTask: () => set({ openTaskId: null }, undefined, 'closeTask'),
    }),
    { name: 'task-detail-store' }
  )
)

// Convenience selector
export const useIsTaskDetailOpen = () =>
  useTaskDetailStore((state) => state.openTaskId !== null)
```

**Migration steps:**

1. Create the store file
2. Update imports in consuming components
3. Remove the Context provider from App.tsx
4. Delete the old context file

---

### 9.2 Convert ViewModeContext to Zustand

**Current:** `src/context/view-mode-context.tsx`

**New file:** `src/store/view-mode-store.ts`

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ViewMode } from '@/components/ui/view-toggle'

type ViewModeKey = 'this-week' | 'project' | 'area'

const defaultModes: Record<ViewModeKey, ViewMode> = {
  'this-week': 'calendar',
  project: 'list',
  area: 'list',
}

interface ViewModeState {
  modes: Record<ViewModeKey, ViewMode>
  getViewMode: (key: ViewModeKey) => ViewMode
  setViewMode: (key: ViewModeKey, mode: ViewMode) => void
}

export const useViewModeStore = create<ViewModeState>()(
  devtools(
    (set, get) => ({
      modes: defaultModes,
      getViewMode: (key) => get().modes[key] ?? defaultModes[key],
      setViewMode: (key, mode) =>
        set(
          (state) => ({ modes: { ...state.modes, [key]: mode } }),
          undefined,
          'setViewMode'
        ),
    }),
    { name: 'view-mode-store' }
  )
)
```

---

### 9.3 Considerations for AppDataContext

**Do NOT convert AppDataContext to Zustand now.**

**Reasons:**

1. It contains entity data (areas, projects, tasks) that will become TanStack Query in tdn-desktop
2. Converting to Zustand would be throwaway work
3. The current Context pattern actually maps reasonably to TanStack Query's hook-based API

**See also:** `taskdn/docs/product-overviews/desktop/desktop-data-architecture-research.md` for the full data architecture design including TanStack Query patterns, event-driven invalidation, and the Rust VaultIndex.

**Future path:** When integrating with Tauri, replace `useAppData()` calls with:

- `useQuery` hooks for data fetching
- `useMutation` hooks for updates
- Zustand for derived UI state if needed

**Key patterns from the architecture research:**

1. **Query keys use entity IDs, not file paths:**
   ```typescript
   // Good - stable across renames, hierarchical
   ['tasks', 'list']                  // All tasks
   ['tasks', 'list', { projectId }]   // Tasks for a project
   ['tasks', taskId]                  // Single task

   // Bad - breaks on rename
   ['file', '/path/to/task.md']
   ```

2. **Event-driven invalidation:** Rust emits events (`vault-changed`, `entity-updated`) when files change. TanStack Query listens and invalidates relevant queries.

3. **Optimistic updates:** Mutations update the cache immediately, then Rust confirms (or rollback on error). The research doc has the full pattern.

4. **Rust VaultIndex is authoritative:** TanStack Query is just a cache. The lookup helpers currently in `AppDataContext` (`getTasksByProjectId`, etc.) will become Tauri commands that query the Rust index directly.

---

## Task Checklist

Quick reference for tracking progress:

- [ ] 1.1 Extract DateButton to ui/
- [ ] 1.2 Extract SearchableSelect to ui/
- [ ] 2.1 Create layout/ directory with extracted components
- [ ] 2.2 Move orphaned files
- [ ] 3.1 Rename selection.ts → navigation.ts (if decided)
- [ ] 3.2 Add type documentation comments
- [ ] 4.1 Compare UI components between codebases
- [ ] 4.2 Document components only in taskdn-experiment
- [ ] 5.1 Document custom CSS tokens
- [ ] 5.2 Verify no CSS conflicts with tdn-desktop
- [ ] 6.1 Add JSDoc to complex hooks
- [ ] 7.1 Add TODO comments for data access points
- [ ] 8 Create MIGRATION-NOTES.md
- [ ] 9.1 Convert TaskDetailContext to Zustand
- [ ] 9.2 Convert ViewModeContext to Zustand
- [ ] Run `bun run fix && bun run check`
