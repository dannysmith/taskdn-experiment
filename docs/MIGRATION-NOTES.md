# Migration Notes: taskdn-experiment → tdn-desktop

This document provides guidance for migrating UI components from this exploration codebase into the production Tauri app.

## Component Inventory

### Layout Components

| Component     | File                       | Description                                           |
| ------------- | -------------------------- | ----------------------------------------------------- |
| ViewHeader    | `layout/ViewHeader.tsx`    | Top header with title, status badges, and view toggle |
| ContentArea   | `layout/ContentArea.tsx`   | Main content wrapper with padding and scroll          |
| DetailSideBar | `layout/DetailSideBar.tsx` | Sliding right panel for task details                  |
| MainContent   | `layout/MainContent.tsx`   | View router based on navigation selection             |

### Task Components

| Component          | File                             | Description                            |
| ------------------ | -------------------------------- | -------------------------------------- |
| TaskDetailPanel    | `tasks/task-detail-panel.tsx`    | Full task editor in right sidebar      |
| TaskList           | `tasks/task-list.tsx`            | Draggable list of tasks                |
| TaskListItem       | `tasks/task-list-item.tsx`       | Single task row in list view           |
| TaskStatusCheckbox | `tasks/task-status-checkbox.tsx` | Checkbox with status-colored styling   |
| TaskStatusPill     | `tasks/task-status-pill.tsx`     | Dropdown pill for changing task status |
| SectionTaskGroup   | `tasks/section-task-group.tsx`   | Collapsible task section with header   |
| ProjectTaskGroup   | `tasks/project-task-group.tsx`   | Task group under a project header      |
| LazyMilkdownEditor | `tasks/lazy-milkdown-editor.tsx` | Code-split markdown editor             |
| MilkdownEditor     | `tasks/milkdown-editor.tsx`      | Full markdown editor implementation    |

### View Components

| Component    | File                      | Description                         |
| ------------ | ------------------------- | ----------------------------------- |
| TodayView    | `views/today-view.tsx`    | Tasks scheduled for today + overdue |
| WeekView     | `views/week-view.tsx`     | Week calendar or kanban view        |
| InboxView    | `views/inbox-view.tsx`    | Unprocessed inbox tasks             |
| CalendarView | `views/calendar-view.tsx` | Month calendar view                 |
| AreaView     | `views/area-view.tsx`     | Projects and tasks within an area   |
| NoAreaView   | `views/no-area-view.tsx`  | Orphan projects (no area assigned)  |
| ProjectView  | `views/project-view.tsx`  | Tasks within a single project       |

### Calendar Components

| Component         | File                               | Description                      |
| ----------------- | ---------------------------------- | -------------------------------- |
| MonthCalendar     | `calendar/month-calendar.tsx`      | Full month grid view             |
| MonthDayCell      | `calendar/month-day-cell.tsx`      | Single day cell in month view    |
| WeekCalendar      | `calendar/week-calendar.tsx`       | 7-day week view with columns     |
| DayColumn         | `calendar/day-column.tsx`          | Single day column in week view   |
| DraggableTaskCard | `calendar/draggable-task-card.tsx` | Task card for calendar drag-drop |

### Kanban Components

| Component        | File                            | Description                     |
| ---------------- | ------------------------------- | ------------------------------- |
| KanbanBoard      | `kanban/kanban-board.tsx`       | Task status kanban for projects |
| AreaKanbanBoard  | `kanban/area-kanban-board.tsx`  | Project status kanban for areas |
| KanbanColumn     | `kanban/kanban-column.tsx`      | Single status column            |
| KanbanDndContext | `kanban/kanban-dnd-context.tsx` | Drag-drop context for kanban    |

### Sidebar Components

| Component        | File                            | Description                                 |
| ---------------- | ------------------------------- | ------------------------------------------- |
| AppSidebar       | `sidebar/left-sidebar.tsx`      | Main navigation sidebar with areas/projects |
| DraggableArea    | `sidebar/draggable-area.tsx`    | Collapsible area group with drag handle     |
| DraggableProject | `sidebar/draggable-project.tsx` | Project item with drag handle               |

### Card Components

| Component   | File                     | Description                        |
| ----------- | ------------------------ | ---------------------------------- |
| TaskCard    | `cards/task-card.tsx`    | Compact task card for grids        |
| ProjectCard | `cards/project-card.tsx` | Project summary card with progress |
| AreaCard    | `cards/area-card.tsx`    | Area summary card                  |

### UI Primitives (shadcn extensions)

These extend or wrap base shadcn/ui components:

| Component        | File                       | Description                        |
| ---------------- | -------------------------- | ---------------------------------- |
| DateButton       | `ui/date-button.tsx`       | Date picker trigger with variants  |
| SearchableSelect | `ui/searchable-select.tsx` | Combobox-style searchable dropdown |
| CollapsibleNotes | `ui/collapsible-notes.tsx` | Expandable notes section           |
| MarkdownPreview  | `ui/markdown-preview.tsx`  | Read-only markdown renderer        |
| ProgressCircle   | `ui/progress-circle.tsx`   | Circular progress indicator        |
| ViewToggle       | `ui/view-toggle.tsx`       | List/kanban/calendar mode toggle   |

---

## Data Flow

### Current Architecture (React Context)

```
AppDataProvider
├── data: { areas, projects, tasks }
├── Lookup helpers: getTaskById, getProjectsByAreaId, etc.
├── Derived values: getProjectCompletion, getEffectiveAreaId
└── Mutations: createTask, updateTaskStatus, etc.

TaskDetailProvider
├── openTaskId: string | null
└── openTask/closeTask actions

ViewModeProvider
├── modes: Record<ViewModeKey, ViewMode>
└── getViewMode/setViewMode for each view
```

### Target Architecture (Zustand + TanStack Query)

```
Zustand Stores (UI state):
├── task-detail-store: { openTaskId, openTask, closeTask }
└── view-mode-store: { modes, getViewMode, setViewMode }

TanStack Query (entity data):
├── useQuery(['tasks', 'list']) → all tasks
├── useQuery(['tasks', taskId]) → single task
├── useQuery(['projects', 'list', { areaId }]) → projects by area
├── useMutation → createTask, updateTask, etc.
└── Event-driven invalidation from Rust backend
```

---

## Integration Sequence

### Phase 1: UI Primitives

Copy to tdn-desktop with minimal changes:

1. `ui/date-button.tsx` - Reusable date picker trigger
2. `ui/searchable-select.tsx` - Generic searchable dropdown
3. `ui/collapsible-notes.tsx` - Notes section UI
4. `ui/markdown-preview.tsx` - Markdown rendering
5. `ui/progress-circle.tsx` - Progress visualization
6. `ui/view-toggle.tsx` - View mode switcher

### Phase 2: Layout Shell

1. `layout/ViewHeader.tsx` - Wire to router/navigation state
2. `layout/DetailSideBar.tsx` - Wire to Zustand task-detail-store
3. `layout/ContentArea.tsx` - Simple wrapper, copy as-is

### Phase 3: Views (one at a time)

For each view:

1. Copy the view component
2. Replace `useAppData()` with TanStack Query hooks
3. Replace mutations with `useMutation` hooks
4. Test with real Rust backend

Recommended order:

1. InboxView (simplest, good for testing query setup)
2. TodayView (date filtering logic)
3. ProjectView (single entity + child tasks)
4. AreaView (multiple entities, more complex)
5. WeekView/CalendarView (most complex, calendar logic)

---

## Notes & Gotchas

### Naming Conventions

- tdn-desktop uses PascalCase with "SideBar" (two words): `LeftSideBar.tsx`, `RightSideBar.tsx`
- Types will be generated from Rust via tauri-specta (see `data.ts` comment)
- Selection/navigation types renamed to `navigation.ts`

### CSS Token Migration

Custom tokens documented in `index.css`:

- Status colors: `--status-inbox`, `--status-done`, etc.
- Entity colors: `--entity-project`, `--entity-area`
- Icon colors: `--icon-today`, `--icon-calendar`, etc.

Copy these to `tdn-desktop/src/theme-variables.css`.

### Components Not in tdn-desktop

These need to be copied:

- `ui/collapsible.tsx`
- `ui/combobox.tsx`
- `ui/markdown-preview.tsx`
- `ui/progress-circle.tsx`
- `ui/view-toggle.tsx`

### Data Access Patterns

Components marked with `TODO(tauri-integration)` have heavy `useAppData()` usage:

- TaskDetailPanel (~15 calls)
- All view components
- AppSidebar (via useSidebarOrder)

These will require the most rework during migration.

### Order Hooks

`useSidebarOrder` and `useCalendarOrder` manage display ordering separate from entity data. During migration:

- The order state can remain in Zustand or local state
- Entity mutations go through TanStack Query
- Consider if Rust backend should persist display order
