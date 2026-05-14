import { useState, useEffect } from "react";
import { Trash2, ArrowLeft } from "lucide-react";

interface Note {
  id: string;
  title: string;
  preview: string;
  content?: string;
  updatedAt: string;
}

interface NotesDetailProps {
  note: Note | null;
  onDelete: (id: string) => void;
  onBack: () => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: (updatedNote: Note) => void;
}

export default function NotesDetail({
  note,
  onDelete,
  onBack,
  isEditing,
  onEditToggle,
  onSave,
}: NotesDetailProps) {
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");

  useEffect(() => {
    if (note) {
      setLocalTitle(note.title);
      setLocalContent(note.content || note.preview || "");
    }
  }, [note?.id]);

  if (!note) {
    return (
      <div className="w-[70%] bg-amber-50 rounded-2xl p-8 flex flex-col items-center justify-center h-full">
        <p className="text-[#231E1F]/50 text-lg [font-family:var(--font-outfit)]">
          Select a note to view details
        </p>
      </div>
    );
  }

  const handleSave = () => {
    onSave({
      ...note,
      title: localTitle || "Untitled",
      content: localContent,
    });
    onEditToggle();
  };

  return (
    <div className="w-full md:w-[70%] bg-amber-50 rounded-2xl p-4 md:p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#231E1F]/10">
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="text-4xl text-[#231E1F] font-semibold [font-family:var(--font-outfit)] bg-transparent border-b-2 border-[#231E1F] w-full focus:outline-none focus:border-[#231E1F]/60"
              placeholder="Note title..."
            />
          ) : (
            <h1 className="text-4xl text-[#231E1F] font-semibold [font-family:var(--font-outfit)]">
              {note.title}
            </h1>
          )}
          <p className="text-[#231E1F]/50 text-sm mt-2">
            Updated {note.updatedAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={isEditing ? handleSave : onEditToggle}
            className="px-4 py-2 bg-[#231E1F] text-amber-50 rounded-lg hover:bg-[#231E1F]/90 transition-colors font-semibold text-sm [font-family:var(--font-outfit)]"
          >
            {isEditing ? "Save" : "Edit"}
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors [font-family:var(--font-outfit)]"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isEditing ? (
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            className="w-full h-full p-4 bg-white border border-[#231E1F]/20 rounded-lg text-[#231E1F] focus:outline-none focus:ring-2 focus:ring-[#231E1F] [font-family:var(--font-outfit)] resize-none"
            placeholder="Start typing..."
          />
        ) : (
          <div className="prose prose-sm max-w-none [font-family:var(--font-outfit)]">
            <p className="text-[#231E1F] text-base leading-relaxed whitespace-pre-wrap">
              {note.content || note.preview}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
