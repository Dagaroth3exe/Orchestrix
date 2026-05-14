"use client";

import Image from "next/image";
import { BookOpen, CheckSquare, Bell, Clock, User, ArrowRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ShortBlackLogo from "@/app/Assets/Short black logo.png";
import NoteCard from "@/app/components/NoteCard";
import TaskCard from "@/app/components/TaskCard";
import { supabase } from "@/lib/supabase";

interface RecentNote {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

interface RecentTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/Login");
  };

  useEffect(() => {
    async function fetchRecent() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserEmail(session.user.email ?? "");
      setUserName(session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "");

      const [notesRes, tasksRes] = await Promise.all([
        supabase.from("notes").select("id, title, preview, updated_at").eq("user_id", session.user.id).order("updated_at", { ascending: false }).limit(3),
        supabase.from("tasks").select("id, title, description, priority, due_date").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      if (notesRes.data) {
        setRecentNotes(notesRes.data.map((r) => ({
          id: r.id,
          title: r.title,
          preview: r.preview,
          updatedAt: formatRelative(r.updated_at),
        })));
      }

      if (tasksRes.data) {
        setRecentTasks(tasksRes.data.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          priority: r.priority,
          dueDate: r.due_date,
        })));
      }
    }
    fetchRecent();
  }, []);

  const navButtons = [
    { icon: BookOpen, label: "Notes" },
    { icon: CheckSquare, label: "Tasks" },
    { icon: Bell, label: "Alerts" },
    { icon: Clock, label: "Focus" },
  ];

  return (
    <div className="w-full h-full">
      <div className="Main bg-amber-50/80 h-full w-full rounded-2xl p-3 flex flex-col md:flex-row gap-3">

        {/* Sidebar — desktop only */}
        <div className="hidden md:flex h-full w-[7%] flex-col items-center justify-start pt-2 px-2">
          <button type="button" onClick={() => router.push("/")} aria-label="Go to intro screen" className="cursor-pointer">
            <Image src={ShortBlackLogo} alt="Logo" width={72} height={80} className="object-contain" />
          </button>
          <div className="mt-8 flex flex-col gap-4 items-center">
            {navButtons.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => router.push(`/${label}`)}
                aria-label={label}
                className="group relative h-9 w-9 overflow-hidden rounded-xl border-[5px] border-zinc-200 bg-zinc-300 text-zinc-950 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-20 hover:border-zinc-300 hover:bg-zinc-200 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)] hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 grid place-items-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-90">
                  <Icon className="size-5" style={{ color: "#231E1F" }} />
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold tracking-[0.04em] [font-family:var(--font-outfit)] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
                  {label}
                </span>
              </button>
            ))}
          </div>
          {/* Desktop profile button + popover */}
          <div ref={profileRef} className="relative mt-auto mb-2">
            {profileOpen && (
              <div className="absolute bottom-full left-0 mb-3 w-56 bg-[#231E1F] rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-white/10">
                  <p className="text-white font-semibold text-sm [font-family:var(--font-outfit)] truncate">
                    {userName || "User"}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 [font-family:var(--font-outfit)] truncate">
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/10 transition-colors text-sm font-semibold [font-family:var(--font-outfit)]"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            )}
            <button
              aria-label="Profile"
              onClick={() => setProfileOpen((o) => !o)}
              className="group relative h-9 w-9 overflow-hidden rounded-xl border-[5px] border-zinc-200 bg-zinc-300 text-zinc-950 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-20 hover:border-zinc-300 hover:bg-zinc-200 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)] hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 grid place-items-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-90">
                <User className="size-5" style={{ color: "#231E1F" }} />
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold tracking-[0.04em] [font-family:var(--font-outfit)] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
                Profile
              </span>
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          {/* Mobile top bar */}
          <div className="flex md:hidden items-center justify-between px-1 pt-1">
            <button onClick={() => router.push("/")} aria-label="Home">
              <Image src={ShortBlackLogo} alt="Logo" width={48} height={54} className="object-contain" />
            </button>
            <div ref={profileOpen ? undefined : undefined} className="relative">
              <button
                aria-label="Profile"
                onClick={() => setProfileOpen((o) => !o)}
                className="h-9 w-9 rounded-xl border-[5px] border-zinc-200 bg-zinc-300 grid place-items-center"
              >
                <User className="size-5" style={{ color: "#231E1F" }} />
              </button>
              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#231E1F] rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-white font-semibold text-sm [font-family:var(--font-outfit)] truncate">
                      {userName || "User"}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 [font-family:var(--font-outfit)] truncate">
                      {userEmail}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/10 transition-colors text-sm font-semibold [font-family:var(--font-outfit)]"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard content */}
          <div className="InfoBox flex flex-col gap-4 bg-amber-50 flex-1 min-h-0 w-full rounded-2xl p-4 md:p-6 md:pl-8 overflow-y-auto">
            {/* Recent Notes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl md:text-4xl text-[#231E1F] [font-family:var(--font-outfit)] font-semibold">
                  Recent Notes
                </div>
                <button
                  onClick={() => router.push("/Notes")}
                  className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold text-sm"
                >
                  View All <ArrowRight className="size-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-2">
                {recentNotes.length === 0 ? (
                  <p className="text-[#231E1F]/40 text-sm [font-family:var(--font-outfit)] py-2">
                    No notes yet — create one in Notes.
                  </p>
                ) : (
                  recentNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      preview={note.preview}
                      updatedAt={note.updatedAt}
                      onClick={() => router.push("/Notes")}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Recent Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl md:text-4xl text-[#231E1F] [font-family:var(--font-outfit)] font-semibold">
                  Recent Tasks
                </div>
                <button
                  onClick={() => router.push("/Tasks")}
                  className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold text-sm"
                >
                  View All <ArrowRight className="size-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {recentTasks.length === 0 ? (
                  <p className="text-[#231E1F]/40 text-sm [font-family:var(--font-outfit)] py-2">
                    No tasks yet — create one in Tasks.
                  </p>
                ) : (
                  recentTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      description={task.description}
                      priority={task.priority}
                      dueDate={task.dueDate}
                      onClick={() => router.push("/Tasks")}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mobile bottom nav */}
          <div className="flex md:hidden items-center justify-around bg-amber-50 rounded-2xl py-3 px-4">
            {navButtons.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => router.push(`/${label}`)}
                aria-label={label}
                className="flex flex-col items-center gap-1 text-[#231E1F] hover:opacity-70 transition-opacity"
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-semibold [font-family:var(--font-outfit)]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
