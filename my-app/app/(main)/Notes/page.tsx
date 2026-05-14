"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import NotesList from "@/app/components/NotesList";
import NotesDetail from "@/app/components/NotesDetail";
import { supabase } from "@/lib/supabase";

interface Note {
  id: string;
  title: string;
  preview: string;
  content?: string;
  updatedAt: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/Login"); return; }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        setDbError(error.message);
      } else if (data) {
        const mapped = data.map(dbRowToNote);
        setNotes(mapped);
        setSelectedNoteId(mapped[0]?.id ?? null);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const handleAddNote = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log("session:", session, "sessionError:", sessionError);
    if (!session) { setDbError("No session — please log in again."); return; }

    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: session.user.id, title: "New Note", preview: "Click to edit...", content: "" })
      .select()
      .single();

    console.log("insert result:", { data, error });

    if (error) {
      setDbError(`Insert failed: ${error.message} (code: ${error.code})`);
    } else if (data) {
      const newNote = dbRowToNote(data);
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setIsEditing(true);
    }
  };

  const handleSaveNote = async (updated: Note) => {
    const preview = (updated.content ?? "").slice(0, 80) || updated.title;
    const { error } = await supabase
      .from("notes")
      .update({
        title: updated.title,
        preview,
        content: updated.content ?? "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", updated.id);

    if (error) {
      setDbError(error.message);
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? { ...updated, preview, updatedAt: "just now" } : n))
      );
    }
  };

  const handleDeleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedNoteId((prev) => {
      const remaining = notes.filter((n) => n.id !== id);
      return prev === id ? (remaining[0]?.id ?? null) : prev;
    });
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
      <div className="px-6 py-4 border-b border-[#231E1F]/10 flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold"
        >
          <ArrowLeft className="size-5" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl text-[#231E1F] font-semibold [font-family:var(--font-outfit)]">
          Notes
        </h1>
      </div>
      <div className="flex-1 p-3 md:p-6 flex gap-4 overflow-hidden">
        {/* List: full-width on mobile (hidden when note selected), 30% on desktop */}
        <div className={`h-full w-full md:w-[30%] shrink-0 ${selectedNoteId ? "hidden md:block" : "block"}`}>
          <NotesList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            onAddNote={handleAddNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        {/* Detail: full-width on mobile (hidden when no note), fills remaining space on desktop */}
        <div className={`h-full flex-1 min-w-0 ${selectedNoteId ? "block" : "hidden md:block"}`}>
          <NotesDetail
            note={selectedNote}
            onDelete={handleDeleteNote}
            onBack={() => setSelectedNoteId(null)}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            onSave={handleSaveNote}
          />
        </div>
      </div>
    </div>
  );
}
