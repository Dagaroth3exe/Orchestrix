/**
 * Preview-mode backend.
 *
 * A tiny in-browser stand-in for the subset of the Supabase client this app
 * uses (auth + simple table queries). Data lives in localStorage, so the whole
 * UI can be tried without a Supabase project. Never used when real Supabase
 * env vars are configured (see lib/supabase.ts).
 */

export const DEMO_EMAIL = "demo@orchestrix.app";
export const DEMO_PASSWORD = "demo1234";

const KEY = "orchestrix-preview-db";
const LATENCY = 180;

type Row = Record<string, unknown> & { id: string };
type DemoUser = { id: string; email: string; password: string; full_name: string };
type DemoSession = {
  access_token: string;
  token_type: "bearer";
  user: { id: string; email: string; user_metadata: { full_name: string } };
};
type DB = {
  users: DemoUser[];
  session: DemoSession | null;
  notes: Row[];
  tasks: Row[];
  alerts: Row[];
};
type Table = "notes" | "tasks" | "alerts";
type AuthEvent = "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT";
type Listener = (event: AuthEvent, session: DemoSession | null) => void;

const wait = () => new Promise((r) => setTimeout(r, LATENCY));
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ───────── seed data ───────── */

function seedFor(userId: string): Pick<DB, "notes" | "tasks" | "alerts"> {
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60000).toISOString();
  const day = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const base = { user_id: userId };

  return {
    notes: [
      {
        ...base, id: uid(), title: "Morning pages",
        content: "Slept well. Want to keep the afternoon free for deep work on the quarterly review.\n\nOn my mind:\n- the launch timeline\n- calling mum on Sunday\n- book the dentist",
        preview: "Slept well. Want to keep the afternoon free for deep work on the quarterly review.",
        created_at: ago(30), updated_at: ago(12),
      },
      {
        ...base, id: uid(), title: "Book notes — Deep Work",
        content: "Attention residue is real: switching tasks leaves part of your mind behind.\n\nIdeas to try:\n- batch shallow work into two blocks a day\n- schedule every minute of the workday\n- embrace boredom instead of reaching for the phone",
        preview: "Attention residue is real: switching tasks leaves part of your mind behind.",
        created_at: ago(400), updated_at: ago(180),
      },
      {
        ...base, id: uid(), title: "Product sync",
        content: "Decided to cut scope on v2 export. Priya owns the API, I own the onboarding copy. Next check-in Thursday.",
        preview: "Decided to cut scope on v2 export. Priya owns the API, I own the onboarding copy.",
        created_at: ago(5000), updated_at: ago(4300),
      },
      {
        ...base, id: uid(), title: "Gift ideas",
        content: "Ceramic mug, a small plant, that jazz record from the market.",
        preview: "Ceramic mug, a small plant, that jazz record from the market.",
        created_at: ago(9000), updated_at: ago(8600),
      },
    ],
    tasks: [
      { ...base, id: uid(), title: "Outline quarterly review", description: "Three sections: wins, misses, next bets. Keep it to one page.", priority: "high", due_date: day(0), completed: false, created_at: ago(5) },
      { ...base, id: uid(), title: "Reply to design feedback", description: "", priority: "medium", due_date: day(-1), completed: false, created_at: ago(60) },
      { ...base, id: uid(), title: "Book dentist appointment", description: "", priority: "low", due_date: day(2), completed: false, created_at: ago(300) },
      { ...base, id: uid(), title: "Refactor auth flow", description: "Move session logic into a hook and add tests.", priority: "medium", due_date: day(5), completed: false, created_at: ago(900) },
      { ...base, id: uid(), title: "Ship onboarding copy", description: "", priority: "high", due_date: day(-2), completed: true, created_at: ago(3000) },
    ],
    alerts: [
      { ...base, id: uid(), title: "Task due today", message: "“Outline quarterly review” is due today.", type: "warning", timestamp: ago(25), read: false, created_at: ago(25) },
      { ...base, id: uid(), title: "Focus streak", message: "You completed 3 focus sessions yesterday. Nice rhythm.", type: "success", timestamp: ago(900), read: false, created_at: ago(900) },
      { ...base, id: uid(), title: "Welcome to the preview", message: "Everything here is saved in this browser only — feel free to break things.", type: "info", timestamp: ago(3000), read: true, created_at: ago(3000) },
    ],
  };
}

/* ───────── storage ───────── */

function fresh(): DB {
  const demoId = "demo-user";
  return {
    users: [{ id: demoId, email: DEMO_EMAIL, password: DEMO_PASSWORD, full_name: "Alex Morgan" }],
    session: null,
    ...seedFor(demoId),
  };
}

function load(): DB {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* fall through to a fresh DB */
  }
  const db = fresh();
  save(db);
  return db;
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full / blocked — keep going in memory */
  }
}

export function resetPreviewData() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* ───────── auth ───────── */

const listeners = new Set<Listener>();
const emit = (event: AuthEvent, session: DemoSession | null) => listeners.forEach((l) => l(event, session));

const toSession = (u: DemoUser): DemoSession => ({
  access_token: `preview-${u.id}`,
  token_type: "bearer",
  user: { id: u.id, email: u.email, user_metadata: { full_name: u.full_name } },
});

const auth = {
  async getSession() {
    return { data: { session: load().session }, error: null };
  },
  async getUser() {
    return { data: { user: load().session?.user ?? null }, error: null };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    await wait();
    const db = load();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return { data: { session: null, user: null }, error: { message: "Invalid login credentials" } };
    }
    db.session = toSession(user);
    save(db);
    emit("SIGNED_IN", db.session);
    return { data: { session: db.session, user: db.session.user }, error: null };
  },
  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: { full_name?: string } };
  }) {
    await wait();
    const db = load();
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { data: { session: null, user: null }, error: { message: "User already registered" } };
    }
    const user: DemoUser = { id: uid(), email: email.trim(), password, full_name: options?.data?.full_name ?? "" };
    db.users.push(user);
    const seed = seedFor(user.id);
    db.notes.push(...seed.notes);
    db.tasks.push(...seed.tasks);
    db.alerts.push(...seed.alerts);
    db.session = toSession(user);
    save(db);
    emit("SIGNED_IN", db.session);
    return { data: { session: db.session, user: db.session.user }, error: null };
  },
  async signOut() {
    const db = load();
    db.session = null;
    save(db);
    emit("SIGNED_OUT", null);
    return { error: null };
  },
  onAuthStateChange(cb: Listener) {
    listeners.add(cb);
    setTimeout(() => cb("INITIAL_SESSION", load().session), 0);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};

/* ───────── queries ───────── */

type Result = { data: unknown; error: { message: string; code?: string } | null; count: number | null };

class Query implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private payload: Record<string, unknown> = {};
  private filters: ((r: Row) => boolean)[] = [];
  private sort: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private one = false;
  private head = false;

  constructor(private table: Table) {}

  select(_cols?: string, opts?: { count?: "exact"; head?: boolean }) {
    if (this.op === "select") this.head = !!opts?.head;
    return this;
  }
  insert(row: Record<string, unknown>) { this.op = "insert"; this.payload = row; return this; }
  update(values: Record<string, unknown>) { this.op = "update"; this.payload = values; return this; }
  delete() { this.op = "delete"; return this; }
  eq(col: string, val: unknown) { this.filters.push((r) => r[col] === val); return this; }
  in(col: string, vals: unknown[]) { this.filters.push((r) => vals.includes(r[col])); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.sort = { col, asc: opts?.ascending ?? true }; return this; }
  limit(n: number) { this.max = n; return this; }
  single() { this.one = true; return this; }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, fail);
  }

  private async run(): Promise<Result> {
    await wait();
    const db = load();
    const rows = db[this.table];
    const match = (r: Row) => this.filters.every((f) => f(r));

    if (this.op === "insert") {
      const now = new Date().toISOString();
      const row: Row = { created_at: now, updated_at: now, ...this.payload, id: uid() };
      rows.unshift(row);
      save(db);
      return { data: this.one ? row : [row], error: null, count: null };
    }

    if (this.op === "update") {
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, this.payload));
      save(db);
      return { data: this.one ? hit[0] ?? null : hit, error: null, count: null };
    }

    if (this.op === "delete") {
      db[this.table] = rows.filter((r) => !match(r));
      save(db);
      return { data: null, error: null, count: null };
    }

    let out = rows.filter(match);
    const count = out.length;
    if (this.sort) {
      const { col, asc } = this.sort;
      out = [...out].sort((a, b) => {
        const x = String(a[col] ?? "");
        const y = String(b[col] ?? "");
        return asc ? x.localeCompare(y) : y.localeCompare(x);
      });
    }
    if (this.max !== null) out = out.slice(0, this.max);
    if (this.head) return { data: null, error: null, count };
    if (this.one) return { data: out[0] ?? null, error: out[0] ? null : { message: "Row not found" }, count };
    return { data: out.map((r) => ({ ...r })), error: null, count };
  }
}

export const demoClient = {
  auth,
  from: (table: Table) => new Query(table),
};
