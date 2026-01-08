import { Folder, FolderOpen } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Area } from '@/types/data'

export interface AreaCardProps {
  area: Area
  /** Number of projects in this area */
  projectCount: number
  /** Number of active (non-done) projects */
  activeProjectCount: number
  onClick?: () => void
  /** Whether the card is selected */
  isSelected?: boolean
  className?: string
}

/**
 * A card representation of an area.
 * Used in dashboards and area overview grids.
 */
export function AreaCard({
  area,
  projectCount,
  activeProjectCount,
  onClick,
  isSelected,
  className,
}: AreaCardProps) {
  const isArchived = area.status === 'archived'

  return (
    <div
      onClick={onClick}
      className={cn(
        '@container group bg-card rounded-xl border border-border/60 p-3 @7xs:p-4 transition-all',
        'hover:border-border hover:shadow-sm',
        onClick && 'cursor-pointer',
        isSelected && 'ring-2 ring-primary border-primary',
        isArchived && 'opacity-50',
        className
      )}
    >
      {/* Header: Icon + Title + Type Badge */}
      <div className="flex items-start gap-2 @7xs:gap-3">
        {/* Folder icon */}
        <div
          className={cn(
            'shrink-0 size-6 @7xs:size-8 rounded-lg flex items-center justify-center',
            'bg-entity-area/10 text-entity-area'
          )}
        >
          {activeProjectCount > 0 ? (
            <FolderOpen className="size-3 @7xs:size-4" />
          ) : (
            <Folder className="size-3 @7xs:size-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 @7xs:gap-2 mb-1">
            <h3 className="font-medium text-xs @7xs:text-sm leading-snug truncate flex-1 min-w-0">
              {area.title}
            </h3>
            {area.type && <AreaTypeBadge type={area.type} />}
          </div>

          {/* Description (if present) */}
          {area.description && (
            <p className="text-2xs @7xs:text-xs text-muted-foreground line-clamp-2">
              {area.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Project count - stacks on narrow */}
      <div className="mt-2 @7xs:mt-3 pt-2 @7xs:pt-3 border-t border-border/40 flex flex-col @8xs:flex-row @8xs:items-center @8xs:justify-between gap-0.5 @8xs:gap-2 text-2xs @7xs:text-xs text-muted-foreground">
        <span>
          {activeProjectCount} active project
          {activeProjectCount !== 1 ? 's' : ''}
        </span>
        {projectCount !== activeProjectCount && (
          <span>{projectCount} total</span>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Area Type Badge
// -----------------------------------------------------------------------------

const typeColors: Record<string, string> = {
  'life-area': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  client: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  personal: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function AreaTypeBadge({ type }: { type: string }) {
  const colorClass = typeColors[type] ?? 'bg-muted text-muted-foreground'
  const displayType = type.replace(/-/g, ' ')

  return (
    <span
      className={cn(
        'shrink-0 text-[9px] @7xs:text-2xs font-medium px-1 @7xs:px-1.5 py-0.5 rounded capitalize',
        colorClass
      )}
    >
      {displayType}
    </span>
  )
}
