import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { LazyMotion, AnimatePresence, domAnimation } from "framer-motion";
import ColumnView from "./components/ColumnView";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import { DEMO, loadState, saveState } from "./state/store";
import type { BoardState, ID, TaskDraft } from "./state/types";

export default function KanbanBoard() {
  const persisted = loadState();
  const [state, setState] = useState<BoardState>(persisted ?? DEMO);
  const [activeTaskId, setActiveTaskId] = useState<ID | null>(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalColumn, setModalColumn] = useState<ID | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<ID | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // persist
  useEffect(() => { saveState(state); }, [state]);

  function findContainer(taskId: ID): ID | undefined {
    return state.columns.find((c) => state.columnTaskIds[c.id].includes(taskId))?.id;
  }

  function handleDragStart(e: DragStartEvent) { setActiveTaskId(String(e.active.id)); }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromColId = findContainer(activeId);
    const toColId = findContainer(overId) ?? overId; // drop onto column body
    if (!fromColId || !toColId) return;

    setState((prev) => {
      const fromList = [...prev.columnTaskIds[fromColId]];
      const toList = fromColId === toColId ? fromList : [...prev.columnTaskIds[toColId]];

      const oldIndex = fromList.indexOf(activeId);
      const newIndex = toList.indexOf(overId); // -1 if column body

      if (fromColId === toColId) {
        const reordered = arrayMove(fromList, oldIndex, Math.max(newIndex, 0));
        return { ...prev, columnTaskIds: { ...prev.columnTaskIds, [fromColId]: reordered } };
      } else {
        fromList.splice(oldIndex, 1);
        const insertIndex = newIndex >= 0 ? newIndex : toList.length;
        toList.splice(insertIndex, 0, activeId);
        return {
          ...prev,
          columnTaskIds: { ...prev.columnTaskIds, [fromColId]: fromList, [toColId]: toList },
        };
      }
    });
  }

  function handleDragCancel() { setActiveTaskId(null); }

  // CRUD handlers
  function openAddModal(colId: ID) {
    setModalColumn(colId);
    setEditingTaskId(null);
    setModalOpen(true);
  }

  function openEditModal(taskId: ID) {
    setEditingTaskId(taskId);
    setModalColumn(null);
    setModalOpen(true);
  }

  function addTask(draft: TaskDraft) {
    if (!modalColumn) return;
    const id = crypto.randomUUID();
    const now = Date.now();
    const task = { id, title: draft.title, description: draft.description, priority: draft.priority, assignee: draft.assignee, createdAt: now, updatedAt: now };
    setState((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [id]: task },
      columnTaskIds: { ...prev.columnTaskIds, [modalColumn]: [...prev.columnTaskIds[modalColumn], id] },
    }));
    setModalOpen(false);
  }

  function updateTask(draft: TaskDraft) {
    if (!editingTaskId) return;
    setState((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [editingTaskId]: { ...prev.tasks[editingTaskId], ...draft, updatedAt: Date.now() },
      },
    }));
    setModalOpen(false);
  }

  function deleteTask(taskId: ID) {
    const colId = findContainer(taskId);
    if (!colId) return;
    setState((prev) => {
      const { [taskId]: _removed, ...rest } = prev.tasks;
      return {
        ...prev,
        tasks: rest,
        columnTaskIds: {
          ...prev.columnTaskIds,
          [colId]: prev.columnTaskIds[colId].filter((id) => id !== taskId),
        },
      };
    });
  }

  const editingInitial = editingTaskId ? state.tasks[editingTaskId] : undefined;

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
              <button className="h-9 px-3 rounded-xl border bg-white text-sm" onClick={() => setState(DEMO)}>
                Reset demo
              </button>
            </div>
          </header>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid auto-cols-max grid-flow-col gap-4 overflow-x-auto pb-4">
              <SortableContext items={state.columns.map((c) => c.id)} strategy={rectSortingStrategy}>
                {state.columns.map((col) => (
                  <div key={col.id} id={col.id} className="relative">
                    <ColumnView
                      column={col}
                      taskIds={state.columnTaskIds[col.id]}
                      tasks={state.tasks}
                      onAdd={openAddModal}
                      onEdit={openEditModal}
                      onDelete={deleteTask}
                    />
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

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <TaskModal
            open={modalOpen}
            initial={editingInitial}
            onSubmit={editingTaskId ? updateTask : addTask}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}