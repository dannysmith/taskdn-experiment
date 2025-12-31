import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  ProjectStatusIndicator,
  getProjectTitleClass,
} from '@/components/sidebar/draggable-project'
import type { Project, ProjectStatus } from '@/types/data'

interface ProjectHeaderProps {
  project: Project
  completion: number
  isExpanded: boolean
  onToggleExpand: () => void
  onOpenProject: () => void
}

/**
 * Status badge configuration following design conventions
 * - planning: Blue
 * - ready: Grey
 * - in-progress: Amber
 * - paused: Light amber
 * - blocked: Dark red
 * - done: Green
 */
const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  planning: {
    label: 'Planning',
    color: 'bg-status-planning/15 text-status-planning',
  },
  ready: { label: 'Ready', color: 'bg-status-ready/15 text-status-ready' },
  'in-progress': {
    label: 'Active',
    color: 'bg-status-in-progress/15 text-status-in-progress',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-status-blocked/15 text-status-blocked',
  },
  paused: { label: 'Paused', color: 'bg-status-paused/15 text-status-paused' },
  done: { label: 'Done', color: 'bg-status-done/15 text-status-done' },
}

/**
 * A section header for a project, showing status indicator, title, and status badge.
 * - Click to expand/collapse
 * - Double-click to open project view
 */
export function ProjectHeader({
  project,
  completion,
  isExpanded,
  onToggleExpand,
  onOpenProject,
}: ProjectHeaderProps) {
  const handleClick = () => {
    onToggleExpand()
  }

  const handleDoubleClick = () => {
    onOpenProject()
  }

  const status = project.status ?? 'planning'
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2 px-1 cursor-pointer select-none',
        'border-b border-border/60',
        'hover:bg-muted/30 transition-colors'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Expand/collapse chevron */}
      <ChevronRight
        className={cn(
          'size-4 text-muted-foreground shrink-0 transition-transform duration-200',
          isExpanded && 'rotate-90'
        )}
      />

      {/* Status indicator (progress circle or icon) */}
      <ProjectStatusIndicator status={project.status} completion={completion} />

      {/* Project title */}
      <span
        className={cn(
          'font-semibold text-sm truncate flex-1',
          getProjectTitleClass(project.status)
        )}
      >
        {project.title}
      </span>

      {/* Status badge */}
      <span
        className={cn(
          'shrink-0 text-[10px] font-medium h-5 px-2 rounded-full inline-flex items-center',
          config.color
        )}
      >
        {config.label}
      </span>
    </div>
  )
}
