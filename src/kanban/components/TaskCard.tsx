import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { m, useReducedMotion } from "framer-motion";
import type { ID, Task } from "../state/types";

export default function TaskCard({ taskId, task, isOverlay }: { taskId: ID; task: Task; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: taskId });
  const prefersReducedMotion = useReducedMotion();

  const style: React.CSSProperties = !isOverlay
    ? { transform: CSS.Transform.toString(transform), transition, willChange: "transform" }
    : {};

  const base = "rounded-2xl border bg-white dark:bg-slate-900 p-3 select-none";
  const fx = isOverlay ? "shadow-xl ring-1 ring-slate-300/60 scale-[1.02]"
    : isDragging ? "opacity-90"
    : "shadow-sm hover:shadow-md";

  return (
    <m.div
      ref={setNodeRef as React.Ref<HTMLDivElement>}
      style={style}
      layout={prefersReducedMotion ? false : "position"}
      initial={prefersReducedMotion ? false : { opacity: 0.0, scale: 0.99 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: isOverlay ? 1.02 : 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.99 }}
      transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 260, damping: 28, mass: 0.6 }}
      className={[base, fx, "cursor-grab active:cursor-grabbing"].join(" ")}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium truncate pr-2">{task.title}</div>
        <div className="flex items-center gap-1">
          {task.priority && (
            <span
              title={task.priority}
              className={[
                "text-[10px] px-2 py-0.5 rounded-full",
                task.priority === "high" && "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
                task.priority === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                task.priority === "low" && "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
              ].filter(Boolean).join(" ")}
            >
              {task.priority}
            </span>
          )}
          {task.assignee && (
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-semibold text-slate-600 dark:text-slate-200">
              {task.assignee.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      {task.description && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
          {task.description}
        </div>
      )}
    </m.div>
  );
}