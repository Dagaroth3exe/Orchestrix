"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Btn, EmptyState, ErrorBanner, LoadingState, PageHeader } from "@/app/components/kit";
import { supabase } from "@/lib/supabase";
import { formatRelative } from "@/lib/format";
import type { Alert } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE = {
  info: { icon: Info, tone: "bg-info-soft text-info" },
  warning: { icon: AlertTriangle, tone: "bg-warn-soft text-warn" },
  error: { icon: XCircle, tone: "bg-danger-soft text-danger" },
  success: { icon: CheckCircle2, tone: "bg-success-soft text-success" },
} as const;

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/Login"); return; }

      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) setError(error.message);
      else if (data) setAlerts(data as Alert[]);
      setLoading(false);
    }
    init();
  }, [router]);

  const handleDismiss = async (id: string) => {
    const prev = alerts;
    setAlerts((a) => a.filter((x) => x.id !== id));
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (error) { setAlerts(prev); setError(`Couldn't dismiss: ${error.message}`); }
  };

  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    setAlerts((a) => a.map((x) => (ids.includes(x.id) ? { ...x, read: true } : x)));
    const { error } = await supabase.from("alerts").update({ read: true }).in("id", ids);
    if (error) setError(`Couldn't update: ${error.message}`);
  };

  const unread = alerts.filter((a) => !a.read);
  const visible = filter === "unread" ? unread : alerts;

  if (loading) return <LoadingState label="Loading alerts…" />;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Alerts"
        description={unread.length ? `${unread.length} unread` : "All caught up"}
        actions={
          unread.length > 0 && (
            <Btn variant="soft" onClick={() => markRead(unread.map((a) => a.id))}>
              <CheckCheck /> Mark all read
            </Btn>
          )
        }
      />
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="px-5 pt-5 md:px-8">
        <div className="inline-flex rounded-full bg-surface-2 p-1">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f ? "text-ink-fg" : "text-muted hover:text-fg"
              )}
            >
              {filter === f && (
                <motion.span layoutId="alert-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">
                {f}
                {f === "unread" && unread.length > 0 && ` · ${unread.length}`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 md:px-8">
        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === "unread" ? "Nothing unread" : "No alerts"}
            hint="We'll let you know when something needs you."
          />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {visible.map((alert, i) => {
                const t = TYPE[alert.type] ?? TYPE.info;
                const Icon = t.icon;
                return (
                  <motion.li
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.3) } }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                    className={cn(
                      "group flex items-start gap-4 rounded-2xl border border-line p-4 transition-colors",
                      alert.read ? "bg-transparent" : "bg-surface-2/60"
                    )}
                  >
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", t.tone)}>
                      <Icon className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("truncate font-semibold", alert.read ? "text-muted" : "text-fg")}>{alert.title}</h3>
                        {!alert.read && <span className="size-2 shrink-0 rounded-full bg-accent" />}
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{alert.message}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
                          {formatRelative(alert.timestamp)}
                        </span>
                        {!alert.read && (
                          <button onClick={() => markRead([alert.id])} className="text-xs font-medium text-accent hover:underline">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      aria-label="Dismiss"
                      className="grid size-8 shrink-0 place-items-center rounded-full text-subtle opacity-60 transition-all hover:bg-surface-3 hover:text-fg group-hover:opacity-100"
                    >
                      <X className="size-4" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
