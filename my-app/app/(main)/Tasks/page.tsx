"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TasksList from "@/app/components/TasksList";
import TasksDetail from "@/app/components/TasksDetail";
import { Btn, ErrorBanner, LoadingState, PageHeader } from "@/app/components/kit";
import { db } from "@/lib/db";
import type { Priority, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

function dbRowToTask(row: Record<string, string | boolean>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    priority: row.priority as Priority,
    dueDate: row.due_date as string,
    completed: row.completed as boolean,
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await db.auth.getSession();
      if (!session) { router.push("/Login"); return; }

      const { data, error } = await db
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setDbError(error.message);
      } else if (data) {
        const mapped = data.map(dbRowToTask);
        setTasks(mapped);
        const wanted = new URLSearchParams(window.location.search).get("open");
        const target = mapped.find((x) => x.id === wanted);
        setSelectedTaskId(target?.id ?? mapped[0]?.id ?? null);
        if (target) setShowDetailMobile(true);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const openCount = tasks.filter((t) => !t.completed).length;

  const selectTask = (id: string) => {
    setSelectedTaskId(id);
    setIsEditing(false);
    setShowDetailMobile(true);
  };

  const handleAddTask = async () => {
    if (isAdding) return;
    setIsAdding(true);
    const { data: { session } } = await db.auth.getSession();
    if (!session) { setDbError("No session — please log in again."); setIsAdding(false); return; }

    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const { data, error } = await db
      .from("tasks")
      .insert({
        user_id: session.user.id,
        title: "New task",
        description: "",
        priority: "medium",
        due_date: dueDate,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      setDbError(`Couldn't create task: ${error.message}`);
    } else if (data) {
      const newTask = dbRowToTask(data);
      setTasks((prev) => [newTask, ...prev]);
      setSelectedTaskId(newTask.id);
      setIsEditing(true);
      setShowDetailMobile(true);
    }
    setIsAdding(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    const { error } = await db.from("tasks").delete().eq("id", id);
    if (error) { setDbError(`Couldn't delete: ${error.message}`); return; }
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    if (selectedTaskId === id) {
      setSelectedTaskId(remaining[0]?.id ?? null);
      setShowDetailMobile(false);
    }
    setIsEditing(false);
  };

  const handleSaveTask = async (updated: Task) => {
    setIsSaving(true);
    const { error } = await db
      .from("tasks")
      .update({
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        due_date: updated.dueDate,
      })
      .eq("id", updated.id);

    if (error) {
      setDbError(`Couldn't save: ${error.message}`);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    // optimistic update, rolled back on failure
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    const { error } = await db.from("tasks").update({ completed: !task.completed }).eq("id", id);
    if (error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      setDbError(`Couldn't update: ${error.message}`);
    }
  };

  if (loading) return <LoadingState label="Loading tasks…" />;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Tasks"
        description={`${openCount} open · ${tasks.length - openCount} completed`}
        actions={
          <Btn variant="primary" onClick={handleAddTask} disabled={isAdding}>
            <Plus /> {isAdding ? "Creating…" : "New task"}
          </Btn>
        }
        className={cn(showDetailMobile && "max-md:hidden")}
      />
      {dbError && <ErrorBanner message={dbError} onClose={() => setDbError(null)} />}

      <div className="flex min-h-0 flex-1">
        <div className={cn("w-full shrink-0 border-line md:w-80 md:border-r", showDetailMobile && "max-md:hidden")}>
          <TasksList
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={selectTask}
            onAddTask={handleAddTask}
            onToggleComplete={handleToggleComplete}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterPriority={filterPriority}
            onFilterChange={setFilterPriority}
          />
        </div>
        <div className={cn("min-w-0 flex-1", !showDetailMobile && "max-md:hidden")}>
          <TasksDetail
            key={selectedTask?.id ?? "empty"}
            task={selectedTask}
            onDelete={handleDeleteTask}
            onBack={() => setShowDetailMobile(false)}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing((e) => !e)}
            onToggleComplete={handleToggleComplete}
            onSave={handleSaveTask}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
