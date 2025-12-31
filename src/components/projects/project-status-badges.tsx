import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/data'

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

// Display order for status badges
const statusOrder: ProjectStatus[] = [
  'blocked',
  'in-progress',
  'ready',
  'planning',
  'paused',
  'done',
]

interface ProjectStatusBadgesProps {
  counts: Record<string, number>
  className?: string
}

/**
 * Displays compact badges showing project counts by status.
 * Used in the header bar when viewing an area.
 */
export function ProjectStatusBadges({
  counts,
  className,
}: ProjectStatusBadgesProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {statusOrder.map((status) => {
        const count = counts[status]
        if (!count) return null
        const config = statusConfig[status]
        return (
          <span
            key={status}
            className={cn(
              'text-[10px] font-medium h-5 px-1.5 rounded-full inline-flex items-center gap-1',
              config.color
            )}
          >
            <span>{count}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </span>
        )
      })}
    </div>
  )
}
