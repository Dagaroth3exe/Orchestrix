"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
  read: boolean;
}

function formatTimestamp(raw: string): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const typeIcons = {
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
  success: "✓",
};

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/Login"); return; }

      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setAlerts(data as Alert[]);
      setLoading(false);
    }
    init();
  }, [router]);

  const handleDismiss = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-2xl">
        <p className="text-[#231E1F]/50 [font-family:var(--font-outfit)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-amber-50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#231E1F]/10 flex items-center">
        <div className="flex-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold"
          >
            <ArrowLeft className="size-5" />
            Back to Dashboard
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl text-[#231E1F] font-semibold [font-family:var(--font-outfit)]">
            Alerts
          </h1>
          {unreadCount > 0 && (
            <p className="text-[#231E1F]/60 text-sm">
              {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex-1" />
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="size-16 text-[#231E1F]/20 mx-auto mb-4" />
              <p className="text-[#231E1F]/50 text-lg [font-family:var(--font-outfit)]">
                No alerts at this time
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl border-l-4 transition-all [font-family:var(--font-outfit)] bg-[#231E1F] border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{typeIcons[alert.type]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{alert.title}</h3>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                      <p className="text-gray-500 text-xs mt-2">{formatTimestamp(alert.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!alert.read && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="px-3 py-1 text-xs font-semibold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
