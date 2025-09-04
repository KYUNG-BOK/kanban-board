export type ID = string;

export type Task = {
  id: ID;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  assignee?: string; // 이니셜/이름
  createdAt: number;
  updatedAt: number;
};

export type Column = { id: ID; title: string };

export type BoardState = {
  columns: Column[];
  columnTaskIds: Record<ID, ID[]>; // columnId -> ordered task ids
  tasks: Record<ID, Task>;
};

export type TaskDraft = {
  title: string;
  description?: string;
  priority: NonNullable<Task["priority"]>;
  assignee?: string;
};