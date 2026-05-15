import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { user_id, title, content } = body;

  if (!user_id || !title) {
    return NextResponse.json({ error: "Missing required fields: user_id, title" }, { status: 400 });
  }

  const preview = (content ?? "").slice(0, 150);

  const { data, error } = await supabaseAdmin.from("notes").insert({
    user_id,
    title,
    content: content ?? "",
    preview,
    updated_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
