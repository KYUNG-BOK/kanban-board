import type { BoardState, Task, ID } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultSB } from "../../lib/supabaseClient";

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

type DBColumn = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
};
type DBTask = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | null;
  assignee: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export function toBoardState(cols: DBColumn[], tasks: DBTask[]): BoardState {
  const columns = [...cols]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, title: c.title }));

  const tasksMap: BoardState["tasks"] = {};
  const columnTaskIds: BoardState["columnTaskIds"] = Object.fromEntries(
    columns.map((c) => [c.id, [] as string[]])
  );

  [...tasks]
    .sort((a, b) => a.position - b.position)
    .forEach((t) => {
      tasksMap[t.id] = {
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        priority: (t.priority ?? "medium") as Task["priority"],
        assignee: t.assignee ?? undefined,
        createdAt: new Date(t.created_at).getTime(),
        updatedAt: new Date(t.updated_at).getTime(),
      };
      if (!columnTaskIds[t.column_id]) columnTaskIds[t.column_id] = [];
      columnTaskIds[t.column_id].push(t.id);
    });

  return { columns, columnTaskIds, tasks: tasksMap };
}

export function calcPositions(ids: string[], base = 100): Record<string, number> {
  const map: Record<string, number> = {};
  ids.forEach((id, idx) => (map[id] = idx * base));
  return map;
}

/** 보드 읽기 */
export async function fetchBoard(
  boardId: string,
  sb: SupabaseClient = defaultSB
): Promise<BoardState> {
  const { data: cols, error: e1 } = await sb
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (e1) throw e1;

  const { data: tasks, error: e2 } = await sb
    .from("tasks")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (e2) throw e2;

  return toBoardState((cols ?? []) as DBColumn[], (tasks ?? []) as DBTask[]);
}

export async function createTask(
  boardId: string,
  input: {
    id?: string;
    columnId: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    assignee?: string;
    position: number;
  },
  sb: SupabaseClient = defaultSB
): Promise<DBTask> {
  const { data, error } = await sb
    .from("tasks")
    .insert({
      id: input.id,
      board_id: boardId,
      column_id: input.columnId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      assignee: input.assignee ?? null,
      position: input.position,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DBTask;
}

export async function updateTask(
  taskId: string,
  patch: Partial<{
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    assignee?: string;
    column_id: string;
    position: number;
  }>,
  sb: SupabaseClient = defaultSB
): Promise<DBTask> {
  const { data, error } = await sb
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("*")
    .single();
  if (error) throw error;
  return data as DBTask;
}

export async function deleteTaskById(
  taskId: string,
  sb: SupabaseClient = defaultSB
): Promise<void> {
  const { error } = await sb.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function batchReorderTasks(
  updates: Array<{ id: string; column_id: string; position: number }>,
  boardId: string,
  sb: SupabaseClient = defaultSB
): Promise<void> {
  if (!updates.length) return;

  const results = await Promise.all(
    updates.map((u) =>
      sb
        .from("tasks")
        .update({
          column_id: u.column_id,
          position: u.position,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.id)
        .eq("board_id", boardId)
        
        .maybeSingle()
    )
  );

  const firstErr = results.find((r: any) => r.error)?.error;
  if (firstErr) throw firstErr;
}

export async function createColumn(
  boardId: string,
  title: string,
  position: number,
  sb: SupabaseClient = defaultSB
) {
  const { data, error } = await sb
    .from("columns")
    .insert({ board_id: boardId, title, position })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBoardOrSeed(
  boardId: string,
  sb: SupabaseClient = defaultSB
): Promise<BoardState> {

  const { data: cols, error: e1 } = await sb
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (e1) throw e1;

  if (!cols || cols.length === 0) {
    await Promise.all([
      createColumn(boardId, "To Do", 0, sb),
      createColumn(boardId, "In Progress", 100, sb),
      createColumn(boardId, "Done", 200, sb),
    ]);
  }

  const { data: cols2, error: e2 } = await sb
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (e2) throw e2;

  const { data: tasks, error: e3 } = await sb
    .from("tasks")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (e3) throw e3;

  return toBoardState((cols2 ?? []) as any[], (tasks ?? []) as any[]);
}

