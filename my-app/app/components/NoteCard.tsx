interface NoteCardProps {
  title: string;
  preview: string;
  updatedAt: string;
  onClick?: () => void;
}

export default function NoteCard({ title, preview, updatedAt, onClick }: NoteCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[#231E1F] dark:bg-zinc-700 h-40 w-full sm:w-58 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer [font-family:var(--font-outfit)]"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
            {title}
          </h3>
          <p className="text-gray-300 text-xs line-clamp-2">
            {preview}
          </p>
        </div>
        <p className="text-gray-400 text-xs">
          {updatedAt}
        </p>
      </div>
    </div>
  );
}
