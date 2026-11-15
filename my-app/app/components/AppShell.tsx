"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CheckSquare,
  Disc3,
  ChevronDown,
  Home,
  LogOut,
  Moon,
  Music2,
  VolumeX,
  RotateCcw,
  Search,
  Sun,
  Timer,
  type LucideIcon,
} from "lucide-react";
import ShortBlackLogo from "@/app/Assets/Short black logo.png";
import { NoteMark } from "@/app/components/kit";
import { useDarkMode } from "@/app/context/DarkMode";
import { isPreview, supabase } from "@/lib/supabase";
import { resetPreviewData } from "@/lib/demoClient";
import { cn } from "@/lib/utils";
import { isSoundOn, setSoundOn, sfx, subscribeSound, unlockAudio } from "@/lib/sound";

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Notes", href: "/Notes", icon: BookOpen },
  { label: "Tasks", href: "/Tasks", icon: CheckSquare },
  { label: "Focus", href: "/Focus", icon: Timer },
  { label: "Alerts", href: "/Alerts", icon: Bell },
  { label: "Records", href: "/Records", icon: Disc3 },
];

type Profile = { name: string; email: string };
type Hit = { id: string; title: string; kind: "note" | "task" };

function useProfileAndAlerts(pathname: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const meta = session.user.user_metadata ?? {};
      setProfile({ name: meta.full_name ?? meta.name ?? "", email: session.user.email ?? "" });
      const { count } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
      if (!cancelled) setUnread(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  return { profile, unread };
}

function initials(p: Profile | null) {
  const src = p?.name || p?.email || "?";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Logo mark + optional wordmark. The coral note-head is the conductor's signature. */
export function Wordmark({ size = "md", showName = true }: { size?: "md" | "lg"; showName?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative">
        <Image
          src={ShortBlackLogo}
          alt=""
          height={size === "lg" ? 34 : 28}
          width={Math.round(((size === "lg" ? 34 : 28) * ShortBlackLogo.width) / ShortBlackLogo.height)}
          className="dark:invert"
        />
        <NoteMark className="absolute -top-1 -right-2.5 h-3.5 text-accent" />
      </span>
      {showName && (
        <span className={cn("ml-2 font-display font-semibold uppercase tracking-[0.28em] text-fg", size === "lg" ? "text-xl" : "text-[17px]")}>
          Orchestrix
        </span>
      )}
    </span>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Hit[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K / "/" to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const load = async () => {
    setOpen(true);
    if (items) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [n, t] = await Promise.all([
      supabase.from("notes").select("id, title").eq("user_id", session.user.id),
      supabase.from("tasks").select("id, title").eq("user_id", session.user.id),
    ]);
    setItems([
      ...(n.data ?? []).map((r) => ({ id: r.id, title: r.title, kind: "note" as const })),
      ...(t.data ?? []).map((r) => ({ id: r.id, title: r.title, kind: "task" as const })),
    ]);
  };

  const hits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !items) return [];
    return items.filter((i) => i.title.toLowerCase().includes(term)).slice(0, 7);
  }, [q, items]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    router.push(`${h.kind === "note" ? "/Notes" : "/Tasks"}?open=${h.id}`);
  };

  return (
    <div ref={boxRef} className="relative hidden w-44 xl:block 2xl:w-56">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
      <input
        ref={inputRef}
        value={q}
        onFocus={load}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && hits[active]) go(hits[active]);
          if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }}
        placeholder="Search notes & tasks"
        className="h-10 w-full rounded-xl border border-line bg-surface-2/70 pr-12 pl-10 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line px-1.5 font-mono text-[10px] text-subtle">
        ⌘K
      </kbd>
      <AnimatePresence>
        {open && q.trim() && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
            {hits.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted">{items ? "No matches" : "Loading…"}</li>
            ) : (
              hits.map((h, i) => (
                <li key={`${h.kind}-${h.id}`}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm",
                      i === active ? "bg-surface-2 text-fg" : "text-muted"
                    )}
                  >
                    {h.kind === "note" ? <BookOpen className="size-4 shrink-0" /> : <CheckSquare className="size-4 shrink-0" />}
                    <span className="truncate">{h.title}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-subtle">{h.kind}</span>
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggle } = useDarkMode();
  const { profile, unread } = useProfileAndAlerts(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/Login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const soundOn = useSyncExternalStore(subscribeSound, isSoundOn, () => true);

  // browsers only allow audio after a user gesture — unlock on the first one
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      {/* ── Top bar: three equal zones — brand | nav | actions ── */}
      <header className="relative z-30 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line bg-surface/[0.92] px-4 backdrop-blur-md md:px-6">
        {/* left: brand */}
        <Link href="/" aria-label="Orchestrix home" className="flex items-center gap-2.5 justify-self-start pl-1">
          <Wordmark />
          {isPreview && (
            <span className="hidden rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-accent 2xl:inline">
              preview
            </span>
          )}
        </Link>

        {/* centre: nav */}
        <nav className="hidden items-center gap-1 rounded-2xl bg-surface-2/70 p-1 md:flex">
          {NAV.map(({ label, href, icon: Icon }, i) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => sfx.navHover(i)}
                onClick={() => !isActive(href) && sfx.nav(i)}
                className={cn(
                  "relative flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors 2xl:px-4",
                  active ? "text-accent-ink" : "text-muted hover:text-fg"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative size-4" />
                <span className="relative">{label}</span>
                {href === "/Alerts" && unread > 0 && (
                  <span
                    className={cn(
                      "relative grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-semibold",
                      active ? "bg-accent-ink/15" : "bg-accent text-accent-ink"
                    )}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <span className="md:hidden" />

        {/* right: actions */}
        <div className="flex items-center gap-2 justify-self-end">
          <GlobalSearch />
          <button
            onClick={() => setSoundOn(!soundOn)}
            aria-label={soundOn ? "Mute navbar sounds" : "Turn navbar sounds on"}
            title={soundOn ? "Navbar sounds on" : "Navbar sounds off"}
            className={cn(
              "hidden size-10 place-items-center rounded-xl transition-colors hover:bg-surface-2 md:grid",
              soundOn ? "text-accent" : "text-muted hover:text-fg"
            )}
          >
            {soundOn ? <Music2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
          </button>
          <button
            onClick={(e) => toggle(e)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={dark ? "sun" : "moon"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Account"
              className="flex h-10 items-center gap-1 rounded-xl bg-surface-2 pr-2 pl-1 transition-colors hover:bg-surface-3"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-coral text-xs font-bold text-coral-fg">
                {initials(profile)}
              </span>
              <ChevronDown className={cn("size-4 text-muted transition-transform", menuOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute top-full right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
                >
                  <div className="p-4">
                    <p className="truncate font-semibold text-fg">{profile?.name || "Your account"}</p>
                    <p className="truncate text-xs text-muted">{profile?.email}</p>
                  </div>
                  {isPreview && (
                    <button
                      onClick={async () => {
                        if (!window.confirm("Reset all preview data to the sample set?")) return;
                        await supabase.auth.signOut();
                        resetPreviewData();
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      <RotateCcw className="size-4" />
                      Reset preview data
                    </button>
                  )}
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Content: fills the rest of the screen ── */}
      <main className="relative min-h-0 flex-1 overflow-hidden bg-surface/[0.9]">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* ── Mobile tab bar ── */}
      <nav className="flex items-center justify-around border-t border-line bg-surface/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-accent-ink" : "text-muted"
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-2xl bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative size-5" />
              <span className="relative">{label}</span>
              {href === "/Alerts" && unread > 0 && !active && (
                <span className="absolute top-1.5 right-[calc(50%-14px)] size-2 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
