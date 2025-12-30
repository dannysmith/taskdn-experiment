# Cross-Project Task Drag & Drop Implementation Plan

## Overview

Enable tasks to be dragged from one project to another within the Area view. When dropped, the task's `projectId` is updated to the target project.

## Current State

- `TaskList` component has its own `DndContext` for within-list reordering
- `ProjectTaskGroup` wraps a `ProjectHeader` + collapsible `TaskList`
- `AreaView` renders multiple `ProjectTaskGroup` components
- Each `TaskList` is isolated - cannot detect drops from other lists

## Architecture

### The Problem

Currently each `TaskList` has its own `DndContext`:

```
AreaView
├── ProjectTaskGroup (Project A)
│   └── TaskList
│       └── DndContext  ← isolated
├── ProjectTaskGroup (Project B)
│   └── TaskList
│       └── DndContext  ← isolated
```

For cross-project drag, we need a shared context:

```
AreaView
└── DndContext  ← shared across all projects
    ├── ProjectTaskGroup (Project A)
    │   └── SortableContext  ← container A
    └── ProjectTaskGroup (Project B)
        └── SortableContext  ← container B
```

### Key Changes

1. **Lift DndContext to AreaView** - Single context spanning all project task lists
2. **TaskList becomes "dumb"** - Just renders items within a SortableContext, no DndContext
3. **AreaView handles cross-container logic** - Detects when task moves between projects
4. **New mutation** - `moveTaskToProject(taskId, newProjectId)`

## Data Flow

### Same-Project Reorder
```
User drags task within Project A
  → onDragEnd detects same containerId
  → reorderProjectTasks(projectId, newTaskIds)
  → Order updated in AppData
```

### Cross-Project Move
```
User drags task from Project A to Project B
  → onDragOver detects different containerId
  → Preview shows task in new position (optimistic)
  → onDragEnd confirms the move
  → moveTaskToProject(taskId, newProjectId)
  → Task's projectId updated in AppData
```

## Implementation Steps

### Step 1: Add `moveTaskToProject` to AppDataContext

```typescript
// src/context/app-data-context.tsx

moveTaskToProject: (taskId: string, newProjectId: string) => {
  setData(prev => ({
    ...prev,
    tasks: prev.tasks.map(t =>
      t.id === taskId ? { ...t, projectId: newProjectId } : t
    )
  }))
}
```

### Step 2: Create a Shared TaskDndContext Component

New component that wraps multiple project task groups:

```typescript
// src/components/tasks/task-dnd-context.tsx

interface TaskDndContextProps {
  children: React.ReactNode
  onTaskMove: (taskId: string, fromProjectId: string, toProjectId: string, insertIndex: number) => void
  onTasksReorder: (projectId: string, reorderedTaskIds: string[]) => void
}

export function TaskDndContext({ children, onTaskMove, onTasksReorder }: TaskDndContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Track which container a task came from
  const [dragState, setDragState] = useState<{
    taskId: string
    sourceProjectId: string
  } | null>(null)

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as TaskDragData
    setDragState({
      taskId: data.taskId,
      sourceProjectId: data.projectId,
    })
  }

  function handleDragOver(event: DragOverEvent) {
    // Detect cross-container hover for visual feedback
    // (optional: could update state to show insertion point)
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!dragState) return

    const { active, over } = event
    if (!over) {
      setDragState(null)
      return
    }

    const overData = over.data.current as TaskDragData | ContainerData
    const targetProjectId = overData.projectId

    if (targetProjectId !== dragState.sourceProjectId) {
      // Cross-project move
      const insertIndex = /* calculate from over position */
      onTaskMove(dragState.taskId, dragState.sourceProjectId, targetProjectId, insertIndex)
    } else {
      // Same-project reorder
      // Calculate new order and call onTasksReorder
    }

    setDragState(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {/* Task preview */}
      </DragOverlay>
    </DndContext>
  )
}
```

### Step 3: Modify TaskList to Accept External DndContext

The `TaskList` needs two modes:
1. **Standalone** - Has its own DndContext (for use in ProjectView)
2. **Nested** - Just renders SortableContext, expects parent DndContext (for AreaView)

Option A: Add a `disableDnd` prop that renders items without drag
Option B: Add a `externalDnd` prop that skips DndContext wrapper
Option C: Split into `TaskList` (just items) and `DraggableTaskList` (with DndContext)

**Recommended: Option C** - Clearest separation of concerns

```typescript
// Base list - just renders task items
export function TaskList({ tasks, ... }: TaskListProps) {
  return (
    <div className="space-y-0.5">
      {tasks.map((task, index) => (
        <TaskListItem key={task.id} task={task} ... />
      ))}
    </div>
  )
}

// Wrapper with DndContext for standalone use
export function DraggableTaskList({ tasks, ... }: TaskListProps) {
  return (
    <DndContext ...>
      <SortableContext items={...}>
        <TaskList tasks={tasks} ... />
      </SortableContext>
      <DragOverlay />
    </DndContext>
  )
}
```

### Step 4: Create DroppableTaskContainer

Wrapper for each project's task list that:
- Provides the SortableContext with project-specific items
- Marks the container with projectId for collision detection
- Handles empty project drop zones

```typescript
// src/components/tasks/droppable-task-container.tsx

interface DroppableTaskContainerProps {
  projectId: string
  tasks: Task[]
  children: React.ReactNode
}

export function DroppableTaskContainer({ projectId, tasks, children }: DroppableTaskContainerProps) {
  const { setNodeRef } = useDroppable({
    id: `project-container-${projectId}`,
    data: { type: 'project-container', projectId }
  })

  const dragIds = tasks.map(t => `task-${projectId}-${t.id}`)

  return (
    <div ref={setNodeRef}>
      <SortableContext items={dragIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      {tasks.length === 0 && (
        <EmptyDropZone />
      )}
    </div>
  )
}
```

### Step 5: Update TaskListItem Drag Data

Include projectId in the drag data so cross-container logic knows the source:

```typescript
const { ... } = useSortable({
  id: dragId,
  data: {
    type: "task",
    taskId: task.id,
    projectId: projectId,  // NEW: needed for cross-project detection
  },
})
```

### Step 6: Update AreaView

```typescript
export function AreaView({ areaId, onNavigateToProject }: AreaViewProps) {
  const { moveTaskToProject, reorderProjectTasks, ... } = useAppData()

  const handleTaskMove = (taskId: string, fromProjectId: string, toProjectId: string) => {
    moveTaskToProject(taskId, toProjectId)
  }

  return (
    <TaskDndContext
      onTaskMove={handleTaskMove}
      onTasksReorder={reorderProjectTasks}
    >
      {projects.map(project => (
        <ProjectTaskGroup
          key={project.id}
          project={project}
          tasks={getTasksByProjectId(project.id)}
          // ... other props
        />
      ))}
    </TaskDndContext>
  )
}
```

### Step 7: Update ProjectTaskGroup

Pass through the projectId to TaskListItem for drag data:

```typescript
<TaskList
  tasks={tasks}
  projectId={project.id}  // NEW: pass to children for drag data
  ...
/>
```

### Step 8: Handle Insert Position

When dropping a task into a new project, we need to calculate where in the list it should go:

```typescript
function getInsertIndex(overData: DragData, tasks: Task[]): number {
  if (overData.type === 'project-container') {
    // Dropped on empty area or container itself - add to end
    return tasks.length
  }

  if (overData.type === 'task') {
    // Dropped on another task - insert at that position
    return tasks.findIndex(t => t.id === overData.taskId)
  }

  return tasks.length
}
```

## Drag ID Strategy

To avoid collisions when the same task ID might appear in different contexts:

```
// Pattern: task-{projectId}-{taskId}
`task-${projectId}-${task.id}`
```

This ensures unique IDs across all projects in the DndContext.

## Visual Feedback

### During Drag
- Source task shows `opacity-50`
- Valid drop zones highlight with subtle border
- Insert position shown with horizontal line

### On Hover Over Different Project
- Project header could subtly highlight
- If project is collapsed, expand it (or show tooltip)

### Drop Animation
- Task slides into new position
- Smooth transition for reorder

## Edge Cases

1. **Collapsed Projects**: When dragging over a collapsed project header, either:
   - Auto-expand on hover (after brief delay)
   - Show drop indicator on header itself
   - Insert at end of project's task list

2. **Empty Projects**: Must have droppable zone even with no tasks
   - Use `useDroppable` on container div
   - Show "Drop here" placeholder when dragging

3. **Drag Outside All Projects**: Cancel the drag, return to original position

4. **Same Position Drop**: No-op, don't trigger mutation

5. **Keyboard Reorder**: Keep working within single project
   - Cross-project move via keyboard is out of scope

## File Changes

```
Modified:
├── src/context/app-data-context.tsx    # Add moveTaskToProject
├── src/components/tasks/task-list.tsx  # Split into TaskList + DraggableTaskList
├── src/components/tasks/task-list-item.tsx  # Add projectId to drag data
├── src/components/views/area-view.tsx  # Wrap with TaskDndContext

New:
├── src/components/tasks/task-dnd-context.tsx     # Shared DndContext
├── src/components/tasks/droppable-task-container.tsx  # Per-project SortableContext
```

## Testing Checklist

- [ ] Reorder tasks within same project (existing functionality)
- [ ] Drag task from Project A to Project B
- [ ] Task's projectId updates after cross-project drop
- [ ] Drop into empty project works
- [ ] Drop indicator shows correct insert position
- [ ] Cancelled drag returns task to original project
- [ ] Keyboard reorder still works within single project
- [ ] Click to select still works (not intercepted by drag)
- [ ] In-place editing still works
- [ ] ProjectView (single project) drag still works
- [ ] Performance acceptable with multiple projects

## Out of Scope

- Dragging tasks between areas (would need different UI)
- Keyboard-based cross-project move
- Undo/redo for moves
- Dragging multiple tasks at once
