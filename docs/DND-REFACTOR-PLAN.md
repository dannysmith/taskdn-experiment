# Drag-and-Drop Refactor Plan

This document outlines the plan to improve the feel and smoothness of drag-and-drop in task lists and sidebar, bringing them up to the quality of the Kanban and Calendar views.

## Quick Summary (For New Sessions)

**Problem:** Task list drag-and-drop feels janky compared to Kanban/Calendar.

**Root cause:** Transform suppression during cross-container drag, plus per-item state calculations.

**Solution:** Implement dnd-kit's official multi-container pattern:
1. Maintain `visualItemsByContainer` state during drag (separate from entity data)
2. Update visual order in `onDragOver` (items shift between containers)
3. Update entity data only in `onDragEnd`
4. Always apply transforms, remove axis restriction

**Key files to modify:**
- `src/components/tasks/task-dnd-context.tsx` - Add visual order state, update handlers
- `src/components/tasks/task-list-item.tsx` - Extract to `task-item.tsx`, create `sortable-task-item.tsx`
- `src/components/tasks/task-list.tsx` - Use new components

**First step:** `bun add @dnd-kit/helpers`

---

## Critical Corrections (Review Findings)

After deeper analysis, several claims in the original plan were incorrect or incomplete:

### Correction 1: Kanban Does NOT Use Dynamic SortableContext Items

**Original claim:** "Kanban uses dynamic SortableContext items during drag"

**Reality:** Kanban does NOT update items during drag. Each column's `SortableContext` items stay constant. Kanban feels smooth because:
1. Transforms are always applied (no suppression)
2. Cross-column drops don't need to show exact insertion position within target column
3. Visual feedback is just column highlight + semi-transparent dragged card

**Implication:** For task lists where we NEED exact insertion position feedback, we must implement dynamic items properly (unlike Kanban).

### Correction 2: Sidebar Updates Entity Data During Drag (Risky Pattern)

**Original claim:** "Follow the sidebar pattern"

**Issue:** The sidebar's `moveProjectToArea` function updates BOTH display order AND entity data (`project.areaId`) during `onDragOver`. This means:
- If user cancels drag, entity data has already changed
- No cancel handling exists in the sidebar

**Implication:** For tasks, we should NOT update `task.projectId` during drag. We need:
- Separate "visual position during drag" state
- Entity data updates only on `onDragEnd`
- Revert visual state on `onDragCancel`

### Correction 3: Missing Package

The `@dnd-kit/helpers` package (which provides the `move` helper for multi-container) is NOT installed. Current packages:
- @dnd-kit/core: ^6.3.1
- @dnd-kit/modifiers: ^9.0.0
- @dnd-kit/sortable: ^10.0.0
- @dnd-kit/utilities: ^3.2.2

**Decision:** Install `@dnd-kit/helpers` as part of this refactor.

### Correction 4: dnd-kit's Official Recommendation

Per dnd-kit documentation, the correct pattern for multi-container IS to update SortableContext items during `onDragOver`:

```tsx
<DndContext
  onDragOver={(event) => {
    setItems((items) => move(items, event));
  }}
>
```

This is different from both our current task list implementation (which suppresses transforms) AND our Kanban implementation (which doesn't update items). The official pattern is the right approach.

---

## Problem Summary

The Kanban and Calendar drag-and-drop feels smooth and natural. The task list drag-and-drop (in AreaView, TodayView, NoAreaView) and sidebar drag-and-drop feels janky and slightly "off".

### Root Causes Identified

1. **Transform suppression during cross-container drag** (`task-list-item.tsx:109-111`)
   - All transforms are disabled when dragging to a different container
   - Creates abrupt visual "snap" instead of smooth animation

2. **Using `CSS.Translate` instead of `CSS.Transform`**
   - Task lists use the more limited `CSS.Translate.toString()`
   - Kanban/Calendar use `CSS.Transform.toString()` which handles full transform matrix

3. **`restrictToVerticalAxis` modifier**
   - Feels constrained, especially during cross-container operations
   - Kanban/Calendar don't use any modifiers

4. **Complex visual state management**
   - Task list items have 5+ conditional visual states
   - Kanban cards have only 2 states (normal, dragging)
   - Complex transitions cause visual "jumps"

5. **Re-render cascades**
   - Every `TaskListItem` calls `useTaskDragPreview()` and recalculates state
   - During drag, frequent state changes trigger re-renders across all items

## Current Architecture Overview

### Views Using TaskDndContext (Multi-Container)

| View | Containers | Cross-Container Ops |
|------|------------|---------------------|
| **AreaView** | Projects + Loose Tasks | Move task between projects |
| **TodayView** | 3 sections (scheduled, overdue, available) | Move to scheduled-today only |
| **NoAreaView** | Orphan projects + Orphan tasks | Move between projects |

### Views Using Standalone DnD

| View | Container | Cross-Container Ops |
|------|-----------|---------------------|
| **ProjectView** (list) | Single project | None |
| **InboxView** | Single inbox | None |

### Key Data Flow

**Cross-container drop:**
```
onTaskMove(taskId, fromProjectId, toProjectId, insertBeforeTaskId)
  → Updates task.projectId and/or task.areaId in backend
  → UI re-renders with new tasksByProject map
```

**Within-container reorder:**
```
onTasksReorder(containerId, reorderedTasks)
  → Updates UI order only (not backend task data)
```

## Proposed Architecture

Combine Kanban's simplicity (simple visual states, always apply transforms) with dnd-kit's official multi-container pattern (dynamic SortableContext items during drag).

### Core Principles

1. **Always apply transforms** - Never suppress transforms during cross-container drag
2. **Simple visual states** - Dragging item gets `opacity-50`, nothing more
3. **Use `CSS.Transform`** - Full transform support, not just translate
4. **No axis restriction** - Let items move freely, collision detection handles the rest
5. **Context-level cross-container logic** - Individual items don't need to know about cross-container state
6. **Drop indicators via target highlighting** - Highlight the target container/position, not complex indicators on every item

### Component Changes

#### 1. New `SortableTaskItem` Component

Replace the sortable logic in `TaskListItem` with a dedicated wrapper, following the `SortableKanbanCard` pattern.

**Location:** `src/components/tasks/sortable-task-item.tsx` (new file)

```tsx
// Pattern from SortableKanbanCard (kanban-column.tsx:253-319)
export function SortableTaskItem({
  task,
  containerId,
  ...taskItemProps
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getDragId(containerId, task.id),
    data: { type: 'task', taskId: task.id, containerId },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),  // Always apply
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-manipulation', isDragging && 'opacity-50')}
    >
      <TaskItem task={task} {...taskItemProps} />
    </div>
  )
}
```

#### 2. Refactor `TaskListItem` → `TaskItem`

Extract the visual/interactive part of `TaskListItem` into a pure presentational component `TaskItem` that has no drag-and-drop awareness.

**Changes to `task-list-item.tsx`:**
- Remove all `useSortable` logic
- Remove `useTaskDragPreview()` usage
- Remove `shouldShowDropIndicator` calculations
- Remove drag-related CSS classes
- Rename to `TaskItem` (presentational only)

The new `TaskItem` handles:
- Display (checkbox, title, metadata)
- Click/double-click selection
- Inline editing
- Keyboard navigation (passed from parent)

#### 3. Simplify `TaskDndContext`

**Changes to `task-dnd-context.tsx`:**

Remove:
- `restrictToVerticalAxis` modifier (line 359)
- Complex `shouldShowDropIndicator` helper (lines 397-420)

Simplify drag preview state:
- Track only: `{ taskId, task, sourceContainerId }` during drag
- Don't track `currentProjectId` or `overTaskId` in preview state
- Let collision detection handle drop target identification

Add container highlighting:
- Expose `activeContainerId` and `overContainerId` from context
- Containers can highlight themselves when they're potential drop targets

#### 4. Refactor `TaskList`

**Changes to `task-list.tsx`:**

- Use new `SortableTaskItem` wrapper around `TaskItem`
- Receive drop target highlighting state from context
- Show container-level drop indicator (e.g., border highlight) instead of per-item indicators
- Simplify keyboard navigation (no drag state awareness needed in items)

#### 5. Update Container Components

**`SectionTaskGroup` and `ProjectTaskGroup`:**
- Add visual highlighting when they are drop targets
- Use context's `overContainerId` to determine if highlighted

### Drop Indicator Strategy

**Current approach (problematic):**
- Each `TaskListItem` calculates if it should show a drop indicator line
- Requires every item to re-render when drag state changes
- Transforms are suppressed during cross-container drag, preventing natural item shifting

**New approach (use dnd-kit's natural behavior):**
- Let items in the target container naturally shift/animate to show insertion position
- This is how Kanban works - items move apart to make room for the dragged item
- The key fix: **don't suppress transforms during cross-container drag**
- When dragging from Container A to Container B:
  - Container A: dragged item shows at `opacity-50` (or could be hidden)
  - Container B: items shift to show where the drop will occur
- No custom drop indicator line needed - the gap between items IS the indicator
- The experience becomes identical to within-container reordering

### Technical Deep-Dive: Why Transform Suppression Exists

The current code suppresses transforms to prevent the source list from "shifting" weirdly when you drag to a different container. The problem: when you drag a task out of its list, dnd-kit's `SortableContext` doesn't know you've "left" - it still thinks you're reordering within the list, so items shift around confusingly.

**Current workaround (causes jankiness):**
```tsx
// task-list-item.tsx:109-111
transform: isCrossContainerDragActive
  ? undefined  // Disable ALL transforms to prevent source list weirdness
  : CSS.Translate.toString(transform),
```

This "fixes" the source list but breaks the target list - items there can't shift either.

**Proper solution: Update SortableContext items dynamically**

When an item is dragged to a different container:
1. Remove it from source container's `SortableContext` items array
2. Add it to target container's `SortableContext` items array
3. Both lists now behave naturally - source closes the gap, target makes room

This is how dnd-kit's multi-container examples work. The `onDragOver` handler should:
```tsx
// Pseudo-code for the pattern
function handleDragOver(event) {
  const { active, over } = event
  if (!over) return

  const activeContainer = findContainer(active.id)
  const overContainer = findContainer(over.id)

  if (activeContainer !== overContainer) {
    // Move item between containers in VISUAL state only
    setVisualOrder(prev => {
      const activeItems = prev[activeContainer].filter(id => id !== active.id)
      const overItems = [...prev[overContainer]]
      const overIndex = overItems.indexOf(over.id)
      overItems.splice(overIndex, 0, active.id)

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      }
    })
  }
}
```

**Critical:** This updates VISUAL ORDER only, not entity data. Entity data (task.projectId) is updated in `onDragEnd`.

### Key Architecture Decision: Visual Order vs Entity Data

**The core challenge:** Our task lists derive their items from entity data (`tasks.filter(t => t.projectId === projectId)`). We can't change `task.projectId` during drag because:
1. User might cancel the drag
2. No undo mechanism exists
3. Could cause data consistency issues

**Solution: Two-layer state model**

```
Entity Data (AppDataContext)
├── tasks: Task[]           // Each task has projectId
├── projects: Project[]     // Each project has areaId
└── areas: Area[]

Visual Order During Drag (TaskDndContext internal state)
├── visualItemsByContainer: Map<string, string[]>  // task IDs per container
├── activeTaskId: string | null
└── sourceContainerId: string | null

On Drag Start:
  - Initialize visualItemsByContainer from entity data

On Drag Over:
  - Update visualItemsByContainer (move task ID between containers)
  - SortableContexts use visualItemsByContainer, not entity data

On Drag End:
  - Call onTaskMove() to update entity data
  - Clear visual order state (will reinitialize from entity data)

On Drag Cancel:
  - Clear visual order state (reverts to entity data)
```

This pattern is similar to `useSidebarOrder` but WITHOUT updating entity data during drag.

### Visual States Comparison

**Current `TaskListItem` states:**
1. Normal
2. Selected (not editing)
3. Editing
4. Dragging within same container (`opacity-50`)
5. Dragging to different container (`opacity-0`)
6. Being dragged over (drop indicator)

**New `SortableTaskItem` + `TaskItem` states:**
1. Normal / Selected / Editing (handled by `TaskItem`)
2. Dragging (`opacity-50`, handled by `SortableTaskItem`)

**Container-level visual state:**
- Normal
- Drop target (highlighted border/background)

## Implementation Plan

### Phase 1: Create New Components (Non-Breaking)

1. **Create `TaskItem` component**
   - Extract presentational logic from `TaskListItem`
   - No drag-and-drop awareness
   - Same props as current `TaskListItem` minus drag props

2. **Create `SortableTaskItem` component**
   - Wrapper following `SortableKanbanCard` pattern
   - Uses `useSortable` with simplified data structure
   - Always applies transforms
   - Simple `opacity-50` when dragging

3. **Create `TaskListContainer` component**
   - Wraps task items with `SortableContext`
   - Receives drop target state from context
   - Shows container-level highlighting

### Phase 2: Update TaskDndContext (Core Change)

This is the most critical phase - implementing the visual order state mechanism.

1. **Add visual order state**
   - New state: `visualItemsByContainer: Map<string, string[]>` (task IDs per container)
   - Initialize from `tasksByProject` prop on drag start
   - Clear on drag end/cancel

2. **Update `onDragOver` to move items between containers**
   - When dragging to a different container, update `visualItemsByContainer`
   - Remove task ID from source container's array
   - Insert task ID into target container's array at hover position
   - Respect Today view restrictions (only allow moves TO scheduled-today)

3. **Expose visual order for SortableContexts**
   - Each `SortableContext` uses `visualItemsByContainer.get(containerId)` during drag
   - Falls back to entity-derived data when not dragging

4. **Remove problematic patterns**
   - Remove `restrictToVerticalAxis` modifier
   - Remove `shouldShowDropIndicator` helper
   - Remove `currentProjectId`, `overTaskId` from drag preview (no longer needed)

5. **Update `onDragEnd` handler**
   - Use final position from `visualItemsByContainer` to determine `insertBeforeTaskId`
   - Call `onTaskMove()` with correct position
   - Clear visual order state

6. **Add `onDragCancel` handler**
   - Clear visual order state (reverts to entity data)

### Phase 3: Migrate Views

1. **AreaView**
   - Replace `TaskList` usage with new `TaskListContainer` + `SortableTaskItem`
   - Update `ProjectTaskGroup` to use container highlighting

2. **TodayView**
   - Same migration
   - Preserve the restricted cross-section logic (only allow moves to scheduled-today)

3. **NoAreaView**
   - Same migration

4. **ProjectView and InboxView**
   - These use `DraggableTaskList` (standalone)
   - Create new `SortableTaskList` that follows same pattern
   - Simpler since no cross-container operations

### Phase 4: Handle Mixed Items (Tasks + Headings)

The `OrderedItemList` component handles mixed tasks and headings (used in TodayView's scheduled-today section).

1. **Create `SortableHeadingItem`**
   - Same pattern as `SortableTaskItem`
   - Wraps `HeadingItem` (presentational)

2. **Create `OrderedItemListContainer`**
   - Renders mixed `SortableTaskItem` and `SortableHeadingItem`
   - Same container highlighting pattern

### Phase 5: Sidebar (If Time Permits)

The sidebar (`left-sidebar.tsx`) has similar issues. Apply the same patterns:

1. **Simplify `DraggableArea` and `DraggableProject`**
   - Follow the new simpler pattern
   - Always apply transforms
   - Container highlighting for areas

2. **Consider removing `restrictToVerticalAxis`**
   - Sidebar is vertical-only, but the restriction may still feel constraining

## File Changes Summary

### New Files
- `src/components/tasks/task-item.tsx` - Presentational task component
- `src/components/tasks/sortable-task-item.tsx` - Sortable wrapper
- `src/components/tasks/task-list-container.tsx` - Container with SortableContext
- `src/components/tasks/sortable-task-list.tsx` - Standalone sortable list (replaces DraggableTaskList)

### Modified Files
- `src/components/tasks/task-dnd-context.tsx` - Simplify state, remove modifier
- `src/components/tasks/task-list.tsx` - Use new components (may become thin wrapper or be removed)
- `src/components/tasks/task-list-item.tsx` - Extract to `task-item.tsx`, then delete or keep as re-export
- `src/components/tasks/section-task-group.tsx` - Use new container components
- `src/components/tasks/project-task-group.tsx` - Use new container components
- `src/components/tasks/ordered-item-list.tsx` - Similar refactor for mixed items
- `src/components/views/area-view.tsx` - Minor updates to use new components
- `src/components/views/today-view.tsx` - Minor updates
- `src/components/views/no-area-view.tsx` - Minor updates

### Potentially Deleted Files
- Old `task-list-item.tsx` (after extracting to `task-item.tsx`)

## Testing Checklist

After implementation, verify these scenarios work smoothly:

### AreaView
- [ ] Drag task within a project (reorder)
- [ ] Drag task to a different project
- [ ] Drag task to loose tasks section
- [ ] Drag task from loose tasks to a project
- [ ] Visual feedback when hovering over target container
- [ ] Keyboard navigation still works
- [ ] Selection preserved after drop
- [ ] Creating new tasks works

### TodayView
- [ ] Drag task within scheduled-today section
- [ ] Drag task from overdue to scheduled-today
- [ ] Drag task from became-available to scheduled-today
- [ ] Cannot drop tasks INTO overdue or became-available sections (verify restriction)
- [ ] Headings can reorder within scheduled-today
- [ ] Mixed task/heading drag works correctly

### ProjectView
- [ ] Drag to reorder tasks
- [ ] Keyboard reordering (Cmd+Arrow)
- [ ] No cross-container (single list)

### InboxView
- [ ] Drag to reorder
- [ ] Keyboard reordering

### General
- [ ] Drop animation feels smooth
- [ ] No visual "snap" or "jump" during drag
- [ ] Items don't flash or flicker
- [ ] Dragged item opacity is consistent (50%)
- [ ] Auto-selection of dropped task works

## Rollback Plan

If issues arise:
1. The old components can be preserved during migration
2. Views can be switched back to old components via import changes
3. No data model changes, so rollback is purely UI

## Design Decisions (Confirmed)

1. **Insertion position precision is required**
   - Users must be able to drop at a specific position, not just append
   - Cross-container drops should feel identical to within-container reordering
   - Solution: Use dnd-kit's natural item shifting (items move apart to show insertion point)

2. **No custom drop indicator line needed**
   - The gap created by shifting items serves as the visual indicator
   - This is achieved by updating SortableContext items during drag

3. **Separate visual order from entity data**
   - Visual order state updated during `onDragOver`
   - Entity data (`task.projectId`) updated only on `onDragEnd`
   - Visual state cleared/reverted on `onDragCancel`

4. **Today view restrictions must be preserved**
   - Only allow moves TO "scheduled-today" section
   - The visual order logic should NOT move items to restricted sections
   - Restriction check happens in `onDragOver` before updating visual order

5. **Install `@dnd-kit/helpers` package**
   - Provides `move` helper for multi-container operations
   - Official recommended solution

6. **No keyboard drag support needed**
   - Current keyboard navigation (arrow keys, Cmd+Arrow for reorder) is sufficient
   - Keyboard drag (KeyboardSensor) is not required

7. **Source list closes gap when item leaves**
   - When dragging to another container, source list items shift up immediately
   - This is the natural dnd-kit behavior and provides clear visual feedback
   - The dragged item appears to "leave" the source list

## Notes

- This refactor focuses on the "feel" of drag-and-drop, not new features
- The data model and cross-container logic remain unchanged
- We're adopting dnd-kit's official multi-container pattern
- Touch support is not required
- Keyboard drag (KeyboardSensor) is not required; existing keyboard navigation suffices

## Reference: Current DnD File Locations

```
src/components/tasks/
├── task-dnd-context.tsx     # Cross-project DnD context (MAIN REFACTOR TARGET)
├── task-list.tsx            # Task list with keyboard nav
├── task-list-item.tsx       # Individual task with useSortable (REFACTOR)
├── ordered-item-list.tsx    # Mixed tasks + headings list
├── section-task-group.tsx   # Collapsible section wrapper
├── project-task-group.tsx   # Project section wrapper

src/components/kanban/
├── kanban-dnd-context.tsx   # Status-based DnD (REFERENCE - works well)
├── kanban-board.tsx         # Kanban wrapper
├── kanban-column.tsx        # Column with SortableKanbanCard (REFERENCE)

src/components/calendar/
├── week-calendar.tsx        # Calendar DnD context (REFERENCE - works well)
├── day-column.tsx           # Day column with SortableContext
├── draggable-task-card.tsx  # SortableTaskCard (REFERENCE)

src/components/sidebar/
├── left-sidebar.tsx         # Sidebar DnD (similar issues, lower priority)
├── draggable-area.tsx       # Area with useSortable
├── draggable-project.tsx    # Project with useSortable
```
