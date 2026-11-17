"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { Btn, EmptyState } from "@/app/components/kit";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotesDetailProps {
  note: Note | null;
  onDelete: (id: string) => void;
  onBack: () => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: (updatedNote: Note) => void;
  isSaving?: boolean;
}

interface Analysis {
  summary: string;
  keyPoints: string[];
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
  actionItems: string[];
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-success-soft text-success",
  neutral: "bg-surface-3 text-muted",
  negative: "bg-danger-soft text-danger",
};

/** Parent passes `key={note.id}` so local state re-initialises per note. */
export default function NotesDetail({
  note,
  onDelete,
  onBack,
  isEditing,
  onEditToggle,
  onSave,
  isSaving = false,
}: NotesDetailProps) {
  const [localTitle, setLocalTitle] = useState(note?.title ?? "");
  const [localContent, setLocalContent] = useState(note?.content || note?.preview || "");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  if (!note) {
    return <EmptyState icon={BookOpen} title="Select a note" hint="Pick a note from the list, or create a new one." className="h-full" />;
  }

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze-note", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: note.title, content: isEditing ? localContent : note.content }),
      });
      const json = await res.json();
      if (!res.ok) setAnalyzeError(json.error || "Analysis failed");
      else setAnalysis(json.analysis);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Network error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => onSave({ ...note, title: localTitle.trim() || "Untitled", content: localContent });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    if (e.key === "Escape") {
      setLocalTitle(note.title);
      setLocalContent(note.content || note.preview || "");
      onEditToggle();
    }
  };

  const words = (isEditing ? localContent : note.content || "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col" onKeyDown={isEditing ? onKeyDown : undefined}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 md:px-6">
        <Btn variant="ghost" size="icon" onClick={onBack} className="md:hidden" aria-label="Back to notes">
          <ArrowLeft />
        </Btn>
        <p className="mr-auto truncate text-xs text-subtle">
          Updated {note.updatedAt} · {words} word{words === 1 ? "" : "s"}
        </p>
        <Btn variant="soft" size="sm" onClick={handleAnalyze} disabled={analyzing}>
          <Sparkles className={cn(analyzing && "animate-pulse text-accent")} />
          <span className="max-sm:hidden">{analyzing ? "Analyzing…" : "Analyze"}</span>
        </Btn>
        {isEditing ? (
          <Btn variant="accent" size="sm" onClick={handleSave} disabled={isSaving}>
            <Check /> {isSaving ? "Saving…" : "Save"}
          </Btn>
        ) : (
          <Btn variant="soft" size="sm" onClick={onEditToggle}>
            <Pencil /> Edit
          </Btn>
        )}
        <Btn variant="danger" size="icon" onClick={() => onDelete(note.id)} aria-label="Delete note">
          <Trash2 />
        </Btn>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full max-w-3xl flex-col px-5 py-6 md:px-10 md:py-10">
          {isEditing ? (
            <>
              <input
                autoFocus
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full bg-transparent font-display text-3xl font-bold tracking-[-0.03em] text-fg placeholder:text-subtle focus:outline-none md:text-4xl"
              />
              <textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Start writing…"
                className="mt-4 min-h-64 w-full flex-1 resize-none bg-transparent text-[15px] leading-7 text-fg placeholder:text-subtle focus:outline-none"
              />
              <p className="mt-2 text-[11px] text-subtle max-md:hidden">⌘/Ctrl + S to save · Esc to cancel</p>
            </>
          ) : (
            <button onDoubleClick={onEditToggle} className="cursor-text text-left" title="Double-click to edit">
              <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-fg md:text-4xl">{note.title}</h1>
              <p className="mt-4 text-[15px] leading-7 whitespace-pre-wrap text-fg/85">
                {note.content || note.preview || <span className="text-subtle">This note is empty. Double-click to start writing.</span>}
              </p>
            </button>
          )}

          {analyzeError && (
            <p className="mt-6 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{analyzeError}</p>
          )}

          <AnimatePresence>
            {analysis && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-8 rounded-2xl border border-accent/25 bg-accent-soft p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    <Sparkles className="size-3.5" /> AI analysis
                  </span>
                  <button onClick={() => setAnalysis(null)} className="text-subtle hover:text-fg" aria-label="Close analysis">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-fg">{analysis.summary}</p>

                {analysis.keyPoints.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {analysis.keyPoints.map((pt, i) => (
                      <li key={i} className="flex gap-2 text-sm text-fg/85">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}

                {analysis.actionItems.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-semibold text-muted">Action items</p>
                    <ul className="space-y-1.5">
                      {analysis.actionItems.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-fg/85">
                          <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", SENTIMENT_STYLES[analysis.sentiment] ?? SENTIMENT_STYLES.neutral)}>
                    {analysis.sentiment}
                  </span>
                  {analysis.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
