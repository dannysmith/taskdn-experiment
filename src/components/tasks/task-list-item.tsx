import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Flag, CircleChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatRelativeDate, isOverdue } from '@/lib/date-utils'
import type { Task } from '@/types/data'
import { TaskStatusCheckbox } from './task-status-checkbox'
import { useTaskDragPreview, shouldShowDropIndicator } from './task-dnd-context'

export interface TaskListItemProps {
  task: Task
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onStartEdit: () => void
  onEndEdit: () => void
  onTitleChange: (newTitle: string) => void
  onStatusToggle: () => void
  /** Called when the open-detail chevron is clicked */
  onOpenDetail?: () => void
  /** Used for dnd-kit sortable */
  dragId: string
  /** Project ID for cross-container drag detection */
  projectId: string
  /** Optional context label (project or area name) shown on the right */
  contextName?: string
  /** Whether to show the scheduled date (default: true if exists) */
  showScheduled?: boolean
  /** Whether to show the due date (default: true if exists) */
  showDue?: boolean
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
  onOpenDetail,
  dragId,
  projectId,
  contextName,
  showScheduled = true,
  showDue = true,
}: TaskListItemProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [editValue, setEditValue] = React.useState(task.title)
  const { dragPreview } = useTaskDragPreview()

  // Check if we should show a drop indicator above this task
  const showDropIndicator = shouldShowDropIndicator(
    task.id,
    projectId,
    dragPreview
  )

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
      type: 'task',
      taskId: task.id,
      projectId: projectId,
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't select if clicking on the checkbox or input
    if ((e.target as HTMLElement).closest('button')) return
    if ((e.target as HTMLElement).closest('input')) return
    onSelect()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on the checkbox
    if ((e.target as HTMLElement).closest('button')) return
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

    if (e.key === 'Enter') {
      e.preventDefault()
      if (editValue.trim() !== task.title) {
        onTitleChange(editValue.trim())
      }
      onEndEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditValue(task.title) // Reset to original
      onEndEdit()
    }
  }

  const isDone = task.status === 'done'
  const isDropped = task.status === 'dropped'

  // Only apply drag listeners when NOT editing to prevent interference with input
  const dragProps = isEditing ? {} : { ...attributes, ...listeners }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 px-2 py-2 rounded-lg cursor-default transition-all',
        'select-none',
        // Editing: thin primary border, no background
        isEditing && 'ring-2 ring-primary bg-transparent',
        // Selected but not editing: blue background
        isSelected &&
          !isEditing &&
          !isDragging &&
          'bg-primary/20 dark:bg-primary/30',
        // Not selected: subtle hover
        !isSelected && !isEditing && 'hover:bg-muted/50',
        // Dragging state
        isDragging && 'opacity-50 shadow-lg bg-card z-50 ring-1 ring-border'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-selected={isSelected}
      data-editing={isEditing}
      data-task-id={task.id}
      {...dragProps}
    >
      {/* Drop indicator line for cross-project drag */}
      {showDropIndicator && (
        <div className="h-0.5 bg-primary rounded-full mx-2 mb-1 absolute -top-1 left-0 right-0" />
      )}
      {/* Status checkbox */}
      <TaskStatusCheckbox status={task.status} onToggle={onStatusToggle} />

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
        <>
          {/* Title + chevron grouped together */}
          <span
            className={cn(
              'text-sm truncate',
              (isDone || isDropped) && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>

          {/* Open detail button - immediately after title */}
          {onOpenDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetail()
              }}
              className={cn(
                'shrink-0 p-1.5 -m-1 rounded-full text-primary/70',
                'hover:text-primary hover:bg-primary/10',
                'transition-opacity duration-100',
                // Show on hover (with delay) or when selected
                isSelected
                  ? 'opacity-100 delay-150'
                  : 'opacity-0 group-hover:opacity-100 group-hover:delay-150'
              )}
              title="Open details"
            >
              <CircleChevronRight className="size-4" />
            </button>
          )}

          {/* Spacer pushes metadata to the right */}
          <div className="flex-1 min-w-2" />

          {/* Right-aligned metadata */}
          <TaskMetadata
            contextName={contextName}
            scheduled={showScheduled ? task.scheduled : undefined}
            due={showDue ? task.due : undefined}
            isDone={isDone || isDropped}
          />
        </>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Task Metadata (right-aligned info)
// -----------------------------------------------------------------------------

interface TaskMetadataProps {
  contextName?: string
  scheduled?: string
  due?: string
  isDone: boolean
}

function TaskMetadata({
  contextName,
  scheduled,
  due,
  isDone,
}: TaskMetadataProps) {
  // Don't render anything if no metadata
  if (!contextName && !scheduled && !due) return null

  // Mute everything if task is done
  const mutedClass = isDone ? 'opacity-50' : ''

  return (
    <div className={cn('flex items-center gap-2 text-xs shrink-0', mutedClass)}>
      {/* Context (project/area name) */}
      {contextName && (
        <span className="text-muted-foreground truncate max-w-[120px]">
          {contextName}
        </span>
      )}

      {/* Scheduled date */}
      {scheduled && (
        <span className="text-muted-foreground">
          {formatRelativeDate(scheduled)}
        </span>
      )}

      {/* Due date with flag */}
      {due && (
        <span
          className={cn(
            'flex items-center gap-1',
            isOverdue(due) && !isDone
              ? 'text-red-500 dark:text-red-400'
              : 'text-red-400/80 dark:text-red-400/70'
          )}
        >
          <Flag className="size-3" />
          {formatRelativeDate(due)}
        </span>
      )}
    </div>
  )
}
