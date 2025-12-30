import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface TaskDetailContextValue {
  /** The ID of the task currently open in the detail panel, or null if closed */
  openTaskId: string | null
  /** Open the detail panel for a specific task */
  openTask: (taskId: string) => void
  /** Close the detail panel */
  closeTask: () => void
  /** Whether the detail panel is open */
  isOpen: boolean
}

const TaskDetailContext = createContext<TaskDetailContextValue | null>(null)

export function TaskDetailProvider({ children }: { children: React.ReactNode }) {
  // Start with a task open for design exploration
  const [openTaskId, setOpenTaskId] = useState<string | null>("coding-2-task-3")

  const openTask = useCallback((taskId: string) => {
    setOpenTaskId(taskId)
  }, [])

  const closeTask = useCallback(() => {
    setOpenTaskId(null)
  }, [])

  const value: TaskDetailContextValue = {
    openTaskId,
    openTask,
    closeTask,
    isOpen: openTaskId !== null,
  }

  return (
    <TaskDetailContext.Provider value={value}>
      {children}
    </TaskDetailContext.Provider>
  )
}

export function useTaskDetail(): TaskDetailContextValue {
  const context = useContext(TaskDetailContext)
  if (!context) {
    throw new Error("useTaskDetail must be used within a TaskDetailProvider")
  }
  return context
}
