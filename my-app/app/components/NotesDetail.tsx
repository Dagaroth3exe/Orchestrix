"use client";

import { useState, useEffect } from "react";
import { Trash2, ArrowLeft, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  positive: "bg-green-100 text-green-700",
  neutral: "bg-amber-100 text-amber-700",
  negative: "bg-red-100 text-red-700",
};

export default function NotesDetail({
  note,
  onDelete,
  onBack,
  isEditing,
  onEditToggle,
  onSave,
  isSaving = false,
}: NotesDetailProps) {
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setLocalTitle(note.title);
      setLocalContent(note.content || note.preview || "");
      setAnalysis(null);
      setAnalyzeError(null);
    }
  }, [note?.id]);

  const handleAnalyze = async () => {
    if (!note) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAnalyzeError("Not authenticated"); return; }

      const res = await fetch("/api/analyze-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: note.title, content: note.content }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAnalyzeError(json.error || "Analysis failed");
      } else {
        setAnalysis(json.analysis);
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Network error");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!note) {
    return (
      <div className="w-[70%] bg-amber-50 dark:bg-zinc-950 rounded-2xl p-8 flex flex-col items-center justify-center h-full transition-colors duration-200">
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
    <div className="w-full bg-amber-50 dark:bg-zinc-950 rounded-2xl p-4 md:p-8 flex flex-col h-full overflow-y-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#231E1F]/10 dark:border-zinc-800">
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
              className="text-4xl text-[#231E1F] dark:text-zinc-100 font-semibold [font-family:var(--font-outfit)] bg-transparent border-b-2 border-[#231E1F] dark:border-zinc-500 w-full focus:outline-none focus:border-[#231E1F]/60"
              placeholder="Note title..."
            />
          ) : (
            <h1 className="text-4xl text-[#231E1F] dark:text-zinc-100 font-semibold [font-family:var(--font-outfit)]">
              {note.title}
            </h1>
          )}
          <p className="text-[#231E1F]/50 dark:text-zinc-500 text-sm mt-2">Updated {note.updatedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold text-sm [font-family:var(--font-outfit)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Sparkles className="size-4" />
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>
          <button
            onClick={isEditing ? handleSave : onEditToggle}
            disabled={isSaving}
            className="px-4 py-2 bg-[#231E1F] text-amber-50 rounded-lg hover:bg-[#231E1F]/90 transition-colors font-semibold text-sm [font-family:var(--font-outfit)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : isEditing ? "Save" : "Edit"}
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
            className="w-full h-full p-4 bg-white dark:bg-zinc-800 border border-[#231E1F]/20 dark:border-zinc-600 rounded-lg text-[#231E1F] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#231E1F] dark:focus:ring-zinc-500 [font-family:var(--font-outfit)] resize-none"
            placeholder="Start typing..."
          />
        ) : (
          <div className="prose prose-sm max-w-none [font-family:var(--font-outfit)]">
            <p className="text-[#231E1F] dark:text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">
              {note.content || note.preview}
            </p>
          </div>
        )}
      </div>

      {/* Analysis results */}
      {analyzeError && (
        <p className="mt-4 text-red-500 text-xs [font-family:var(--font-outfit)]">{analyzeError}</p>
      )}
      {analysis && (
        <div className="mt-6 border-t border-[#231E1F]/10 dark:border-zinc-800 pt-4 space-y-3 [font-family:var(--font-outfit)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#231E1F]/50 dark:text-zinc-500 uppercase tracking-wide font-semibold">AI Analysis</span>
            <button onClick={() => setAnalysis(null)} className="text-[#231E1F]/40 hover:text-[#231E1F] transition-colors">
              <X className="size-4" />
            </button>
          </div>
          <p className="text-sm text-[#231E1F] dark:text-zinc-300 leading-relaxed">{analysis.summary}</p>
          {analysis.keyPoints.length > 0 && (
            <ul className="space-y-1">
              {analysis.keyPoints.map((pt, i) => (
                <li key={i} className="text-sm text-[#231E1F] flex gap-2">
                  <span className="text-amber-500 shrink-0">•</span>{pt}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${SENTIMENT_STYLES[analysis.sentiment] ?? SENTIMENT_STYLES.neutral}`}>
              {analysis.sentiment}
            </span>
            {analysis.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">#{tag}</span>
            ))}
          </div>
          {analysis.actionItems.length > 0 && (
            <ul className="space-y-1">
              {analysis.actionItems.map((item, i) => (
                <li key={i} className="text-sm text-[#231E1F] flex gap-2">
                  <span className="text-blue-500 shrink-0">→</span>{item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
