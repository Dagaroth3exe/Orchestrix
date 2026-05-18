import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();

  const prompt = `Analyze the following note and return ONLY a valid JSON object with no markdown, no code fences — just raw JSON.

Fields required:
- summary: string (2-3 sentences)
- keyPoints: string[] (main ideas, empty array if none)
- tags: string[] (relevant topic tags, lowercase, no # symbol)
- sentiment: "positive" | "neutral" | "negative"
- actionItems: string[] (tasks or todos mentioned, empty array if none)

Note title: ${title || "Untitled"}
Note content:
${content || "(empty)"}`;

  let text: string;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    const data = await res.json();
    console.log("[analyze-note] status:", res.status, "body:", JSON.stringify(data).slice(0, 500));

    if (!res.ok) {
      const message = data?.error?.message ?? `Gemini error ${res.status}`;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  } catch (err) {
    console.error("[analyze-note] fetch error:", err);
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let analysis;
  try {
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    analysis = JSON.parse(clean);
  } catch {
    analysis = { summary: text, keyPoints: [], tags: [], sentiment: "neutral", actionItems: [] };
  }

  return NextResponse.json({ analysis });
}
