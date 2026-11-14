"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Check, CheckCircle2, Circle, ListTodo, Pencil, Trash2 } from "lucide-react";
import { Btn, EmptyState, PriorityChip, inputClass, priorityStyles } from "@/app/components/kit";
import { daysUntil, formatDue } from "@/lib/format";
import type { Priority, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TasksDetailProps {
  task: Task | null;
  onDelete: (id: string) => void;
  onBack: () => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onToggleComplete: (id: string) => void;
  onSave: (updated: Task) => void;
  isSaving?: boolean;
}

const PRIORITIES: Priority[] = ["high", "medium", "low"];

/** Parent passes `key={task.id}` so local state re-initialises per task. */
export default function TasksDetail({
  task,
  onDelete,
  onBack,
  isEditing,
  onEditToggle,
  onToggleComplete,
  onSave,
  isSaving = false,
}: TasksDetailProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");

  if (!task) {
    return <EmptyState icon={ListTodo} title="Select a task" hint="Pick a task from the list, or add a new one." className="h-full" />;
  }

  const reset = () => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(task.dueDate);
  };

  const handleSave = () =>
    onSave({ ...task, title: title.trim() || "Untitled task", description, priority, dueDate });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    if (e.key === "Escape") { reset(); onEditToggle(); }
  };

  const overdue = !task.completed && (daysUntil(task.dueDate) ?? 1) < 0;

  return (
    <div className="flex h-full flex-col" onKeyDown={isEditing ? onKeyDown : undefined}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 md:px-6">
        <Btn variant="ghost" size="icon" onClick={onBack} className="md:hidden" aria-label="Back to tasks">
          <ArrowLeft />
        </Btn>
        <p className="mr-auto truncate text-xs text-subtle">{task.completed ? "Completed" : formatDue(task.dueDate)}</p>
        {!isEditing && (
          <Btn variant={task.completed ? "soft" : "accent"} size="sm" onClick={() => onToggleComplete(task.id)}>
            {task.completed ? <Circle /> : <CheckCircle2 />}
            {task.completed ? "Reopen" : "Complete"}
          </Btn>
        )}
        {isEditing ? (
          <>
            <Btn variant="ghost" size="sm" onClick={() => { reset(); onEditToggle(); }}>Cancel</Btn>
            <Btn variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              <Check /> {isSaving ? "Saving…" : "Save"}
            </Btn>
          </>
        ) : (
          <Btn variant="soft" size="sm" onClick={onEditToggle}>
            <Pencil /> Edit
          </Btn>
        )}
        <Btn variant="danger" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">
          <Trash2 />
        </Btn>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6 md:px-10 md:py-10">
          {isEditing ? (
            <div className="space-y-6">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full bg-transparent font-display text-3xl font-bold tracking-[-0.03em] text-fg placeholder:text-subtle focus:outline-none md:text-4xl"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted">Priority</p>
                  <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium capitalize transition-all",
                          priority === p ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg"
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", priorityStyles[p].dot)} />
                        {priorityStyles[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-muted">Due date</span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn(inputClass, "h-10")} />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-muted">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, links or a checklist…"
                  rows={8}
                  className={cn(inputClass, "resize-none py-3 leading-6")}
                />
              </label>
              <p className="text-[11px] text-subtle max-md:hidden">⌘/Ctrl + S to save · Esc to cancel</p>
            </div>
          ) : (
            <>
              <h1
                className={cn(
                  "font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl",
                  task.completed ? "text-subtle line-through decoration-2" : "text-fg"
                )}
              >
                {task.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <PriorityChip priority={task.priority} />
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    overdue ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted"
                  )}
                >
                  <Calendar className="size-3.5" />
                  {formatDue(task.dueDate)}
                </span>
                {task.completed && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
                    <Check className="size-3.5" /> Completed
                  </span>
                )}
              </div>
              <div className="mt-8 border-t border-line pt-6">
                {task.description ? (
                  <p className="text-[15px] leading-7 whitespace-pre-wrap text-fg/85">{task.description}</p>
                ) : (
                  <button onClick={onEditToggle} className="text-sm text-subtle hover:text-accent">
                    + Add a description
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
