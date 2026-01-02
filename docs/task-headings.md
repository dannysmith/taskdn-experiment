# Task: Headings in Task Lists

## Overview

Add the ability to insert visual "Headings" into task lists to help users organize tasks into logical groups. Starting with the "Scheduled for Today" section, headings let users chunk their day (e.g., "Morning", "Afternoon", "Evening") or organize by context (e.g., "Deep Work", "Calls", "Admin").

## Design Decisions

### Flat Items, Not Nested Containers

Headings are **visual dividers that live alongside tasks** in the ordered list, not containers that tasks belong to.

**Why flat:**
- Tasks already "belong" to projects/areas - headings are purely visual organization
- Simpler drag-and-drop: headings are just items that can be reordered
- Consistent mental model across Today, Inbox, and (future) Projects
- Ephemeral by nature - UI state, not domain data
- We can always add structural "sections" later if needed (a different feature)

### Heading Data Model

```typescript
interface Heading {
  id: string
  title: string
  color: HeadingColor
}

type HeadingColor =
  | 'gray'    // Default/neutral
  | 'blue'
  | 'teal'
  | 'purple'
  | 'amber'
  | 'pink'
  | 'green'
  | 'red'
```

### State Storage

Headings live alongside order state in `useTodayOrder` - same persistence as task ordering (currently React state, no localStorage). When persistence is added for ordering, headings come along for free.

```typescript
// Extended useTodayOrder state
interface TodayOrderState {
  sectionOrder: Record<TodaySectionId, string[]>  // Now contains both task IDs and heading:* IDs
  headings: Record<string, Heading>                // headingId -> Heading data
}
```

### Mixed-Type Order Arrays

The order array contains both task IDs and heading IDs, distinguished by prefix:

```
['abc', 'heading:morning', 'def', 'ghi', 'heading:afternoon', 'jkl']
```

- **Task IDs**: Plain strings (no prefix) - e.g., `'abc'`
- **Heading IDs**: Prefixed with `heading:` - e.g., `'heading:morning'`

This allows the sync logic to distinguish headings from tasks without changing the array structure.

---

## User Interface

### Visual Design

A heading renders as:
- A single-line text label (the title)
- A bottom border/underline
- Both text and underline take the heading's color
- Compact height - visually lighter than task items
- Subtle, not shouty - this is a divider, not a banner

### Section Header Actions

Add action buttons to `SectionHeader`:

**"+ Task" button:**
- Appears in section headers in Today view (all sections)
- Appears in project headers
- Appears in "Loose Tasks" headers (areas)
- Creates a new task at the end of that section/project

**"+ Heading" button:**
- Only appears in "Scheduled for Today" section header (for now)
- Creates a new heading at the end of the list
- Heading immediately enters edit mode (empty title, cursor focused)
- Default color is `gray`

Both buttons should be subtle (icon-only or small text), visible on hover or always visible depending on design preference.

### Editing a Heading

- Click the title to edit inline (same pattern as task titles)
- Or select with keyboard and press Enter

### Changing Color

- A small color dot/button next to the heading (visible on hover/selection)
- Clicking opens a popover with the 8 color options as dots
- Selecting a color immediately applies it and closes the popover

### Deleting a Heading

- A small "−" or trash button appears on hover or when selected
- Clicking deletes the heading immediately
- Keyboard: Delete/Backspace when heading is selected
- No confirmation needed (headings are ephemeral, easily recreated)

### Drag & Drop

Headings can be dragged to reorder them within the list, just like tasks:
- Headings appear in the same sortable list as tasks
- Dragging a heading moves only the heading, not "associated" tasks (no association exists)
- A heading can be dragged to any position

### Keyboard Navigation

Headings participate in selection alongside tasks:
- Arrow Up/Down moves selection through tasks AND headings
- When a heading is selected:
  - Enter: Edit title
  - Delete/Backspace: Delete heading
  - Cmd+Up/Down: Reorder heading
  - Task-specific actions (status toggle, open detail) do nothing

---

## Implementation Plan

### 1. Define Heading Types and Color Config

**Files:** `src/types/headings.ts`, `src/config/heading-colors.ts`, `src/index.css`

- Add `Heading`, `HeadingColor`, and helper types
- Create heading color config with CSS variable references (similar to status colors)
- Define CSS variables for each heading color in light/dark modes
- Add utility functions: `isHeadingId(id: string)`, `parseHeadingId(id: string)`

### 2. Create HeadingListItem Component

**File:** `src/components/headings/heading-list-item.tsx`

Build the visual component for rendering a heading in a list:

- Horizontal divider styling with colored bottom border
- Text label with inline editing (reuse pattern from TaskListItem)
- Color dot button that opens color picker
- Delete button (visible on hover/focus)
- Selected state styling (subtle highlight)
- Accepts `isSelected`, `onSelect` props for keyboard nav integration

### 3. Create HeadingColorPicker Component

**File:** `src/components/headings/heading-color-picker.tsx`

Build the color picker popover:

- 8 color dots in a row or small grid
- Uses Popover from shadcn/ui
- Click to select and close
- Current color indicated (checkmark or ring)

### 4. Extend useTodayOrder Hook

**File:** `src/hooks/use-today-order.ts`

**Critical change:** The current sync effect (lines 47-87) filters order to only IDs that match current tasks. This would strip out heading IDs. We need to:

1. Check if an ID is a heading (`id.startsWith('heading:')`) and preserve it
2. Only filter non-heading IDs against current tasks

Updated sync logic:
```typescript
// Keep headings (always preserved) and tasks that still exist
const preservedOrder = existingOrder.filter((id) =>
  isHeadingId(id) || currentTaskIds.has(id)
)
```

Additional changes:
- Add `headings: Record<string, Heading>` to state
- Add `createHeading(sectionId): string` - creates heading, appends to order, returns ID
- Add `updateHeading(headingId, updates: Partial<Heading>)` - updates title/color
- Add `deleteHeading(sectionId, headingId)` - removes from headings map and order array
- Add `getOrderedItems(sectionId): OrderedItem[]` - returns `{ type: 'task' | 'heading', item: Task | Heading }[]`
- Keep `getOrderedTasks(sectionId)` for backwards compat (filters to tasks only)

### 5. Create OrderedItemList Component

**File:** `src/components/tasks/ordered-item-list.tsx`

After reviewing the architecture, a **new component is cleaner** than extending TaskList:

- TaskList has significant task-specific logic (status toggle, detail panel, etc.)
- OrderedItemList composes TaskListItem and HeadingListItem
- Handles mixed-item keyboard navigation
- Dispatches to appropriate handlers based on item type

```typescript
interface OrderedItemListProps {
  items: OrderedItem[]  // From getOrderedItems()
  onItemsReorder: (reorderedItems: OrderedItem[]) => void
  // Task handlers
  onTaskTitleChange: (taskId: string, newTitle: string) => void
  onTaskStatusToggle: (taskId: string) => void
  onTaskOpenDetail?: (taskId: string) => void
  // Heading handlers
  onHeadingTitleChange: (headingId: string, newTitle: string) => void
  onHeadingColorChange: (headingId: string, color: HeadingColor) => void
  onHeadingDelete: (headingId: string) => void
  // ... other props
}
```

**Keyboard handling:**
- Arrow keys navigate both tasks and headings
- When task selected: existing task shortcuts work
- When heading selected: Enter edits, Delete removes, task shortcuts ignored

### 6. Update SectionHeader with Action Buttons

**File:** `src/components/tasks/section-header.tsx`

Add optional action buttons:

```typescript
interface SectionHeaderProps {
  // ... existing props
  onAddTask?: () => void       // Shows "+ Task" button if provided
  onAddHeading?: () => void    // Shows "+ Heading" button if provided
}
```

Buttons appear on the right side of the header, before the task count. Subtle styling (small icons or muted text).

### 7. Update SectionTaskGroup

**File:** `src/components/tasks/section-task-group.tsx`

Wire everything together:

- Accept heading-related callbacks
- Pass `onAddTask` and `onAddHeading` to SectionHeader
- Use OrderedItemList instead of TaskList when headings are enabled
- Handle the switchover: sections without heading support continue using TaskList

### 8. Integrate into Today View

**File:** `src/components/views/today-view.tsx`

- Use extended `useTodayOrder` with heading support
- Pass heading callbacks to the "Scheduled for Today" section
- Other sections get `onAddTask` but not `onAddHeading` (for now)

### 9. Update Drag & Drop for Mixed Items

**File:** `src/components/tasks/task-dnd-context.tsx` and related

Ensure dnd-kit handles both item types:

- Both tasks and headings wrapped in `useSortable`
- Drag preview adapts to item type
- `handleDragEnd` processes mixed order arrays correctly
- Cross-section drag of headings: probably should be disabled (headings are section-specific)

---

## Critical Implementation Notes

### Gotcha: Sync Effect Must Preserve Headings

The `useEffect` in `useTodayOrder` that syncs order with task changes will strip out heading IDs if not handled. The fix:

```typescript
// Before: strips unknown IDs
const preservedOrder = existingOrder.filter((id) => currentTaskIds.has(id))

// After: preserves headings, only validates task IDs
const preservedOrder = existingOrder.filter((id) =>
  isHeadingId(id) || currentTaskIds.has(id)
)
```

### Gotcha: Selection State When Heading Selected

When a heading is selected, task-specific keyboard shortcuts must be no-ops:
- Space (toggle status) - ignore
- Cmd+Enter (complete) - ignore
- Opening detail panel - ignore

The OrderedItemList needs to track what type of item is selected and dispatch accordingly.

### Gotcha: Drag Preview for Headings

The current drag preview is task-shaped. We need:
- A heading-shaped drag preview
- Or a generic preview that adapts to item type

---

## Future Work: Generalizing Headings

### Phase 1: Other Task List Views

Once headings work in Today's "Scheduled" section:

- **Other Today sections** (Overdue, Available) - enable the "+ Heading" button
- **Inbox view** - extend `useInboxOrder` with same heading support
- **Project view (list mode)** - headings for organizing project tasks

### Phase 2: Non-List Views

Headings in contexts where tasks aren't rendered as a list:

**Kanban columns:**
- Headings as horizontal dividers within a column
- Need to decide: can headings be dragged within columns?
- Probably needs a HeadingKanbanItem component

**Card grids:**
- Headings as full-width divider rows
- HeadingCardDivider component

**Calendar view:**
- Probably doesn't apply - calendar is temporal, not sequential

### Project Sections (Separate Future Feature)

If users need structural organization within projects (collapsing, task ownership, persistence), that's a different feature:

- **"Project Sections"** - part of the data model, tasks have `sectionId`
- Different from headings, which are ephemeral UI organization
- Would enable: collapsing sections, section-level status, section reordering
- More complex, but more powerful

This would be a separate feature, not an evolution of headings.

---

## Decisions Made

1. **"+ Heading" button location:** Section header, only in "Scheduled for Today" for now
2. **"+ Task" button:** Also in section headers (Today, Projects, Loose Tasks)
3. **Storage:** Same as ordering - React state for now, persistence comes later with ordering
4. **Default heading title:** Empty (user types immediately)
5. **ID format:** Headings prefixed with `heading:` to distinguish from task IDs in order arrays
