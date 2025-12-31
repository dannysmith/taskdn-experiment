import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/data'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Status configuration with labels and colors
export const statusConfig: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  inbox: { label: 'Inbox', color: 'bg-status-inbox/15 text-status-inbox' },
  icebox: { label: 'Icebox', color: 'bg-status-icebox/15 text-status-icebox' },
  ready: { label: 'Ready', color: 'bg-status-ready/15 text-status-ready' },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-status-in-progress/15 text-status-in-progress',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-status-blocked/15 text-status-blocked',
  },
  dropped: {
    label: 'Dropped',
    color: 'bg-status-dropped/15 text-status-dropped',
  },
  done: { label: 'Done', color: 'bg-status-done/15 text-status-done' },
}

const allStatuses: TaskStatus[] = [
  'inbox',
  'ready',
  'in-progress',
  'blocked',
  'done',
  'icebox',
  'dropped',
]

export interface TaskStatusPillProps {
  status: TaskStatus
  onStatusChange?: (newStatus: TaskStatus) => void
  className?: string
}

export function TaskStatusPill({
  status,
  onStatusChange,
  className,
}: TaskStatusPillProps) {
  const config = statusConfig[status]

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
          'px-2 py-0.5 rounded-full text-xs font-medium shrink-0 inline-flex items-center gap-1 transition-opacity hover:opacity-80',
          config.color,
          className
        )}
      >
        {config.label}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allStatuses.slice(0, 5).map((s) => (
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
                statusConfig[s].color
              )}
            >
              {statusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {allStatuses.slice(5).map((s) => (
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
                statusConfig[s].color
              )}
            >
              {statusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
