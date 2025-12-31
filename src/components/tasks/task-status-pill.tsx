import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/data'
import {
  taskStatusConfig,
  taskPrimaryStatuses,
  taskSecondaryStatuses,
} from '@/config/status'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

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
  const config = taskStatusConfig[status]

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
        {taskPrimaryStatuses.map((s) => (
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
                taskStatusConfig[s].color
              )}
            >
              {taskStatusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {taskSecondaryStatuses.map((s) => (
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
                taskStatusConfig[s].color
              )}
            >
              {taskStatusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
