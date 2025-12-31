import * as React from 'react'
import { Calendar } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/date-utils'
import type { Project, ProjectStatus } from '@/types/data'
import { projectStatusConfig } from '@/config/status'
import { ProgressCircle } from '@/components/ui/progress-circle'

export interface ProjectCardProps {
  project: Project
  /** Completion percentage (0-100) */
  completion: number
  /** Total number of tasks */
  taskCount: number
  /** Number of completed tasks */
  completedTaskCount: number
  /** Area name if the project belongs to one */
  areaName?: string
  /** Click handler for the card */
  onClick?: () => void
  /** Click handler for the area name */
  onAreaClick?: () => void
  /** Whether the card is selected */
  isSelected?: boolean
  className?: string
}

/**
 * A card representation of a project.
 * Used in area views, dashboards, and project grids.
 */
export function ProjectCard({
  project,
  completion,
  taskCount,
  completedTaskCount,
  areaName,
  onClick,
  onAreaClick,
  isSelected,
  className,
}: ProjectCardProps) {
  const status = project.status ?? 'planning'
  const isDone = status === 'done'

  const handleAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAreaClick?.()
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-card rounded-xl border border-border/60 p-4 transition-all',
        'hover:border-border hover:shadow-sm',
        onClick && 'cursor-pointer',
        isSelected && 'ring-2 ring-primary border-primary',
        isDone && 'opacity-60',
        className
      )}
    >
      {/* Header: Title + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className={cn(
            'font-medium text-sm leading-snug',
            isDone && 'line-through text-muted-foreground'
          )}
        >
          {project.title}
        </h3>
        <ProjectStatusBadge status={status} />
      </div>

      {/* Description (if present) */}
      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      {/* Progress bar (visual representation) */}
      {taskCount > 0 && (
        <div className="mb-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-entity-project transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: Metadata */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Task count with progress circle */}
          <span className="flex items-center gap-1.5">
            <ProgressCircle value={completion} size={14} strokeWidth={2} />
            <span>
              {completedTaskCount}/{taskCount}
            </span>
          </span>

          {/* End date if set */}
          {project.endDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatRelativeDate(project.endDate)}
            </span>
          )}
        </div>

        {/* Area name - clickable */}
        {areaName && (
          <button
            type="button"
            onClick={handleAreaClick}
            className={cn(
              'truncate max-w-[100px] transition-colors',
              onAreaClick && 'hover:text-foreground hover:underline'
            )}
          >
            {areaName}
          </button>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Project Status Badge
// -----------------------------------------------------------------------------

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = projectStatusConfig[status]

  return (
    <span
      className={cn(
        'shrink-0 text-[10px] font-medium h-5 px-2 rounded-full inline-flex items-center',
        config.color
      )}
    >
      {config.label}
    </span>
  )
}
