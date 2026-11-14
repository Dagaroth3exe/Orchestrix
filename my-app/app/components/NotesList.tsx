import { BookOpen } from "lucide-react";
import { Btn, EmptyState, SearchInput } from "@/app/components/kit";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const q = searchQuery.toLowerCase();
  const filtered = notes.filter(
    (n) => n.title.toLowerCase().includes(q) || (n.preview ?? "").toLowerCase().includes(q)
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search notes" />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {notes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No notes yet"
            hint="Capture ideas, meeting notes and more."
            action={<Btn variant="accent" size="sm" onClick={onAddNote}>Create a note</Btn>}
          />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No notes match “{searchQuery}”.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((note) => {
              const active = selectedNoteId === note.id;
              return (
                <li key={note.id}>
                  <button
                    onClick={() => onSelectNote(note.id)}
                    className={cn(
                      "relative w-full rounded-xl px-3.5 py-3 text-left transition-colors",
                      active ? "bg-accent-soft" : "hover:bg-surface-2"
                    )}
                  >
                    {active && <span className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-accent" />}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-sm font-medium text-fg">{note.title || "Untitled"}</h3>
                      <span className="shrink-0 text-[11px] text-subtle">{note.updatedAt}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                      {note.preview || "No content yet"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
