import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/server/mongo";
import { User } from "@/lib/server/models";
import { startSession } from "@/lib/server/session";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim().slice(0, 120);

  if (!EMAIL.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: "Password is too long." }, { status: 400 });

  try {
    await connectDB();
    if (await User.exists({ email })) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user = (await User.create({ email, password_hash, full_name: name })) as unknown as { _id: unknown; email: string; full_name: string };
    const session = { id: String(user._id), email: user.email, name: user.full_name };
    await startSession(session);
    return NextResponse.json({ user: session }, { status: 201 });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Couldn't create the account. Please try again." }, { status: 500 });
  }
}
