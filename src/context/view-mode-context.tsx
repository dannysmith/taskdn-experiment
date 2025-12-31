import * as React from 'react'
import type { ViewMode } from '@/components/ui/view-toggle'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Keys for storing view mode by view type */
type ViewModeKey = 'this-week' | 'project' | 'area'

interface ViewModeContextValue {
  /** Get the current view mode for a specific view */
  getViewMode: (key: ViewModeKey) => ViewMode
  /** Set the view mode for a specific view */
  setViewMode: (key: ViewModeKey, mode: ViewMode) => void
  /** Get which view modes are available for a specific view */
  getAvailableModes: (key: ViewModeKey) => ViewMode[]
}

const ViewModeContext = React.createContext<ViewModeContextValue | null>(null)

// -----------------------------------------------------------------------------
// Default modes per view type
// -----------------------------------------------------------------------------

const defaultModes: Record<ViewModeKey, ViewMode> = {
  'this-week': 'calendar',
  project: 'list',
  area: 'list',
}

const availableModes: Record<ViewModeKey, ViewMode[]> = {
  'this-week': ['calendar', 'kanban'],
  project: ['list', 'kanban'],
  area: ['list', 'kanban'],
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [modes, setModes] =
    React.useState<Record<ViewModeKey, ViewMode>>(defaultModes)

  const getViewMode = React.useCallback(
    (key: ViewModeKey): ViewMode => {
      return modes[key] ?? defaultModes[key]
    },
    [modes]
  )

  const setViewMode = React.useCallback((key: ViewModeKey, mode: ViewMode) => {
    setModes((prev) => ({ ...prev, [key]: mode }))
  }, [])

  const getAvailableModes = React.useCallback(
    (key: ViewModeKey): ViewMode[] => {
      return availableModes[key]
    },
    []
  )

  const value: ViewModeContextValue = {
    getViewMode,
    setViewMode,
    getAvailableModes,
  }

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useViewMode(key: ViewModeKey) {
  const context = React.useContext(ViewModeContext)
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }

  const viewMode = context.getViewMode(key)
  const setViewMode = React.useCallback(
    (mode: ViewMode) => context.setViewMode(key, mode),
    [context, key]
  )
  const availableModes = context.getAvailableModes(key)

  return { viewMode, setViewMode, availableModes }
}

export type { ViewModeKey }
