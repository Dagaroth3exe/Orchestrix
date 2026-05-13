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

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/Login"); return; }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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

    if (!error && data) {
      const newTask = dbRowToTask(data);
      setTasks((prev) => [newTask, ...prev]);
      setSelectedTaskId(newTask.id);
      setIsEditing(true);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaskId((prev) => {
      const remaining = tasks.filter((t) => t.id !== id);
      return prev === id ? (remaining[0]?.id ?? null) : prev;
    });
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
      <div className="px-6 py-4 border-b border-[#231E1F]/10">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold"
        >
          <ArrowLeft className="size-5" />
          Back to Dashboard
        </button>
      </div>
      <div className="flex-1 p-6 flex gap-4 overflow-hidden">
        <TasksList
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onAddTask={handleAddTask}
          onToggleComplete={handleToggleComplete}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterPriority={filterPriority}
          onFilterChange={setFilterPriority}
        />
        <TasksDetail
          task={selectedTask}
          onDelete={handleDeleteTask}
          onBack={() => setSelectedTaskId(null)}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onToggleComplete={handleToggleComplete}
        />
      </div>
    </div>
  );
}
