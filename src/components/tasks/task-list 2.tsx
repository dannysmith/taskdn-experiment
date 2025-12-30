import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DropAnimation,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"
import type { Task } from "@/types/data"
import { TaskListItem } from "./task-list-item"
import { TaskStatusCheckbox } from "./task-status-checkbox"

interface TaskListProps {
  tasks: Task[]
  onTasksReorder: (reorderedTasks: Task[]) => void
  onTaskTitleChange: (taskId: string, newTitle: string) => void
  onTaskStatusToggle: (taskId: string) => void
  className?: string
}

/**
 * A keyboard-navigable, drag-and-drop enabled task list.
 *
 * Keyboard shortcuts:
 * - Arrow Up/Down: Move selection
 * - Enter: Start editing selected task title
 * - Escape: Cancel editing, or deselect
 * - Cmd/Ctrl + Arrow Up/Down: Reorder selected task
 * - Space: Toggle task status (done/ready)
 */
export function TaskList({
  tasks,
  onTasksReorder,
  onTaskTitleChange,
  onTaskStatusToggle,
  className,
}: TaskListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null)

  // Sensors for drag and drop - only PointerSensor
  // We handle keyboard reordering ourselves with Cmd+Up/Down
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Drop animation
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  }

  // Keep selection valid when tasks change
  React.useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= tasks.length) {
      setSelectedIndex(tasks.length > 0 ? tasks.length - 1 : null)
    }
  }, [tasks.length, selectedIndex])

  // Focus container when selection changes (for keyboard events)
  React.useEffect(() => {
    if (selectedIndex !== null && !editingTaskId && containerRef.current) {
      containerRef.current.focus()
    }
  }, [selectedIndex, editingTaskId])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle keyboard events while editing
    if (editingTaskId) return

    const isMeta = e.metaKey || e.ctrlKey

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (isMeta && selectedIndex !== null) {
          // Reorder: move task down
          if (selectedIndex < tasks.length - 1) {
            const newTasks = arrayMove(tasks, selectedIndex, selectedIndex + 1)
            onTasksReorder(newTasks)
            setSelectedIndex(selectedIndex + 1)
          }
        } else {
          // Navigate down
          if (selectedIndex === null) {
            setSelectedIndex(0)
          } else if (selectedIndex < tasks.length - 1) {
            setSelectedIndex(selectedIndex + 1)
          }
        }
        break

      case "ArrowUp":
        e.preventDefault()
        if (isMeta && selectedIndex !== null) {
          // Reorder: move task up
          if (selectedIndex > 0) {
            const newTasks = arrayMove(tasks, selectedIndex, selectedIndex - 1)
            onTasksReorder(newTasks)
            setSelectedIndex(selectedIndex - 1)
          }
        } else {
          // Navigate up
          if (selectedIndex === null) {
            setSelectedIndex(tasks.length - 1)
          } else if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1)
          }
        }
        break

      case "Enter":
        e.preventDefault()
        if (selectedIndex !== null && tasks[selectedIndex]) {
          setEditingTaskId(tasks[selectedIndex].id)
        }
        break

      case "Escape":
        e.preventDefault()
        if (selectedIndex !== null) {
          setSelectedIndex(null)
        }
        break

      case " ":
        e.preventDefault()
        if (selectedIndex !== null && tasks[selectedIndex]) {
          onTaskStatusToggle(tasks[selectedIndex].id)
        }
        break
    }
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.data.current?.id as string | undefined
    if (taskId) {
      setActiveTaskId(taskId)
      // Update selection to match dragged item
      const index = tasks.findIndex((t) => t.id === taskId)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current as { id: string } | undefined
    const overData = over.data.current as { id: string } | undefined

    if (!activeData || !overData) return

    const oldIndex = tasks.findIndex((t) => t.id === activeData.id)
    const newIndex = tasks.findIndex((t) => t.id === overData.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      onTasksReorder(newTasks)
      setSelectedIndex(newIndex)
    }
  }

  // Selection handlers
  const handleSelect = (index: number) => {
    setSelectedIndex(index)
    setEditingTaskId(null)
  }

  const handleStartEdit = (taskId: string) => {
    setEditingTaskId(taskId)
  }

  const handleEndEdit = () => {
    setEditingTaskId(null)
    // Re-focus container for keyboard navigation
    containerRef.current?.focus()
  }

  // Generate drag IDs
  const dragIds = tasks.map((t) => `task-${t.id}`)

  // Find active task for drag overlay
  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  if (tasks.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground text-sm", className)}>
        No tasks yet
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("outline-none", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={dragIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {tasks.map((task, index) => (
              <TaskListItem
                key={task.id}
                task={task}
                dragId={`task-${task.id}`}
                isSelected={selectedIndex === index}
                isEditing={editingTaskId === task.id}
                onSelect={() => handleSelect(index)}
                onStartEdit={() => handleStartEdit(task.id)}
                onEndEdit={handleEndEdit}
                onTitleChange={(newTitle) => onTaskTitleChange(task.id, newTitle)}
                onStatusToggle={() => onTaskStatusToggle(task.id)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask && <TaskDragPreview task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Drag Preview
// -----------------------------------------------------------------------------

function TaskDragPreview({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-card shadow-xl border border-border/50">
      <TaskStatusCheckbox
        status={task.status}
        onToggle={() => {}}
      />
      <span
        className={cn(
          "flex-1 text-sm truncate",
          (task.status === "done" || task.status === "dropped") && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </span>
    </div>
  )
}
