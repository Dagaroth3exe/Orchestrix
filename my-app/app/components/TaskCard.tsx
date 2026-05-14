interface TaskCardProps {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  onClick?: () => void;
}

export default function TaskCard({ title, description, priority, dueDate, onClick }: TaskCardProps) {
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#231E1F] h-60 w-full sm:w-80 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer [font-family:var(--font-outfit)]"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`${priorityColors[priority]} w-2 h-2 rounded-full`}></span>
            <span className="text-gray-300 text-xs uppercase tracking-wider">
              {priority} priority
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-3">
            {title}
          </h3>
          <p className="text-gray-300 text-xs line-clamp-4">
            {description}
          </p>
        </div>
        <p className="text-gray-400 text-xs">
          Due: {dueDate}
        </p>
      </div>
    </div>
  );
}
