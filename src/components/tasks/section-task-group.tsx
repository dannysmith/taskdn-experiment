import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'

import { cn } from '@/lib/utils'
import type { Task } from '@/types/data'
import { SectionHeader } from './section-header'
import { DraggableTaskList, TaskList } from './task-list'
import { useTaskDragPreview } from './task-dnd-context'

interface SectionTaskGroupProps {
  /** Unique identifier for this section (used for drag IDs) */
  sectionId: string
  /** Display title for the section header */
  title: string
  /** Optional icon to display in the header */
  icon?: React.ReactNode
  tasks: Task[]
  onTasksReorder: (reorderedTasks: Task[]) => void
  onTaskTitleChange: (taskId: string, newTitle: string) => void
  onTaskStatusToggle: (taskId: string) => void
  /** Called when a task's open-detail button is clicked */
  onTaskOpenDetail?: (taskId: string) => void
  /** Called when Cmd/Ctrl+N is pressed to create a task */
  onCreateTask?: (afterTaskId: string | null) => string | void
  /** Function to get context name for a task (project/area name) */
  getContextName?: (task: Task) => string | undefined
  /** Whether to show scheduled dates (default: true) */
  showScheduled?: boolean
  /** Whether to show due dates (default: true) */
  showDue?: boolean
  /** Initial expanded state (default: true) */
  defaultExpanded?: boolean
  /**
   * When true, uses TaskList instead of DraggableTaskList.
   * Use this when a parent TaskDndContext handles cross-section dragging.
   */
  useExternalDnd?: boolean
  className?: string
}

/**
 * A section header with a collapsible list of tasks underneath.
 * Used for grouping tasks by criteria (e.g., "Scheduled Today", "Overdue").
 */
export function SectionTaskGroup({
  sectionId,
  title,
  icon,
  tasks,
  onTasksReorder,
  onTaskTitleChange,
  onTaskStatusToggle,
  onTaskOpenDetail,
  onCreateTask,
  getContextName,
  showScheduled = true,
  showDue = true,
  defaultExpanded = true,
  useExternalDnd = false,
  className,
}: SectionTaskGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  // Choose the appropriate list component based on DnD context
  const ListComponent = useExternalDnd ? TaskList : DraggableTaskList

  return (
    <div className={cn('', className)}>
      <SectionHeader
        title={title}
        icon={icon}
        taskCount={tasks.length}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {/* Collapsible task list */}
      {isExpanded && (
        <div className="pl-6 pt-1">
          {tasks.length > 0 ? (
            <ListComponent
              tasks={tasks}
              projectId={sectionId}
              onTasksReorder={onTasksReorder}
              onTaskTitleChange={onTaskTitleChange}
              onTaskStatusToggle={onTaskStatusToggle}
              onTaskOpenDetail={onTaskOpenDetail}
              onCreateTask={onCreateTask}
              getContextName={getContextName}
              showScheduled={showScheduled}
              showDue={showDue}
            />
          ) : useExternalDnd ? (
            <EmptySectionDropZone sectionId={sectionId} />
          ) : (
            <div className="text-sm text-muted-foreground py-2 px-2">
              No tasks
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A droppable zone for empty sections.
 * Shows visual feedback when a task is dragged over it.
 */
function EmptySectionDropZone({ sectionId }: { sectionId: string }) {
  const { dragPreview } = useTaskDragPreview()

  const { setNodeRef, isOver } = useDroppable({
    id: `empty-section-${sectionId}`,
    data: {
      type: 'empty-project',
      projectId: sectionId,
    },
  })

  // Check if we're dragging from a different section
  const isDraggingFromOtherSection =
    dragPreview && dragPreview.sourceProjectId !== sectionId

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'text-sm text-muted-foreground py-2 px-2 rounded-lg transition-colors',
        isOver && isDraggingFromOtherSection && 'bg-primary/10 text-primary'
      )}
    >
      {isOver && isDraggingFromOtherSection ? 'Drop here' : 'No tasks'}
    </div>
  )
}
