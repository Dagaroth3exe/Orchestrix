"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TasksList from "@/app/components/TasksList";
import TasksDetail from "@/app/components/TasksDetail";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  completed: boolean;
}

function dbRowToTask(row: Record<string, string | boolean>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    priority: row.priority as "high" | "medium" | "low",
    dueDate: row.due_date as string,
    completed: row.completed as boolean,
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/Login"); return; }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map(dbRowToTask);
        setTasks(mapped);
        setSelectedTaskId(mapped[0]?.id ?? null);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const handleAddTask = async () => {
    if (isAdding) return;
    setIsAdding(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsAdding(false); return; }

    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: session.user.id,
        title: "New Task",
        description: "Click to edit...",
        priority: "medium",
        due_date: dueDate,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      setDbError(`Insert failed: ${error.message} (code: ${error.code})`);
    } else if (data) {
      const newTask = dbRowToTask(data);
      setTasks((prev) => [newTask, ...prev]);
      setSelectedTaskId(newTask.id);
      setIsEditing(true);
    }
    setIsAdding(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaskId((prev) => {
      const remaining = tasks.filter((t) => t.id !== id);
      return prev === id ? (remaining[0]?.id ?? null) : prev;
    });
  };

  const handleSaveTask = async (updated: Task) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("tasks")
      .update({
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        due_date: updated.dueDate,
      })
      .eq("id", updated.id);

    if (error) {
      setDbError(`Save failed: ${error.message}`);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
    setIsSaving(false);
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", id);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-2xl">
        <p className="text-[#231E1F]/50 [font-family:var(--font-outfit)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-amber-50 rounded-2xl overflow-hidden">
      {dbError && (
        <div className="bg-red-500 text-white text-sm px-6 py-2 [font-family:var(--font-outfit)]">
          Supabase error: {dbError}
        </div>
      )}
      <div className="px-6 py-4 border-b border-[#231E1F]/10 flex items-center">
        <div className="flex-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold"
          >
            <ArrowLeft className="size-5" />
            Back to Dashboard
          </button>
        </div>
        <h1 className="text-3xl text-[#231E1F] font-semibold [font-family:var(--font-outfit)]">
          Tasks
        </h1>
        <div className="flex-1" />
      </div>
      <div className="flex-1 p-3 md:p-6 flex gap-4 overflow-hidden">
        {/* List: full-width on mobile (hidden when task selected), 30% on desktop */}
        <div className={`h-full w-full md:w-[30%] shrink-0 ${selectedTaskId ? "hidden md:block" : "block"}`}>
          <TasksList
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onAddTask={handleAddTask}
            isAdding={isAdding}
            onToggleComplete={handleToggleComplete}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterPriority={filterPriority}
            onFilterChange={setFilterPriority}
          />
        </div>
        {/* Detail: full-width on mobile (hidden when no task), fills remaining space on desktop */}
        <div className={`h-full flex-1 min-w-0 ${selectedTaskId ? "block" : "hidden md:block"}`}>
          <TasksDetail
            task={selectedTask}
            onDelete={handleDeleteTask}
            onBack={() => setSelectedTaskId(null)}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            onToggleComplete={handleToggleComplete}
            onSave={handleSaveTask}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
