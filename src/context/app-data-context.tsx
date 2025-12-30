import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { AppData, Area, Project, Task } from "@/types/data"
import { appData as initialAppData } from "@/data/app-data"

// -----------------------------------------------------------------------------
// Context Types
// -----------------------------------------------------------------------------

interface AppDataContextValue {
  data: AppData
  // Mutations
  updateProjectArea: (projectId: string, newAreaId: string | null) => void
  // Lookups (derived from data)
  getAreaById: (id: string) => Area | undefined
  getProjectById: (id: string) => Project | undefined
  getTaskById: (id: string) => Task | undefined
  getProjectsByAreaId: (areaId: string) => Project[]
  getOrphanProjects: () => Project[]
  getTasksByProjectId: (projectId: string) => Task[]
  getProjectCompletion: (projectId: string) => number
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => structuredClone(initialAppData))

  // Mutations
  const updateProjectArea = useCallback((projectId: string, newAreaId: string | null) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, areaId: newAreaId ?? undefined } : p
      )
    }))
  }, [])

  // Lookups
  const getAreaById = useCallback((id: string): Area | undefined => {
    return data.areas.find(a => a.id === id)
  }, [data.areas])

  const getProjectById = useCallback((id: string): Project | undefined => {
    return data.projects.find(p => p.id === id)
  }, [data.projects])

  const getTaskById = useCallback((id: string): Task | undefined => {
    return data.tasks.find(t => t.id === id)
  }, [data.tasks])

  const getProjectsByAreaId = useCallback((areaId: string): Project[] => {
    return data.projects.filter(p => p.areaId === areaId)
  }, [data.projects])

  const getOrphanProjects = useCallback((): Project[] => {
    return data.projects.filter(p => !p.areaId)
  }, [data.projects])

  const getTasksByProjectId = useCallback((projectId: string): Task[] => {
    return data.tasks.filter(t => t.projectId === projectId)
  }, [data.tasks])

  const getProjectCompletion = useCallback((projectId: string): number => {
    const tasks = data.tasks.filter(t => t.projectId === projectId)
    if (tasks.length === 0) return 0
    const completedCount = tasks.filter(
      t => t.status === "done" || t.status === "dropped"
    ).length
    return Math.round((completedCount / tasks.length) * 100)
  }, [data.tasks])

  const value: AppDataContextValue = {
    data,
    updateProjectArea,
    getAreaById,
    getProjectById,
    getTaskById,
    getProjectsByAreaId,
    getOrphanProjects,
    getTasksByProjectId,
    getProjectCompletion,
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider")
  }
  return context
}
