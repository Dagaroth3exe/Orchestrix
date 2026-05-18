"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Note {
  title: string;
  content?: string;
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

export default function SmartNoteAnalyzer({ note }: { note: Note | null }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!note) return;
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not authenticated"); setLoading(false); return; }

    try {
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
        setError(json.error || "Analysis failed");
      } else {
        setAnalysis(json.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!note) return null;

  return (
    <div className="bg-white rounded-xl border border-[#231E1F]/10 p-4 [font-family:var(--font-outfit)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <span className="font-semibold text-[#231E1F] text-sm">AI Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {analysis && (
            <button onClick={() => setAnalysis(null)} className="text-[#231E1F]/40 hover:text-[#231E1F] transition-colors">
              <X className="size-4" />
            </button>
          )}
          <button
            onClick={analyze}
            disabled={loading}
            className="px-3 py-1.5 bg-[#231E1F] text-amber-50 rounded-lg text-xs font-semibold hover:bg-[#231E1F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {analysis && (
        <div className="space-y-3 mt-2">
          <div>
            <p className="text-xs text-[#231E1F]/50 uppercase tracking-wide font-semibold mb-1">Summary</p>
            <p className="text-sm text-[#231E1F] leading-relaxed">{analysis.summary}</p>
          </div>

          {analysis.keyPoints.length > 0 && (
            <div>
              <p className="text-xs text-[#231E1F]/50 uppercase tracking-wide font-semibold mb-1">Key Points</p>
              <ul className="space-y-1">
                {analysis.keyPoints.map((pt, i) => (
                  <li key={i} className="text-sm text-[#231E1F] flex gap-2">
                    <span className="text-amber-500 shrink-0">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${SENTIMENT_STYLES[analysis.sentiment] ?? SENTIMENT_STYLES.neutral}`}>
              {analysis.sentiment}
            </span>
            {analysis.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                #{tag}
              </span>
            ))}
          </div>

          {analysis.actionItems.length > 0 && (
            <div>
              <p className="text-xs text-[#231E1F]/50 uppercase tracking-wide font-semibold mb-1">Action Items</p>
              <ul className="space-y-1">
                {analysis.actionItems.map((item, i) => (
                  <li key={i} className="text-sm text-[#231E1F] flex gap-2">
                    <span className="text-blue-500 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
