import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { user_id, title, message, type } = body;

  if (!user_id || !title || !message) {
    return NextResponse.json({ error: "Missing required fields: user_id, title, message" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("alerts").insert({
    user_id,
    title,
    message,
    type: type ?? "info",
    timestamp: new Date().toISOString(),
    read: false,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data }, { status: 201 });
}
