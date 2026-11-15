"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ListTodo,
  Plus,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Btn, LoadingState, PageHeader, priorityStyles } from "@/app/components/kit";
import { supabase } from "@/lib/supabase";
import { daysUntil, formatRelative, greeting } from "@/lib/format";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

type NoteRow = { id: string; title: string; preview: string; updatedAt: string };

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1); // index into the 7-day strip (0 = today)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/Login"); return; }
      const id = session.user.id;
      setUid(id);
      const meta = session.user.user_metadata ?? {};
      setName((meta.full_name ?? meta.name ?? "").split(" ")[0]);

      const [t, n, a] = await Promise.all([
        supabase.from("tasks").select("id, title, description, priority, due_date, completed").eq("user_id", id),
        supabase
          .from("notes")
          .select("id, title, preview, updated_at", { count: "exact" })
          .eq("user_id", id)
          .order("updated_at", { ascending: false })
          .limit(4),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", id).eq("read", false),
      ]);
      setTasks(
        (t.data ?? []).map((r) => ({
          id: r.id, title: r.title, description: r.description ?? "", priority: r.priority, dueDate: r.due_date, completed: r.completed,
        }))
      );
      setNotes((n.data ?? []).map((r) => ({ id: r.id, title: r.title, preview: r.preview, updatedAt: formatRelative(r.updated_at) })));
      setNoteCount(n.count ?? 0);
      setUnread(a.count ?? 0);
      setLoading(false);
    })();
  }, [router]);

  const today = useMemo(
    () =>
      tasks
        .filter((t) => {
          const n = daysUntil(t.dueDate);
          return n !== null && (n === 0 || (n < 0 && !t.completed));
        })
        .sort((a, b) => Number(a.completed) - Number(b.completed)),
    [tasks]
  );
  const open = tasks.filter((t) => !t.completed);
  const overdue = open.filter((t) => (daysUntil(t.dueDate) ?? 0) < 0).length;
  const week = Array.from({ length: 7 }, (_, i) => addDays(i));
  const dayTasks = tasks
    .filter((t) => t.dueDate === isoDay(week[selectedDay]))
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const rhythm = useMemo(() => {
    const bars = Array.from({ length: 7 }, (_, i) => addDays(i - 6)).map((d) => {
      const due = tasks.filter((t) => t.dueDate === isoDay(d));
      const done = due.filter((t) => t.completed).length;
      return { d, pct: due.length ? Math.round((done / due.length) * 100) : null };
    });
    const scored = bars.filter((b) => b.pct !== null);
    const avg = scored.length ? Math.round(scored.reduce((a, b) => a + (b.pct ?? 0), 0) / scored.length) : 0;
    return { bars, avg };
  }, [tasks]);

  const toggle = async (task: Task) => {
    setTasks((p) => p.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", task.id);
    if (error) setTasks((p) => p.map((t) => (t.id === task.id ? task : t)));
  };

  const addTask = async (title: string, day: Date) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: uid, title, description: "", priority: "medium", due_date: isoDay(day), completed: false })
      .select()
      .single();
    if (!error && data) {
      setTasks((p) => [{ id: data.id, title: data.title, description: "", priority: data.priority, dueDate: data.due_date, completed: false }, ...p]);
    }
  };

  const newNote = async () => {
    const { data } = await supabase
      .from("notes")
      .insert({ user_id: uid, title: "Untitled note", preview: "", content: "" })
      .select()
      .single();
    if (data) router.push(`/Notes?open=${data.id}`);
  };

  if (loading) return <LoadingState label="Tuning up…" />;

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow={dateLabel}
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        actions={
          <>
            <Btn variant="soft" onClick={newNote}>
              <BookOpen /> New note
            </Btn>
            <Btn variant="accent" onClick={() => router.push("/Tasks")}>
              <Plus /> New task
            </Btn>
          </>
        }
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-5 md:p-8">
        {/* Row 1 — four equal stat tiles */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat i={0} href="/Tasks" icon={Sun} label="Due today" value={today.filter((t) => !t.completed).length}
            caption={overdue ? `${overdue} overdue` : "Nothing overdue"} tone="bg-coral text-coral-fg" />
          <Stat i={1} href="/Tasks" icon={ListTodo} label="Open tasks" value={open.length}
            caption={`${tasks.length - open.length} completed`} tone="bg-butter text-butter-fg" />
          <Stat i={2} href="/Notes" icon={BookOpen} label="Notes" value={noteCount}
            caption={notes[0] ? `Last edited ${notes[0].updatedAt}` : "No notes yet"} tone="bg-mint text-mint-fg" />
          <Stat i={3} href="/Alerts" icon={Bell} label="Unread alerts" value={unread}
            caption={unread ? "Needs your attention" : "All caught up"} tone="bg-sky text-sky-fg" />
        </div>

        {/* Row 2 — Today | This week (same height, same rows) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            i={4}
            icon={Sun}
            title="Today"
            meta={`${today.filter((t) => t.completed).length} of ${today.length} done`}
            onAdd={(t) => addTask(t, addDays(0))}
          >
            <TaskList tasks={today} onToggle={toggle} empty="Nothing due today. Enjoy the quiet." />
          </Card>

          <Card
            i={5}
            icon={CalendarDays}
            title="This week"
            meta={week[selectedDay].toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            onAdd={(t) => addTask(t, week[selectedDay])}
          >
            <div className="grid grid-cols-7 gap-1 px-4 pb-3">
              {week.map((d, i) => {
                const has = tasks.some((t) => t.dueDate === isoDay(d) && !t.completed);
                const active = i === selectedDay;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-xl py-2 transition-colors",
                      active ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg"
                    )}
                  >
                    <span className="text-[11px]">{i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className="font-display text-base font-semibold">{d.getDate()}</span>
                    <span className={cn("size-1 rounded-full", has ? (active ? "bg-bg" : "bg-accent") : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
            <TaskList tasks={dayTasks} onToggle={toggle} empty="Nothing scheduled for this day." />
          </Card>
        </div>

        {/* Row 3 — Recent notes | Weekly rhythm (same height) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card i={6} icon={BookOpen} title="Recent notes" meta={`${noteCount} total`} href="/Notes">
            {notes.length === 0 ? (
              <Empty text="No notes yet." />
            ) : (
              <ul className="px-2 pb-2">
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link href={`/Notes?open=${n.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mint/20 text-mint">
                        <BookOpen className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{n.title}</span>
                        <span className="block truncate text-xs text-muted">{n.preview || "Empty note"}</span>
                      </span>
                      <span className="shrink-0 text-xs text-subtle">{n.updatedAt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card i={7} icon={ListTodo} title="Weekly rhythm" meta={`${rhythm.avg}% average completion`}>
            <div className="flex h-[13.5rem] items-end gap-2 px-5 pb-5">
              {rhythm.bars.map((b, i) => {
                const isToday = i === 6;
                return (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[11px] text-subtle tabular-nums">{b.pct === null ? "–" : `${b.pct}%`}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${b.pct === null ? 4 : Math.max(8, b.pct)}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.7, ease: EASE }}
                      className={cn("w-full max-w-12 rounded-lg", isToday ? "bg-accent" : b.pct === null ? "bg-surface-2" : "bg-surface-3")}
                    />
                    <span className={cn("text-xs", isToday ? "font-semibold text-accent" : "text-muted")}>
                      {b.d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── building blocks ───────────────────────── */

function Stat({
  i, href, icon: Icon, label, value, caption, tone,
}: {
  i: number; href: string; icon: LucideIcon; label: string; value: number; caption: string; tone: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: EASE }}>
      <Link href={href} className={cn("group flex h-36 flex-col justify-between rounded-2xl p-5 transition-transform hover:-translate-y-0.5", tone)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-80">{label}</span>
          <span className="grid size-8 place-items-center rounded-lg bg-black/10">
            <Icon className="size-4" />
          </span>
        </div>
        <div>
          <p className="font-display text-5xl leading-none font-semibold tabular-nums">{value}</p>
          <p className="mt-1.5 truncate text-xs opacity-70">{caption}</p>
        </div>
      </Link>
    </motion.div>
  );
}

/** Every dashboard card shares this frame: header row (icon · title · meta · action), then content. */
function Card({
  i, icon: Icon, title, meta, onAdd, href, children,
}: {
  i: number; icon: LucideIcon; title: string; meta?: string; onAdd?: (title: string) => void; href?: string; children: React.ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.5, ease: EASE }}
      className="flex h-[22rem] flex-col overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <header className="flex h-16 shrink-0 items-center gap-3 px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-muted">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
          {meta && <p className="truncate text-xs text-muted">{meta}</p>}
        </div>
        {onAdd && (
          <Btn variant="ghost" size="icon" onClick={() => setAdding(true)} aria-label={`Add task to ${title}`}>
            <Plus />
          </Btn>
        )}
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            View all <ArrowRight className="size-3.5" />
          </Link>
        )}
      </header>
      <AnimatePresence>
        {adding && onAdd && <QuickAdd onAdd={onAdd} onClose={() => setAdding(false)} />}
      </AnimatePresence>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </motion.section>
  );
}

function QuickAdd({ onAdd, onClose }: { onAdd: (t: string) => void; onClose: () => void }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onAdd(v.trim());
        setV("");
        onClose();
      }}
      className="shrink-0 overflow-hidden px-4"
    >
      <input
        ref={ref}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => !v && onClose()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        placeholder="New task — press Enter to add"
        className="mb-3 h-10 w-full rounded-xl border border-accent bg-surface-2 px-3.5 text-sm text-fg placeholder:text-subtle focus:outline-none"
      />
    </motion.form>
  );
}

function TaskList({ tasks, onToggle, empty }: { tasks: Task[]; onToggle: (t: Task) => void; empty: string }) {
  if (tasks.length === 0) return <Empty text={empty} />;
  return (
    <ul className="px-2 pb-2">
      <AnimatePresence initial={false}>
        {tasks.map((t) => {
          const late = !t.completed && (daysUntil(t.dueDate) ?? 0) < 0;
          const p = priorityStyles[t.priority];
          return (
            <motion.li key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2">
                <button
                  onClick={() => onToggle(t)}
                  aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] transition-colors",
                    t.completed ? "border-success bg-success text-surface" : "border-line-strong hover:border-accent"
                  )}
                >
                  {t.completed && <Check className="size-3" strokeWidth={3} />}
                </button>
                <Link href={`/Tasks?open=${t.id}`} className={cn("min-w-0 flex-1 truncate text-sm", t.completed ? "text-subtle line-through" : "text-fg")}>
                  {t.title}
                </Link>
                {late && <span className="shrink-0 rounded-md bg-danger-soft px-1.5 py-0.5 text-[11px] font-medium text-danger">Overdue</span>}
                <span className={cn("flex w-16 shrink-0 items-center justify-end gap-1.5 text-xs text-muted")}>
                  <span className={cn("size-1.5 rounded-full", p.dot)} />
                  {p.label}
                </span>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-1 px-6 text-center">
      <span className="font-serif text-2xl text-subtle italic" aria-hidden>𝄽</span>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
