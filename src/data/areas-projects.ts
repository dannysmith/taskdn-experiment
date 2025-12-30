export interface Project {
  id: string
  name: string
  areaId: string
  completion: number // 0-100
}

export interface Area {
  id: string
  name: string
  projects: Project[]
}

export const areas: Area[] = [
  {
    id: "health",
    name: "Health",
    projects: [
      { id: "health-1", name: "Morning Workout Routine", areaId: "health", completion: 75 },
      { id: "health-2", name: "Meal Prep Sundays", areaId: "health", completion: 40 },
      { id: "health-3", name: "Sleep Optimization", areaId: "health", completion: 90 },
      { id: "health-4", name: "Annual Checkups", areaId: "health", completion: 25 },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    projects: [
      { id: "finance-1", name: "Monthly Budget Review", areaId: "finance", completion: 60 },
      { id: "finance-2", name: "Emergency Fund", areaId: "finance", completion: 85 },
      { id: "finance-3", name: "Investment Portfolio", areaId: "finance", completion: 30 },
      { id: "finance-4", name: "Tax Preparation 2025", areaId: "finance", completion: 10 },
    ],
  },
  {
    id: "coding",
    name: "Coding",
    projects: [
      { id: "coding-1", name: "Learn Rust", areaId: "coding", completion: 20 },
      { id: "coding-2", name: "Side Project: Task App", areaId: "coding", completion: 55 },
      { id: "coding-3", name: "Open Source Contributions", areaId: "coding", completion: 70 },
      { id: "coding-4", name: "Blog Technical Articles", areaId: "coding", completion: 45 },
    ],
  },
  {
    id: "family-friends",
    name: "Family & Friends",
    projects: [
      { id: "family-1", name: "Weekly Family Calls", areaId: "family-friends", completion: 80 },
      { id: "family-2", name: "Birthday Gift Planning", areaId: "family-friends", completion: 15 },
      { id: "family-3", name: "Summer Vacation 2025", areaId: "family-friends", completion: 35 },
      { id: "family-4", name: "Game Night Hosting", areaId: "family-friends", completion: 100 },
    ],
  },
  {
    id: "marketing-sales",
    name: "Marketing & Sales",
    projects: [
      { id: "marketing-1", name: "Content Calendar", areaId: "marketing-sales", completion: 65 },
      { id: "marketing-2", name: "Newsletter Growth", areaId: "marketing-sales", completion: 50 },
      { id: "marketing-3", name: "Product Launch Q2", areaId: "marketing-sales", completion: 5 },
      { id: "marketing-4", name: "Customer Interviews", areaId: "marketing-sales", completion: 95 },
    ],
  },
  {
    id: "dating",
    name: "Dating",
    projects: [
      { id: "dating-1", name: "Profile Optimization", areaId: "dating", completion: 100 },
      { id: "dating-2", name: "Weekly Date Nights", areaId: "dating", completion: 60 },
      { id: "dating-3", name: "New Activities to Try", areaId: "dating", completion: 25 },
    ],
  },
]

// Helper to get all projects flat
export function getAllProjects(): Project[] {
  return areas.flatMap((area) => area.projects)
}

// Helper to get projects by area
export function getProjectsByArea(areaId: string): Project[] {
  return areas.find((area) => area.id === areaId)?.projects ?? []
}

// Helper to get area by id
export function getAreaById(areaId: string): Area | undefined {
  return areas.find((area) => area.id === areaId)
}
