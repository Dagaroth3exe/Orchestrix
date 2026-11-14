"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Wordmark } from "@/app/components/AppShell";
import { useDarkMode } from "@/app/context/DarkMode";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const MOVEMENTS = [
  { n: "I", verb: "compose · notes", line: "Write the themes down.", tone: "bg-mint text-mint-fg" },
  { n: "II", verb: "arrange · tasks", line: "Give every part its bar.", tone: "bg-coral text-coral-fg" },
  { n: "III", verb: "perform · focus", line: "Play it through.", tone: "bg-sky text-sky-fg" },
];

/** A line of display type that rises out of a mask. */
function RiseLine({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className={cn("block", className)}
        initial={{ y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
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
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-[1400px] flex-col px-5 py-5 md:px-10 md:py-7">
        {/* Top bar */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex items-center justify-between"
        >
          <Wordmark size="lg" />
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-subtle sm:block">
              your day, orchestrated
            </span>
            <button
              onClick={(e) => toggle(e)}
              aria-label="Toggle theme"
              className="grid size-10 place-items-center rounded-full border border-line bg-glass text-muted backdrop-blur-xl hover:text-fg"
            >
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          </div>
        </motion.header>

        {/* Hero */}
        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:py-6">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-glass px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted backdrop-blur-xl"
            >
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative size-2 rounded-full bg-accent" />
              </span>
              every part in its place
            </motion.p>

            <h1 className="font-display text-[clamp(3.4rem,9.5vw,8.5rem)] leading-[0.9] font-bold tracking-[-0.045em] text-fg">
              <RiseLine delay={0.15}>conduct</RiseLine>
              <RiseLine delay={0.3}>
                your <span className="font-serif font-normal italic tracking-[-0.03em]">day</span>
                <motion.span
                  className="inline-block text-accent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14, delay: 1.05 }}
                >
                  .
                </motion.span>
              </RiseLine>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.8, ease: EASE }}
              className="mt-7 max-w-md text-lg leading-relaxed text-muted"
            >
              Orchestrix keeps your notes, tasks, cues and focus in time with each other, like sections of an orchestra following one score.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: EASE }}
            className="w-full max-w-md justify-self-center lg:justify-self-end"
          >
            {signedIn ? (
              <div className="rounded-[32px] border border-line bg-surface/95 p-8 shadow-lift backdrop-blur-xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">welcome back</p>
                <p className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-fg">
                  The orchestra is tuned<span className="text-accent">.</span>
                </p>
                <Link
                  href="/dashboard"
                  className="group mt-8 flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
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
        </section>

        {/* Three movements */}
        <section className="grid gap-3 sm:grid-cols-3">
          {MOVEMENTS.map((m, i) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.8, ease: EASE }}
              whileHover={{ y: -6, rotate: i === 1 ? 0 : i === 0 ? -1 : 1 }}
              className={cn("flex min-h-36 flex-col justify-between rounded-[28px] p-6", m.tone)}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70">
                <span className="font-serif text-sm normal-case italic">{m.n}.</span> {m.verb}
              </p>
              <p className="mt-8 font-display text-2xl font-bold tracking-[-0.02em] md:text-3xl">{m.line}</p>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
}
