"use client";

/**
 * Browser-side data & auth client for Orchestrix.
 *
 * Talks to the app's own API (MongoDB on the server). Same call shape the
 * pages already use — `db.auth.*` and `db.from("notes").select()…` — but every
 * request is authorised by the httpOnly session cookie, and the server scopes
 * all data to the signed-in user.
 */

export type DbUser = { id: string; email: string; user_metadata: { full_name: string; name?: string } };
export type DbSession = { user: DbUser };
type Err = { message: string; code?: string } | null;
// rows are plain JSON objects shaped by the server's models (same loose typing the pages used before)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
/** Lists (`data.map(...)`) and single rows (`data.id`) share one loose type, as with the previous client. */
type Result = { data: (Row[] & Row) | null; error: Err; count: number | null };

let sessionCache: { at: number; value: DbSession | null } | null = null;
const SESSION_TTL = 15_000;

function toSession(u: { id: string; email: string; name: string } | null): DbSession | null {
  return u ? { user: { id: u.id, email: u.email, user_metadata: { full_name: u.name } } } : null;
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

const auth = {
  async getSession(): Promise<{ data: { session: DbSession | null }; error: Err }> {
    if (sessionCache && Date.now() - sessionCache.at < SESSION_TTL) return { data: { session: sessionCache.value }, error: null };
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
      const json = await res.json();
      const value = toSession(json.user ?? null);
      sessionCache = { at: Date.now(), value };
      return { data: { session: value }, error: null };
    } catch {
      return { data: { session: null }, error: { message: "Network error" } };
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { res, json } = await post("/api/auth/login", { email, password });
    if (!res.ok) return { data: { session: null }, error: { message: json.error ?? "Sign-in failed" } };
    const session = toSession(json.user);
    sessionCache = { at: Date.now(), value: session };
    return { data: { session }, error: null };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    const { res, json } = await post("/api/auth/register", { email, password, name: options?.data?.full_name ?? "" });
    if (!res.ok) return { data: { session: null }, error: { message: json.error ?? "Sign-up failed" } };
    const session = toSession(json.user);
    sessionCache = { at: Date.now(), value: session };
    return { data: { session }, error: null };
  },

  async signOut() {
    await post("/api/auth/logout", {});
    sessionCache = { at: Date.now(), value: null };
    return { error: null };
  },
};

/* ───────── query builder ───────── */

type Table = "notes" | "tasks" | "alerts";

class Query implements PromiseLike<Result> {
  private q: {
    op: "select" | "insert" | "update" | "delete";
    filters: { col: string; op: "eq" | "in"; value: unknown }[];
    order: { col: string; asc: boolean } | null;
    limit: number | null;
    single: boolean;
    head: boolean;
    count: boolean;
    payload?: Record<string, unknown>;
  } = { op: "select", filters: [], order: null, limit: null, single: false, head: false, count: false };

  constructor(private table: Table) {}

  select(_cols?: string, opts?: { count?: "exact"; head?: boolean }) {
    if (this.q.op === "select") {
      this.q.count = opts?.count === "exact";
      this.q.head = !!opts?.head;
    }
    return this;
  }
  insert(row: Record<string, unknown>) { this.q.op = "insert"; this.q.payload = row; return this; }
  update(values: Record<string, unknown>) { this.q.op = "update"; this.q.payload = values; return this; }
  delete() { this.q.op = "delete"; return this; }
  eq(col: string, value: unknown) { this.q.filters.push({ col, op: "eq", value }); return this; }
  in(col: string, value: unknown[]) { this.q.filters.push({ col, op: "in", value }); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.q.order = { col, asc: opts?.ascending ?? true }; return this; }
  limit(n: number) { this.q.limit = n; return this; }
  single() { this.q.single = true; return this; }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, fail);
  }

  private async run(): Promise<Result> {
    try {
      const { res, json } = await post(`/api/data/${this.table}`, this.q);
      if (res.status === 401) sessionCache = { at: Date.now(), value: null };
      return {
        data: json.data ?? null,
        error: json.error ?? (res.ok ? null : { message: `Request failed (${res.status})` }),
        count: json.count ?? null,
      };
    } catch {
      return { data: null, error: { message: "Network error — check your connection." }, count: null };
    }
  }
}

export const db = {
  auth,
  from: (table: Table) => new Query(table),
};
