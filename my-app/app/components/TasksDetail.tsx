import { Trash2, ArrowLeft, Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  completed: boolean;
}

interface TasksDetailProps {
  task: Task | null;
  onDelete: (id: string) => void;
  onBack: () => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onToggleComplete: (id: string) => void;
}

export default function TasksDetail({
  task,
  onDelete,
  onBack,
  isEditing,
  onEditToggle,
  onToggleComplete,
}: TasksDetailProps) {
  const priorityColors = {
    high: "bg-red-500 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-green-500 text-white",
  };

  if (!task) {
    return (
      <div className="w-[70%] bg-amber-50 rounded-2xl p-8 flex flex-col items-center justify-center h-full">
        <p className="text-[#231E1F]/50 text-lg [font-family:var(--font-outfit)]">
          Select a task to view details
        </p>
      </div>
    );
  }

  return (
    <div className="w-[70%] bg-amber-50 rounded-2xl p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#231E1F]/10">
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleComplete(task.id)}
              className="text-3xl"
            >
              {task.completed ? "✓" : "○"}
            </button>
            <h1
              className={`text-4xl font-semibold [font-family:var(--font-outfit)] ${
                task.completed
                  ? "text-[#231E1F]/50 line-through"
                  : "text-[#231E1F]"
              }`}
            >
              {task.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold [font-family:var(--font-outfit)] capitalize ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority} Priority
            </span>
            <span className="flex items-center gap-1 text-[#231E1F]/60 text-sm [font-family:var(--font-outfit)]">
              <Calendar className="size-4" />
              {task.dueDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditToggle}
            className="px-4 py-2 bg-[#231E1F] text-amber-50 rounded-lg hover:bg-[#231E1F]/90 transition-colors font-semibold text-sm [font-family:var(--font-outfit)]"
          >
            {isEditing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors [font-family:var(--font-outfit)]"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[#231E1F] font-semibold mb-2 [font-family:var(--font-outfit)]">
                Description
              </label>
              <textarea
                defaultValue={task.description}
                className="w-full h-48 p-4 bg-white border border-[#231E1F]/20 rounded-lg text-[#231E1F] focus:outline-none focus:ring-2 focus:ring-[#231E1F] [font-family:var(--font-outfit)] resize-none"
                placeholder="Add task details..."
              />
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none [font-family:var(--font-outfit)]">
            <p className="text-[#231E1F] text-base leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Status */}
      <div className="mt-6 pt-4 border-t border-[#231E1F]/10">
        <p className="text-[#231E1F]/60 text-sm [font-family:var(--font-outfit)]">
          Status:{" "}
          <span className="font-semibold text-[#231E1F]">
            {task.completed ? "Completed ✓" : "Pending"}
          </span>
        </p>
      </div>
    </div>
  );
}
