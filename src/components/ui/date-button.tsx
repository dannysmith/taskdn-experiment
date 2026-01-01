import * as React from 'react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type DateButtonVariant = 'scheduled' | 'due' | 'defer'

export interface DateButtonProps {
  /** Icon to display in the button */
  icon: React.ReactNode
  /** Current date value (ISO date string) */
  value: string | undefined
  /** Callback when date changes */
  onChange: (date: string | undefined) => void
  /** Tooltip/label shown when no date is set */
  tooltip: string
  /** Visual variant affecting colors */
  variant: DateButtonVariant
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const dateButtonStyles = {
  scheduled: {
    base: 'text-muted-foreground bg-muted/50 hover:bg-muted',
    active: 'text-muted-foreground bg-muted/80',
  },
  due: {
    base: 'text-destructive/70 bg-destructive/5 hover:bg-destructive/10',
    active: 'text-destructive bg-destructive/10',
  },
  defer: {
    base: 'text-status-icebox/70 bg-status-icebox/5 hover:bg-status-icebox/10',
    active: 'text-status-icebox bg-status-icebox/10',
  },
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function DateButton({
  icon,
  value,
  onChange,
  tooltip,
  variant,
}: DateButtonProps) {
  const [open, setOpen] = React.useState(false)
  const styles = dateButtonStyles[variant]

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
    } else {
      onChange(undefined)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 gap-1 px-2 text-xs font-normal border-0',
              value ? styles.active : styles.base
            )}
            title={tooltip}
          />
        }
      >
        {icon}
        <span>{value ? format(new Date(value), 'MMM d') : tooltip}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <CalendarComponent
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={handleSelect}
        />
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
