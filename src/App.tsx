import { useState, useMemo } from 'react'
import { AppSidebar } from '@/components/sidebar/left-sidebar'
import { MainContent } from '@/components/main-content'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppDataProvider, useAppData } from '@/context/app-data-context'
import {
  TaskDetailProvider,
  useTaskDetail,
} from '@/context/task-detail-context'
import {
  ViewModeProvider,
  useViewMode,
  type ViewModeKey,
} from '@/context/view-mode-context'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'
import { ProjectStatusBadges } from '@/components/projects/project-status-badges'
import { ProjectStatusPill } from '@/components/projects/project-status-pill'
import { ViewToggle } from '@/components/ui/view-toggle'
import type { Selection } from '@/types/selection'

/** Get the view mode key for a selection (if it supports view toggling) */
function getViewModeKey(selection: Selection | null): ViewModeKey | null {
  if (!selection) return null
  if (selection.type === 'nav' && selection.id === 'this-week')
    return 'this-week'
  if (selection.type === 'project') return 'project'
  if (selection.type === 'area') return 'area'
  return null
}

function AppContent() {
  const [selection, setSelection] = useState<Selection | null>({
    type: 'nav',
    id: 'today',
  })
  const {
    getAreaById,
    getProjectById,
    getProjectsByAreaId,
    updateProjectStatus,
  } = useAppData()

  // Get view mode for current selection (if applicable)
  const viewModeKey = getViewModeKey(selection)

  // Get project status counts for the current area (if viewing an area)
  const projectStatusCounts = useMemo(() => {
    if (selection?.type !== 'area') return null
    const projects = getProjectsByAreaId(selection.id)
    const counts: Record<string, number> = {}
    for (const project of projects) {
      const status = project.status ?? 'planning'
      counts[status] = (counts[status] ?? 0) + 1
    }
    return counts
  }, [selection, getProjectsByAreaId])

  // Get current project (if viewing a project)
  const currentProject = useMemo(() => {
    if (selection?.type !== 'project') return null
    return getProjectById(selection.id) ?? null
  }, [selection, getProjectById])

  function getHeaderTitle(selection: Selection | null): string {
    if (!selection) return 'Dashboard'

    switch (selection.type) {
      case 'nav':
        switch (selection.id) {
          case 'today':
            return 'Today'
          case 'this-week':
            return 'This Week'
          case 'inbox':
            return 'Inbox'
          case 'calendar':
            return 'Calendar'
        }
        break
      case 'area':
        return getAreaById(selection.id)?.title ?? 'Area'
      case 'project':
        return getProjectById(selection.id)?.title ?? 'Project'
    }
    return 'Dashboard'
  }

  const { isOpen: isDetailOpen } = useTaskDetail()

  return (
    <SidebarProvider>
      <AppSidebar selection={selection} onSelectionChange={setSelection} />
      <SidebarInset className="flex flex-col overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <h1 className="text-xl font-semibold">{getHeaderTitle(selection)}</h1>
          {projectStatusCounts && (
            <ProjectStatusBadges counts={projectStatusCounts} />
          )}
          {currentProject && (
            <ProjectStatusPill
              status={currentProject.status ?? 'planning'}
              onStatusChange={(newStatus) =>
                updateProjectStatus(currentProject.id, newStatus)
              }
            />
          )}
          {/* View mode toggle - pushed to right */}
          {viewModeKey && (
            <div className="ml-auto">
              <HeaderViewToggle viewModeKey={viewModeKey} />
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <MainContent selection={selection} onSelectionChange={setSelection} />
        </main>
      </SidebarInset>
      {/* Right sidebar - full height, slides in from right */}
      <aside
        className={`
          bg-sidebar border-l flex-shrink-0 overflow-hidden
          transition-[width,opacity] duration-150 ease-out
          ${isDetailOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <div className="w-[400px] h-full">
          <TaskDetailPanel />
        </div>
      </aside>
    </SidebarProvider>
  )
}

/** Small component to use the view mode hook (can't use hooks conditionally in AppContent) */
function HeaderViewToggle({ viewModeKey }: { viewModeKey: ViewModeKey }) {
  const { viewMode, setViewMode, availableModes } = useViewMode(viewModeKey)
  return (
    <ViewToggle
      value={viewMode}
      onChange={setViewMode}
      availableModes={availableModes}
    />
  )
}

export function App() {
  return (
    <AppDataProvider>
      <TaskDetailProvider>
        <ViewModeProvider>
          <AppContent />
        </ViewModeProvider>
      </TaskDetailProvider>
    </AppDataProvider>
  )
}

export default App
