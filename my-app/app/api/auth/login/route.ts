import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/server/mongo";
import { User } from "@/lib/server/models";
import { clearFailures, recordFailure, startSession, tooManyAttempts } from "@/lib/server/session";

// compared against when the email doesn't exist, so both cases take the same time
const DUMMY_HASH = bcrypt.hashSync("orchestrix-timing-equaliser", 12);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}:${email}`;

  if (!email || !password) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  try {
    await connectDB();
    const user = (await User.findOne({ email }).lean()) as { _id: unknown; email: string; full_name?: string; password_hash: string } | null;
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) {
      recordFailure(key);
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    clearFailures(key);
    const session = { id: String(user._id), email: user.email, name: user.full_name ?? "" };
    await startSession(session);
    return NextResponse.json({ user: session });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Couldn't sign in right now. Please try again." }, { status: 500 });
  }
}
