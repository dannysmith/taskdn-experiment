# Drag-and-Drop Refactor Plan

This document outlines the plan to improve the feel and smoothness of drag-and-drop in task lists and sidebar, bringing them up to the quality of the Kanban and Calendar views.

## Quick Summary (For New Sessions)

**Problem:** Task list drag-and-drop feels janky compared to Kanban/Calendar.

**Root cause:** Transform suppression during cross-container drag, plus per-item state calculations.

**Current status (as of Jan 2025):**
- ✅ Phase 1 complete: New component architecture (`TaskItem`, `SortableTaskItem`)
- ✅ Reliable drops working: Within-container and cross-container drops work correctly
- ✅ Simplified architecture: Following Kanban pattern (no visual state during drag)
- ⚠️ Outstanding issue: Cross-container drags don't show "making room" animation in target

**Key files modified:**
- `src/components/tasks/task-dnd-context.tsx` - Simplified to Kanban pattern
- `src/components/tasks/task-item.tsx` - New presentational component
- `src/components/tasks/sortable-task-item.tsx` - New sortable wrapper
- `src/components/tasks/task-list.tsx` - Updated to use new components

---

## What's Been Completed

### ✅ Phase 1: New Component Architecture

1. **Created `TaskItem` component** (`task-item.tsx`)
   - Pure presentational component with no DnD awareness
   - Handles display, editing, selection, status toggle

2. **Created `SortableTaskItem` component** (`sortable-task-item.tsx`)
   - Wrapper following `SortableKanbanCard` pattern
   - Always applies transforms (no suppression)
   - Simple `opacity-50` when dragging

3. **Updated `TaskList`** (`task-list.tsx`)
   - Uses `SortableTaskItem` instead of old `TaskListItem`
   - Simplified - no longer tracks visual items during drag

4. **Updated `TaskListItem`** (`task-list-item.tsx`)
   - Now a thin wrapper for backward compatibility
   - Re-exports `TaskItem` for existing imports

### ✅ Simplified TaskDndContext (Kanban Pattern)

After discovering issues with the `visualItemsByContainer` approach (see lessons learned below), we simplified to follow the Kanban pattern:

**Current implementation:**
- No `handleDragOver` - we don't update SortableContext items during drag
- `handleDragEnd` uses `over.data.current` directly to determine drop target
- SortableContext items are always derived from entity data
- Simple and reliable

**What works now:**
- ✅ Within-container reordering (items shift naturally)
- ✅ Cross-container drops (task moves to correct project)
- ✅ Empty container drops (via `EmptyProjectDropZone`)
- ✅ Selection preserved after drop
- ✅ Keyboard navigation works

**What doesn't work yet:**
- ❌ Cross-container "making room" animation (items in target don't shift during drag)

---

## Lessons Learned: Why visualItemsByContainer Failed

We attempted to implement dnd-kit's official multi-container pattern (updating SortableContext items during drag), but encountered fundamental issues:

### Issue 1: Collision Detection is Global

`closestCenter` collision detection considers ALL sortable items across ALL containers. When containers are stacked vertically, items near the boundary can "leak" into collision detection for adjacent containers.

**Example:** When dragging within Project1, if your cursor is closer to Project2's first item than to any Project1 item, collision detection returns the Project2 item. This causes:
- Visual state to think item moved to Project2
- Drop detection to fail (indices don't match)

### Issue 2: Adding Unrendered Items Breaks Transforms

When we add a drag ID to a container's SortableContext items but there's no corresponding DOM element (because TaskList doesn't have that task's data), dnd-kit's transform calculations break:
- Items overlap incorrectly
- Transform positions are wrong
- Visual glitches occur

**The fundamental problem:** Each TaskList only has data for ITS tasks. When we add a foreign drag ID to its SortableContext, there's no element to render for it.

### Issue 3: Visual State Diverges from Drop Target

React state updates are asynchronous. When `handleDragEnd` fires, `visualItemsByContainer` may have stale data from rapid `handleDragOver` updates. This caused drops to go to wrong containers or fail entirely.

### The Solution: Trust over.data.current

Instead of maintaining complex visual state, we now use `over.data.current` directly in `handleDragEnd` to determine the drop target. This is exactly what Kanban does, and it works reliably.

---

## Critical Corrections (Review Findings)

After deeper analysis, several claims in the original plan were incorrect or incomplete:

### Correction 1: Kanban Does NOT Use Dynamic SortableContext Items

**Original claim:** "Kanban uses dynamic SortableContext items during drag"

**Reality:** Kanban does NOT update items during drag. Each column's `SortableContext` items stay constant. Kanban feels smooth because:
1. Transforms are always applied (no suppression)
2. Cross-column drops don't need to show exact insertion position within target column
3. Visual feedback is just column highlight + semi-transparent dragged card

**Implication:** The Kanban pattern is simpler and more reliable. We're now following it.

### Correction 2: The visualItemsByContainer Pattern Has Architectural Issues

**Original claim:** "Update SortableContext items in onDragOver for smooth cross-container animations"

**Reality:** This pattern doesn't work well when:
1. Each container renders from its own task data (can't render foreign items)
2. Collision detection is global (returns items from wrong containers)
3. State updates are async (stale data at drop time)

**Implication:** A different approach is needed for cross-container "making room" animations.

### Correction 3: Package Installed

The `@dnd-kit/helpers` package is now installed (provides `move` helper), but we're not currently using it since we simplified to the Kanban pattern.

---

## Current Architecture

### TaskDndContext (Simplified)

```tsx
// No visual state during drag
// No handleDragOver

handleDragEnd = (event) => {
  const { active, over } = event
  const overData = over.data.current

  // Determine target directly from what we dropped on
  const targetContainerId = overData?.projectId ?? sourceContainerId

  if (targetContainerId !== sourceContainerId) {
    // Cross-container move
    onTaskMove(taskId, sourceContainerId, targetContainerId, insertBeforeTaskId)
  } else {
    // Same-container reorder
    onTasksReorder(containerId, reorderedTasks)
  }
}
```

### Component Hierarchy

```
TaskDndContext (provides DndContext)
├── SectionTaskGroup (Loose Tasks)
│   └── TaskList
│       └── SortableContext
│           └── SortableTaskItem
│               └── TaskItem (presentational)
├── ProjectTaskGroup (per project)
│   └── TaskList
│       └── SortableContext
│           └── SortableTaskItem
│               └── TaskItem (presentational)
```

### Visual States (Simplified)

**SortableTaskItem:**
- Normal: no special styles
- Dragging: `opacity-50`

**Container (ProjectTaskGroup/SectionTaskGroup):**
- Normal: no special styles
- Empty + drag over: shows "Drop here" text (via EmptyProjectDropZone)

---

## Testing Checklist

### AreaView
- [x] Drag task within a project (reorder) - ✅ Works
- [x] Drag task to a different project - ✅ Works
- [x] Drag task to loose tasks section - ✅ Works
- [x] Drag task from loose tasks to a project - ✅ Works
- [ ] Visual feedback when hovering over target container - ⚠️ Only for empty containers
- [x] Keyboard navigation still works - ✅ Works
- [x] Selection preserved after drop - ✅ Works
- [x] Creating new tasks works - ✅ Works

### TodayView
- [x] Drag task within scheduled-today section - ✅ Works
- [x] Drag task from overdue to scheduled-today - ✅ Works
- [x] Drag task from became-available to scheduled-today - ✅ Works

### ProjectView / InboxView
- [x] Drag to reorder tasks - ✅ Works (uses DraggableTaskList)
- [x] Keyboard reordering (Cmd+Arrow) - ✅ Works

### General
- [x] Drop animation feels smooth - ✅ Works
- [x] Dragged item opacity is consistent (50%) - ✅ Works
- [x] Auto-selection of dropped task works - ✅ Works

---

## Reference: Current DnD File Locations

```
src/components/tasks/
├── task-dnd-context.tsx     # Cross-project DnD context (SIMPLIFIED)
├── task-list.tsx            # Task list with keyboard nav
├── task-item.tsx            # Presentational component (NEW)
├── sortable-task-item.tsx   # Sortable wrapper (NEW)
├── task-list-item.tsx       # Backward compatibility wrapper
├── ordered-item-list.tsx    # Mixed tasks + headings list
├── section-task-group.tsx   # Collapsible section wrapper
├── project-task-group.tsx   # Project section wrapper

src/components/kanban/
├── kanban-dnd-context.tsx   # Status-based DnD (REFERENCE - pattern we followed)
├── kanban-column.tsx        # Column with SortableKanbanCard (REFERENCE)
```

---

# NEXT STEPS: Cross-Container "Making Room" Animation

The remaining issue is that during cross-container drag, items in the target container don't shift to "make room" for the dragged item. This works within containers (SortableContext handles it), but not across containers.

## The Problem

When dragging from Project1 to Project2:
1. Project1's items shift naturally (within-container, handled by SortableContext)
2. Project2's items do NOT shift to show where the drop will occur
3. Drop works correctly, but there's no visual preview of insertion position

## Why It's Hard

The fundamental challenge: each TaskList only has data for ITS tasks. To show an item "making room" in Project2, we need Project2's SortableContext to know about the incoming item. But:

1. **Can't add foreign drag IDs to SortableContext** - No DOM element to render, breaks transforms
2. **Collision detection is global** - Can return wrong container's items
3. **State sync issues** - Visual state diverges from collision detection results

## Possible Approaches to Investigate

### Approach 1: CSS-Only Gap Animation

Instead of updating SortableContext items, use CSS to create a visual gap:

1. Track `overContainerId` in drag preview state (via `handleDragOver`)
2. When dragging over a container that's not the source:
   - Add a CSS class to that container
   - Use CSS to create a gap at the hover position (pseudo-element or margin)
3. The gap is purely visual - SortableContext items stay unchanged

**Pros:** No SortableContext manipulation, simpler
**Cons:** Gap won't animate items naturally, needs custom position tracking

### Approach 2: Placeholder Element

Add a placeholder element to the target container:

1. When `handleDragOver` detects cross-container hover, add a placeholder task to the target's task data
2. The placeholder renders as an empty space with the same height
3. On drop, replace placeholder with actual task
4. On cancel/leave, remove placeholder

**Pros:** Uses natural SortableContext behavior
**Cons:** Requires modifying task data during drag, complex state management

### Approach 3: Portal + Transform Override

Keep the dragged item in its original container's DOM, but use portals/transforms:

1. Don't update SortableContext items
2. Use `handleDragOver` to track exact drop position in target
3. Apply CSS transforms to target container's items to create visual gap
4. The transforms are independent of SortableContext

**Pros:** Doesn't break SortableContext
**Cons:** Complex transform calculations, might conflict with dnd-kit's transforms

### Approach 4: Top-Level Item Ownership

Change architecture so items aren't "owned" by individual TaskLists:

1. TaskDndContext maintains ALL items for ALL containers
2. Each TaskList receives items from context, not from props
3. When dragging, context updates which container "has" each item
4. All TaskLists re-render with new items

**Pros:** Clean ownership model, natural SortableContext behavior
**Cons:** Major architectural change, performance implications

### Approach 5: Accept Kanban-Style UX

The Kanban doesn't show "making room" in target columns during drag, and users said it feels smooth. Maybe task lists don't need it either:

1. Keep current implementation
2. Add container highlighting when hovering (border/background change)
3. Accept that cross-container drops don't preview exact position

**Pros:** Already working, simple
**Cons:** Different UX than within-container drag

## Recommended Investigation Order

1. **Start with Approach 5** - Add container highlighting, see if that's "good enough"
2. **Try Approach 1** - CSS gap is simplest real solution
3. **Consider Approach 2** - Placeholder might work with careful implementation
4. **Approach 4 as last resort** - Major refactor, only if others fail

## Key Questions to Answer

1. Does the Kanban feel good WITHOUT cross-column item shifting? (User said yes)
2. Is container highlighting sufficient visual feedback?
3. If we need item shifting, can we do it with CSS transforms alone?
4. Is the placeholder approach viable without breaking selection/editing?

## Files to Modify for Next Phase

- `task-dnd-context.tsx` - Add `handleDragOver` back for tracking hover position
- `project-task-group.tsx` - Add container highlight styles
- `section-task-group.tsx` - Add container highlight styles
- Possibly: `task-list.tsx` - For CSS gap or placeholder approaches
