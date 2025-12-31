import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/data'
import { projectStatusConfig } from '@/config/status'

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
        const config = projectStatusConfig[status]
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
