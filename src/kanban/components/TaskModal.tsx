import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { useOutsideClose } from "../hooks/useOutsideClose";
import type { TaskDraft } from "../state/types";

export default function TaskModal({
  open,
  initial,
  onSubmit,
  onClose,
}: {
  open: boolean;
  initial?: Partial<TaskDraft>;
  onSubmit: (draft: TaskDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: (initial?.priority as TaskDraft["priority"]) ?? "medium",
    assignee: initial?.assignee ?? "",
  });

  useEffect(() => {
    if (open) {
      setDraft({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        priority: (initial?.priority as TaskDraft["priority"]) ?? "medium",
        assignee: initial?.assignee ?? "",
      });
    }
  }, [open, initial]);

  const panelRef = useOutsideClose<HTMLDivElement>(() => open && onClose());
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <m.div
        ref={panelRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-700 p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-3">Task</h3>
        <div className="flex flex-col gap-3">
          <label className="text-xs text-slate-600 dark:text-slate-300">
            주제
            <input
              autoFocus
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-950"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="무엇을 할까요?"
            />
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            설명
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-950 min-h-[88px]"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="세부 내용"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-600 dark:text-slate-300">
              우선순위
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-950"
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as TaskDraft["priority"] }))}
              >
                <option value="high">중요</option>
                <option value="medium">덜 중요</option>
                <option value="low">나중에...</option>
              </select>
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">
              담당자(이니셜)
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-950"
                value={draft.assignee}
                onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value }))}
                placeholder="예: KB"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="h-9 px-3 rounded-xl border bg-white" onClick={onClose}>취소</button>
          <button
            className="h-9 px-3 rounded-xl border bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            onClick={() => draft.title.trim() && onSubmit({
              title: draft.title.trim(),
              description: draft.description?.trim() || "",
              priority: draft.priority,
              assignee: draft.assignee?.trim() || undefined,
            })}
          >
            저장
          </button>
        </div>
      </m.div>
    </div>
  );
}