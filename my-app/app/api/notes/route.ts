import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/server/mongo";
import { User, Note } from "@/lib/server/models";

/** n8n webhook: requires the x-api-key header to match N8N_API_KEY. */
export async function POST(req: NextRequest) {
  const key = process.env.N8N_API_KEY;
  if (!key || req.headers.get("x-api-key") !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { user_id, title, content } = body;
  if (!user_id || !title) {
    return NextResponse.json({ error: "Missing required fields: user_id, title" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(String(user_id))) {
    return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
  }

  try {
    await connectDB();
    if (!(await User.exists({ _id: user_id }))) {
      return NextResponse.json({ error: "Unknown user_id" }, { status: 404 });
    }
    const created = await Note.create({ user_id, title, content: content ?? "", preview: String(content ?? "").slice(0, 150), updated_at: new Date() });
    return NextResponse.json({ note: created.toJSON() }, { status: 201 });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    if (e.name === "ValidationError") return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[api/notes]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
