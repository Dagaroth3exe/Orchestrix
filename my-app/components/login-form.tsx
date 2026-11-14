"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { inputClass } from "@/app/components/kit";
import { isPreview, supabase } from "@/lib/supabase";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demoClient";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(
            error.message.toLowerCase().includes("email not confirmed")
              ? "Please confirm your email — check your inbox for a verification link."
              : error.message
          );
          return;
        }
        router.push("/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) { setError(error.message); return; }
      if (!data.session) {
        setInfo("Almost there — check your inbox to confirm your email, then sign in.");
        setMode("login");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("Missing NEXT_PUBLIC_SUPABASE")
          ? "Sign-in isn't configured yet: add your Supabase URL and anon key to .env.local and restart the dev server."
          : msg.toLowerCase().includes("fetch")
            ? "Couldn't reach the server. Check your connection and Supabase URL, then try again."
            : msg
      );
    } finally {
      setBusy(false);
    }
  }

  const field = cn(inputClass, "h-12");

  return (
    <div className={cn("rounded-3xl border border-line bg-surface p-6 shadow-lift md:p-8", className)}>
      {/* Mode switch */}
      <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-surface-2 p-1">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              "relative rounded-lg py-2 text-sm font-medium transition-colors",
              mode === m ? "text-ink-fg" : "text-muted hover:text-fg"
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="auth-pill"
                className="absolute inset-0 rounded-lg bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{m === "login" ? "Sign in" : "Create account"}</span>
          </button>
        ))}
      </div>

      {isPreview && mode === "login" && (
        <div className="mb-5 rounded-xl border border-dashed border-accent/40 bg-accent-soft p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">preview mode</p>
          <p className="mt-1.5 text-sm text-fg">
            Sign in with <span className="font-medium">{DEMO_EMAIL}</span> / <span className="font-medium">{DEMO_PASSWORD}</span>, or create any account. Data stays in this browser.
          </p>
          <button
            type="button"
            onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(""); }}
            className="mt-3 text-xs font-semibold text-accent underline-offset-4 hover:underline"
          >
            Fill in demo login →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <AnimatePresence initial={false}>
          {mode === "register" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <label className="block pb-0.5">
                <span className="sr-only">Name</span>
                <input
                  className={field}
                  placeholder="Your name"
                  autoComplete="name"
                  required={mode === "register"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <label className="block">
          <span className="sr-only">Email</span>
          <input
            className={field}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="sr-only">Password</span>
          <input
            className={field}
            type="password"
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</p>}
        {info && <p className="rounded-xl bg-success-soft px-4 py-2.5 text-sm text-success">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-all hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "login" ? "Enter your day" : "Create my account"}
          {!busy && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-subtle">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="font-medium text-fg underline-offset-4 hover:underline"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
