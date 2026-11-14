"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckSquare, Moon, Sun, Timer, type LucideIcon } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Wordmark } from "@/app/components/AppShell";
import { useDarkMode } from "@/app/context/DarkMode";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURES: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { icon: BookOpen, title: "Notes", text: "Capture ideas and get AI summaries.", tone: "bg-mint text-mint-fg" },
  { icon: CheckSquare, title: "Tasks", text: "Plan by day and priority.", tone: "bg-coral text-coral-fg" },
  { icon: Timer, title: "Focus", text: "Timed sessions with breaks.", tone: "bg-sky text-sky-fg" },
];

/** A line of display type that rises out of a mask. */
function RiseLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1, ease: EASE, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

export default function Landing() {
  const { dark, toggle } = useDarkMode();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSignedIn(!!data.session);
      } catch {
        // Supabase not configured / unreachable — still show the sign-in form
        setSignedIn(false);
      }
    })();
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      {/* Top bar — same edge-to-edge bar as the app */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/80 px-4 backdrop-blur-xl md:px-6">
        <Wordmark />
        <button
          onClick={(e) => toggle(e)}
          aria-label="Toggle theme"
          className="grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
      </header>

      {/* Hero — two balanced columns, vertically centred in the remaining screen */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto grid min-h-full w-full max-w-6xl content-center gap-8 px-5 py-10 md:px-8 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8">
          {/* Left (top): message */}
          <div className="lg:self-end">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-xl"
            >
              <span className="size-1.5 rounded-full bg-accent" />
              Your day, orchestrated
            </motion.p>

            <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.04em] text-fg">
              <RiseLine delay={0.1}>Conduct</RiseLine>
              <RiseLine delay={0.22}>
                your <span className="font-serif font-normal italic tracking-[-0.02em]">day</span>
                <span className="text-accent">.</span>
              </RiseLine>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
              className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg"
            >
              Notes, tasks, alerts and focus in one place, kept in time with each other like sections of an orchestra.
            </motion.p>

          </div>

          {/* Right: sign in — sits between message and features on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
            className="w-full max-w-md justify-self-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center lg:justify-self-end"
          >
            {signedIn ? (
              <div className="rounded-3xl border border-line bg-surface p-8 shadow-lift">
                <p className="text-sm text-muted">Welcome back</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-[-0.03em] text-fg">
                  Your day is ready<span className="text-accent">.</span>
                </p>
                <Link
                  href="/dashboard"
                  className="group mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
                >
                  Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  onClick={async () => { await supabase.auth.signOut(); setSignedIn(false); }}
                  className="mt-3 w-full text-center text-xs text-subtle hover:text-fg"
                >
                  Not you? Sign out
                </button>
              </div>
            ) : (
              <LoginForm />
            )}
          </motion.div>

          {/* Left (bottom): features */}
          <ul className="grid gap-3 self-start sm:grid-cols-3 lg:col-start-1 lg:row-start-2">
              {FEATURES.map(({ icon: Icon, title, text, tone }, i) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.08, duration: 0.6, ease: EASE }}
                  className={cn("rounded-2xl p-4", tone)}
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-black/10">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-3 font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-75">{text}</p>
                </motion.li>
              ))}
          </ul>

        </div>
      </main>
    </div>
  );
}
