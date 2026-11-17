"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import NotesList from "@/app/components/NotesList";
import NotesDetail from "@/app/components/NotesDetail";
import { Btn, ErrorBanner, LoadingState, PageHeader } from "@/app/components/kit";
import { db } from "@/lib/db";
import { formatRelative } from "@/lib/format";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

function dbRowToNote(row: Record<string, string>): Note {
  return {
    id: row.id,
    title: row.title,
    preview: row.preview,
    content: row.content,
    updatedAt: formatRelative(row.updated_at),
  };
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
        .from("notes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        setDbError(error.message);
      } else if (data) {
        const mapped = data.map(dbRowToNote);
        setNotes(mapped);
        const wanted = new URLSearchParams(window.location.search).get("open");
        const target = mapped.find((x) => x.id === wanted);
        setSelectedNoteId(target?.id ?? mapped[0]?.id ?? null);
        if (target) setShowDetailMobile(true);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const selectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsEditing(false);
    setShowDetailMobile(true);
  };

  const handleAddNote = async () => {
    if (isAdding) return;
    setIsAdding(true);
    const { data: { session } } = await db.auth.getSession();
    if (!session) { setDbError("No session — please log in again."); setIsAdding(false); return; }

    const { data, error } = await db
      .from("notes")
      .insert({ user_id: session.user.id, title: "Untitled note", preview: "", content: "" })
      .select()
      .single();

    if (error) {
      setDbError(`Couldn't create note: ${error.message}`);
    } else if (data) {
      const newNote = dbRowToNote(data);
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setIsEditing(true);
      setShowDetailMobile(true);
    }
    setIsAdding(false);
  };

  const handleSaveNote = async (updated: Note) => {
    setIsSaving(true);
    const preview = (updated.content ?? "").slice(0, 80) || updated.title;
    const { error } = await db
      .from("notes")
      .update({
        title: updated.title,
        preview,
        content: updated.content ?? "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", updated.id);

    if (error) {
      setDbError(`Couldn't save: ${error.message}`);
    } else {
      setNotes((prev) => {
        const rest = prev.filter((n) => n.id !== updated.id);
        return [{ ...updated, preview, updatedAt: "just now" }, ...rest];
      });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    const { error } = await db.from("notes").delete().eq("id", id);
    if (error) { setDbError(`Couldn't delete: ${error.message}`); return; }
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedNoteId === id) {
      setSelectedNoteId(remaining[0]?.id ?? null);
      setShowDetailMobile(false);
    }
    setIsEditing(false);
  };

  if (loading) return <LoadingState label="Loading notes…" />;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Notes"
        description={`${notes.length} note${notes.length === 1 ? "" : "s"}`}
        actions={
          <Btn variant="primary" onClick={handleAddNote} disabled={isAdding}>
            <Plus /> {isAdding ? "Creating…" : "New note"}
          </Btn>
        }
        className={cn(showDetailMobile && "max-md:hidden")}
      />
      {dbError && <ErrorBanner message={dbError} onClose={() => setDbError(null)} />}

      <div className="flex min-h-0 flex-1">
        <div className={cn("w-full shrink-0 border-line md:w-80 md:border-r", showDetailMobile && "max-md:hidden")}>
          <NotesList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={selectNote}
            onAddNote={handleAddNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div className={cn("min-w-0 flex-1", !showDetailMobile && "max-md:hidden")}>
          <NotesDetail
            key={selectedNote?.id ?? "empty"}
            note={selectedNote}
            onDelete={handleDeleteNote}
            onBack={() => setShowDetailMobile(false)}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing((e) => !e)}
            onSave={handleSaveNote}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
