import type { BoardState, Task, ID } from "./types";

const LS_KEY = "kanban-board-state-v1";

export function mkTask(
  id: ID,
  title: string,
  description?: string,
  priority: Task["priority"] = "medium",
  assignee?: string
): Task {
  const now = Date.now();
  return { id, title, description, priority, assignee, createdAt: now, updatedAt: now };
}

export const DEMO: BoardState = {
  columns: [
    { id: "todo", title: "To Do" },
    { id: "doing", title: "In Progress" },
    { id: "done", title: "Done" },
  ],
  columnTaskIds: { todo: ["t1", "t2"], doing: ["t3"], done: ["t4"] },
  tasks: {
    t1: mkTask("t1", "Project setup", "Vite + Tailwind + shadcn", "high", "KB"),
    t2: mkTask("t2", "Design columns", "Decide stages", "low", "HJ"),
    t3: mkTask("t3", "Drag & drop", "dnd-kit integration", "medium", "KB"),
    t4: mkTask("t4", "Write README", "Usage, roadmap", "low", "YY"),
  },
};

export function loadState(): BoardState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BoardState;
  } catch {
    return null;
  }
}

export function saveState(state: BoardState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

export function clearPersist() {
  localStorage.removeItem(LS_KEY);
}

export { LS_KEY };