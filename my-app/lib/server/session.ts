import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type SessionUser } from "@/lib/sessionToken";

/** Issue the session cookie: httpOnly (JS can't read it), Secure in production, SameSite=Lax. */
export async function startSession(user: SessionUser) {
  const token = await signSession(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function currentUser(): Promise<SessionUser | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/* ───────── best-effort login throttling (per server instance) ───────── */

const attempts = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function tooManyAttempts(key: string) {
  const a = attempts.get(key);
  return !!a && a.until > Date.now() && a.n >= MAX_ATTEMPTS;
}
export function recordFailure(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.until < now) attempts.set(key, { n: 1, until: now + WINDOW_MS });
  else a.n++;
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
