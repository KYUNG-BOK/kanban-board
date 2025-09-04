import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, m } from "framer-motion";
import TaskCard from "./TaskCard";
import type { Column, ID, Task } from "../state/types";

export default function ColumnView({
  column,
  taskIds,
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: {
  column: Column;
  taskIds: ID[];
  tasks: Record<ID, Task>;
  onAdd: (colId: ID) => void;
  onEdit: (taskId: ID) => void;
  onDelete: (taskId: ID) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border dark:border-slate-700 p-3 w-90">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {column.title}
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
            {taskIds.length}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="h-7 px-2 rounded-lg text-xs border bg-white dark:bg-slate-900 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => onAdd(column.id)}
          >
            + Add
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "min-h-[320px] flex flex-col gap-3 rounded-xl p-1 transition-colors",
          isOver ? "bg-slate-100/80 dark:bg-slate-700/30" : "",
        ].join(" ")}
      >
        <SortableContext items={taskIds} strategy={rectSortingStrategy}>
          <AnimatePresence initial={false}>
            {taskIds.length === 0 ? (
              <m.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="text-xs text-slate-400 dark:text-slate-500 text-center py-6"
              >
                아직 등록된 할 일이 없어요
              </m.div>
            ) : (
              taskIds.map((id) => (
                <div key={id} className="group relative">
                  <TaskCard taskId={id} task={tasks[id]} />
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button className="text-[10px] px-2 py-0.5 rounded border bg-white/80" onClick={() => onEdit(id)}>Edit</button>
                    <button className="text-[10px] px-2 py-0.5 rounded border bg-white/80" onClick={() => onDelete(id)}>Del</button>
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}