import { Search, Plus } from "lucide-react";

interface Note {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onAddNote,
  searchQuery,
  onSearchChange,
}: NotesListProps) {
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-[#231E1F] rounded-2xl p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-2xl font-semibold [font-family:var(--font-outfit)]">
          Notes
        </h2>
        <button
          onClick={onAddNote}
          className="bg-amber-50/80 hover:bg-amber-50 text-[#231E1F] p-2 rounded-lg transition-colors"
          aria-label="Add new note"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#2a2522] text-white placeholder-gray-500 rounded-lg border border-gray-700 focus:border-amber-50/30 focus:outline-none [font-family:var(--font-outfit)]"
        />
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="text-gray-400 text-center py-8 text-sm">
            No notes found
          </div>
        ) : (
          filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`w-full text-left p-3 rounded-lg transition-all [font-family:var(--font-outfit)] ${
                selectedNoteId === note.id
                  ? "bg-amber-50/20 border-l-4 border-amber-50"
                  : "hover:bg-[#2a2522]"
              }`}
            >
              <h3 className="text-white font-semibold text-sm line-clamp-1">
                {note.title}
              </h3>
              <p className="text-gray-400 text-xs line-clamp-1 mt-1">
                {note.preview}
              </p>
              <p className="text-gray-500 text-xs mt-1">{note.updatedAt}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
