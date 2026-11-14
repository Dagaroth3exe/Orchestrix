import { CheckCircle2, Circle, ListTodo } from "lucide-react";
import { Btn, EmptyState, SearchInput, priorityStyles } from "@/app/components/kit";
import { daysUntil, formatDue } from "@/lib/format";
import type { Priority, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | Priority;

interface TasksListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: () => void;
  onToggleComplete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPriority: Filter;
  onFilterChange: (priority: Filter) => void;
}

const FILTERS: Filter[] = ["all", "high", "medium", "low"];

export default function TasksList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onToggleComplete,
  searchQuery,
  onSearchChange,
  filterPriority,
  onFilterChange,
}: TasksListProps) {
  const q = searchQuery.toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)) &&
      (filterPriority === "all" || t.priority === filterPriority)
  );
  const open = filtered.filter((t) => !t.completed);
  const done = filtered.filter((t) => t.completed);

  const row = (task: Task) => {
    const active = selectedTaskId === task.id;
    const overdue = !task.completed && (daysUntil(task.dueDate) ?? 1) < 0;
    return (
      <li key={task.id}>
        <div
          className={cn(
            "relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
            active ? "bg-accent-soft" : "hover:bg-surface-2"
          )}
        >
          {active && <span className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-accent" />}
          <button
            onClick={() => onToggleComplete(task.id)}
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
            className="mt-0.5 text-subtle transition-colors hover:text-accent"
          >
            {task.completed ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5" />}
          </button>
          <button onClick={() => onSelectTask(task.id)} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className={cn("truncate text-sm font-medium", task.completed ? "text-subtle line-through" : "text-fg")}>
                {task.title}
              </h3>
            </div>
            <p className={cn("mt-0.5 text-xs", overdue ? "text-danger" : "text-muted")}>
              {task.completed ? "Completed" : formatDue(task.dueDate)}
            </p>
          </button>
          <span className="mt-0.5 flex w-16 shrink-0 items-center justify-end gap-1.5 text-xs text-muted">
            <span className={cn("size-1.5 rounded-full", priorityStyles[task.priority].dot)} />
            {priorityStyles[task.priority].label}
          </span>
        </div>
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5 p-3">
        <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search tasks" />
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
          {FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => onFilterChange(p)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium capitalize transition-all",
                filterPriority === p ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg"
              )}
            >
              {p !== "all" && <span className={cn("size-1.5 rounded-full", priorityStyles[p].dot)} />}
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            hint="Break your work into small, doable steps."
            action={<Btn variant="accent" size="sm" onClick={onAddTask}>Add a task</Btn>}
          />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No tasks match these filters.</p>
        ) : (
          <>
            <ul className="space-y-0.5">{open.map(row)}</ul>
            {done.length > 0 && (
              <>
                <p className="mt-4 mb-1 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
                  Completed · {done.length}
                </p>
                <ul className="space-y-0.5">{done.map(row)}</ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
