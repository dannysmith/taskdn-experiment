import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import type { Task } from "@/types/data"
import { TaskStatusCheckbox } from "./task-status-checkbox"

export interface TaskListItemProps {
  task: Task
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onStartEdit: () => void
  onEndEdit: () => void
  onTitleChange: (newTitle: string) => void
  onStatusToggle: () => void
  /** Used for dnd-kit sortable */
  dragId: string
}

export function TaskListItem({
  task,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onEndEdit,
  onTitleChange,
  onStatusToggle,
  dragId,
}: TaskListItemProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [editValue, setEditValue] = React.useState(task.title)

  // Sync editValue with task.title when task changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(task.title)
    }
  }, [task.title, isEditing])

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Sortable setup - whole item is draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    data: {
      type: "task",
      id: task.id,
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't select if clicking on the checkbox or input
    if ((e.target as HTMLElement).closest("button")) return
    if ((e.target as HTMLElement).closest("input")) return
    onSelect()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on the checkbox
    if ((e.target as HTMLElement).closest("button")) return
    onStartEdit()
  }

  const handleInputBlur = () => {
    if (editValue.trim() !== task.title) {
      onTitleChange(editValue.trim())
    }
    onEndEdit()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation for ALL keys to prevent parent handlers from interfering
    e.stopPropagation()

    if (e.key === "Enter") {
      e.preventDefault()
      if (editValue.trim() !== task.title) {
        onTitleChange(editValue.trim())
      }
      onEndEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setEditValue(task.title) // Reset to original
      onEndEdit()
    }
  }

  const isDone = task.status === "done"
  const isDropped = task.status === "dropped"

  // Only apply drag listeners when NOT editing to prevent interference with input
  const dragProps = isEditing ? {} : { ...attributes, ...listeners }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-2 py-2 rounded-lg cursor-default transition-all",
        "select-none",
        // Editing: thin blue border, no background
        isEditing && "ring-2 ring-[oklch(0.55_0.2_250)] bg-transparent",
        // Selected but not editing: blue background
        isSelected && !isEditing && !isDragging && "bg-primary/20 dark:bg-primary/30",
        // Not selected: subtle hover
        !isSelected && !isEditing && "hover:bg-muted/50",
        // Dragging state
        isDragging && "opacity-50 shadow-lg bg-card z-50 ring-1 ring-border"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-selected={isSelected}
      data-editing={isEditing}
      data-task-id={task.id}
      {...dragProps}
    >
      {/* Status checkbox */}
      <TaskStatusCheckbox
        status={task.status}
        onToggle={onStatusToggle}
      />

      {/* Title - editable or display */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          placeholder="Task title..."
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-sm truncate",
            (isDone || isDropped) && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>
      )}
    </div>
  )
}
