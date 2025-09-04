import { useEffect, useState } from "react";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { LazyMotion, AnimatePresence, domAnimation } from "framer-motion";

import ColumnView from "./components/ColumnView";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";

import {
  fetchBoardOrSeed, 
  createTask,
  updateTask as updateTaskApi,
  deleteTaskById,
  batchReorderTasks,
  calcPositions,
} from "./state/store";
import type { BoardState, ID, TaskDraft } from "./state/types";

const BOARD_ID = "861ad7c2-3e4b-4ce2-ace8-d5e73af8a582";
const EMPTY: BoardState = { columns: [], columnTaskIds: {}, tasks: {} };

export default function KanbanBoard() {
  const [state, setState] = useState<BoardState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<ID | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalColumn, setModalColumn] = useState<ID | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<ID | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    (async () => {
      try {
        const bs = await fetchBoardOrSeed(BOARD_ID); 
        setState(bs);
      } catch (e) {
        console.error("fetchBoardOrSeed failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function findContainer(taskId: ID): ID | undefined {
    return state.columns.find((c) => state.columnTaskIds[c.id]?.includes(taskId))?.id;
  }

  function handleDragStart(e: DragStartEvent) {
    if (loading) return;
    setActiveTaskId(String(e.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (loading) return;
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromColId = findContainer(activeId);
    const toColId = findContainer(overId) ?? overId;
    if (!fromColId || !toColId) return;
    if (!state.columnTaskIds[toColId] || !state.columnTaskIds[fromColId]) return;

    let next: BoardState = state;
    setState((prev) => {
      const fromList = [...prev.columnTaskIds[fromColId]];
      const toList = fromColId === toColId ? fromList : [...prev.columnTaskIds[toColId]];
      const oldIndex = fromList.indexOf(activeId);
      const newIndex = toList.indexOf(overId);

      if (fromColId === toColId) {
        const reordered = arrayMove(fromList, oldIndex, Math.max(newIndex, 0));
        next = { ...prev, columnTaskIds: { ...prev.columnTaskIds, [fromColId]: reordered } };
        return next;
      } else {
        fromList.splice(oldIndex, 1);
        const insertIndex = newIndex >= 0 ? newIndex : toList.length;
        toList.splice(insertIndex, 0, activeId);
        next = {
          ...prev,
          columnTaskIds: { ...prev.columnTaskIds, [fromColId]: fromList, [toColId]: toList },
        };
        return next;
      }
    });

    try {
      const toOrder = next.columnTaskIds[toColId];
      const fromOrder = next.columnTaskIds[fromColId];
      const toPos = calcPositions(toOrder);
      const fromPos = calcPositions(fromOrder);

      const updates = [
        ...toOrder.map((id) => ({ id, column_id: toColId, position: toPos[id] })),
        ...fromOrder.map((id) => ({ id, column_id: fromColId, position: fromPos[id] })),
      ];
      await batchReorderTasks(updates, BOARD_ID);
    } catch (e) {
      console.error("batchReorderTasks failed:", e);
      const fresh = await fetchBoardOrSeed(BOARD_ID); // ★
      setState(fresh);
    }
  }

  function handleDragCancel() { setActiveTaskId(null); }

  function openAddModal(colId: ID) {
    if (loading) return;
    setModalColumn(colId);
    setEditingTaskId(null);
    setModalOpen(true);
  }

  function openEditModal(taskId: ID) {
    if (loading) return;
    setEditingTaskId(taskId);
    setModalColumn(null);
    setModalOpen(true);
  }

  async function addTask(draft: TaskDraft) {
    if (loading || !modalColumn) return;
    if (!state.columnTaskIds[modalColumn]) return;

    const id = crypto.randomUUID();
    const now = Date.now();
    const next = {
      ...state,
      tasks: {
        ...state.tasks,
        [id]: { id, title: draft.title, description: draft.description, priority: draft.priority, assignee: draft.assignee, createdAt: now, updatedAt: now },
      },
      columnTaskIds: {
        ...state.columnTaskIds,
        [modalColumn]: [...state.columnTaskIds[modalColumn], id],
      },
    };
    setState(next);
    setModalOpen(false);

    try {
      const ids = next.columnTaskIds[modalColumn];
      const pos = calcPositions(ids);
      await createTask(BOARD_ID, {
        id,
        columnId: modalColumn,
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        assignee: draft.assignee,
        position: pos[id],
      });
    } catch (e) {
      console.error("createTask failed:", e);
      const fresh = await fetchBoardOrSeed(BOARD_ID); // ★
      setState(fresh);
    }
  }

  async function updateTask(draft: TaskDraft) {
    if (loading || !editingTaskId) return;

    setState((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [editingTaskId]: { ...prev.tasks[editingTaskId], ...draft, updatedAt: Date.now() } },
    }));
    setModalOpen(false);

    try {
      await updateTaskApi(editingTaskId, {
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        assignee: draft.assignee,
      });
    } catch (e) {
      console.error("updateTask failed:", e);
      const fresh = await fetchBoardOrSeed(BOARD_ID); // ★
      setState(fresh);
    }
  }

  async function deleteTask(taskId: ID) {
    if (loading) return;
    const colId = findContainer(taskId);
    if (!colId) return;

    setState((prev) => {
      const { [taskId]: _removed, ...rest } = prev.tasks;
      return {
        ...prev,
        tasks: rest,
        columnTaskIds: { ...prev.columnTaskIds, [colId]: prev.columnTaskIds[colId].filter((id) => id !== taskId) },
      };
    });

    try {
      await deleteTaskById(taskId);
    } catch (e) {
      console.error("deleteTask failed:", e);
      const fresh = await fetchBoardOrSeed(BOARD_ID); // ★
      setState(fresh);
    }
  }

  const editingInitial = editingTaskId ? state.tasks[editingTaskId] : undefined;

  if (loading) {
    return (
      <div className="min-h-screen w-full p-6">
        <div className="max-w-6lx mx-auto">
          <div className="animate-pulse grid grid-cols-3 gap-4">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
          <div className="mt-6 text-sm text-slate-500">보드 불러오는 중…</div>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Todo List</h1>
              <p className="text-sm text-slate-500">오늘 해야할 내용들을 정리해봐요.</p>
            </div>
            <div className="flex gap-2">
              <button
                className="h-9 px-3 rounded-xl border bg-white text-sm"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const fresh = await fetchBoardOrSeed(BOARD_ID); // ★
                    setState(fresh);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Reload
              </button>
              <button className="h-9 px-3 rounded-xl border bg-white text-sm" onClick={() => document.documentElement.classList.toggle("dark")}>
                Toggle Dark
              </button>
            </div>
          </header>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <div className="grid auto-cols-max grid-flow-col gap-4 overflow-x-auto pb-4">
              <SortableContext items={state.columns.map((c) => c.id)} strategy={rectSortingStrategy}>
                {state.columns.map((col) => (
                  <div key={col.id} id={col.id} className="relative">
                    <ColumnView column={col} taskIds={state.columnTaskIds[col.id]} tasks={state.tasks} onAdd={openAddModal} onEdit={openEditModal} onDelete={deleteTask} />
                  </div>
                ))}
              </SortableContext>
            </div>

            <DragOverlay dropAnimation={null}>
              {activeTaskId ? <TaskCard taskId={activeTaskId} task={state.tasks[activeTaskId]} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <TaskModal open={modalOpen} initial={editingInitial} onSubmit={editingTaskId ? updateTask : addTask} onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
