import { Search, Plus, CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  completed: boolean;
}

interface TasksListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: () => void;
  onToggleComplete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPriority: "all" | "high" | "medium" | "low";
  onFilterChange: (priority: "all" | "high" | "medium" | "low") => void;
}

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
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="w-[30%] bg-[#231E1F] rounded-2xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-2xl font-semibold [font-family:var(--font-outfit)]">
          Tasks
        </h2>
        <button
          onClick={onAddTask}
          className="bg-amber-50/80 hover:bg-amber-50 text-[#231E1F] p-2 rounded-lg transition-colors"
          aria-label="Add new task"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#2a2522] text-white placeholder-gray-500 rounded-lg border border-gray-700 focus:border-amber-50/30 focus:outline-none [font-family:var(--font-outfit)]"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["all", "high", "medium", "low"].map((priority) => (
          <button
            key={priority}
            onClick={() =>
              onFilterChange(priority as "all" | "high" | "medium" | "low")
            }
            className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap transition-all [font-family:var(--font-outfit)] ${
              filterPriority === priority
                ? "bg-amber-50 text-[#231E1F]"
                : "bg-[#2a2522] text-gray-400 hover:bg-[#332f2a]"
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-gray-400 text-center py-8 text-sm">
            No tasks found
          </div>
        ) : (
          filteredTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className={`w-full text-left p-3 rounded-lg transition-all [font-family:var(--font-outfit)] group ${
                selectedTaskId === task.id
                  ? "bg-amber-50/20 border-l-4 border-amber-50"
                  : "hover:bg-[#2a2522]"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id);
                  }}
                  className="mt-1 text-gray-400 hover:text-amber-50 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="size-5 text-green-400" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold text-sm line-clamp-1 ${
                        task.completed
                          ? "text-gray-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <span
                      className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}
                    ></span>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-1 mt-1">
                    {task.description}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{task.dueDate}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
