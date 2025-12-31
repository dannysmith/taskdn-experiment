import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/data'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

/**
 * Status configuration following design conventions:
 * - planning: Blue
 * - ready: Grey
 * - in-progress: Amber
 * - paused: Light amber
 * - blocked: Dark red
 * - done: Green
 */
export const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; color: string }
> = {
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

// Primary statuses shown first, then secondary statuses after separator
const primaryStatuses: ProjectStatus[] = [
  'planning',
  'ready',
  'in-progress',
  'blocked',
]
const secondaryStatuses: ProjectStatus[] = ['paused', 'done']

export interface ProjectStatusPillProps {
  status: ProjectStatus
  onStatusChange?: (newStatus: ProjectStatus) => void
  className?: string
}

export function ProjectStatusPill({
  status,
  onStatusChange,
  className,
}: ProjectStatusPillProps) {
  const config = projectStatusConfig[status]

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!onStatusChange) {
    return (
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
          config.color,
          className
        )}
      >
        {config.label}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={handleClick}
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium shrink-0 inline-flex items-center gap-1 transition-opacity hover:opacity-80',
          config.color,
          className
        )}
      >
        {config.label}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {primaryStatuses.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(s)
            }}
            className={cn('cursor-pointer', s === status && 'bg-accent')}
          >
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs font-medium',
                projectStatusConfig[s].color
              )}
            >
              {projectStatusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {secondaryStatuses.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(s)
            }}
            className={cn('cursor-pointer', s === status && 'bg-accent')}
          >
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs font-medium',
                projectStatusConfig[s].color
              )}
            >
              {projectStatusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
