"use client";

import Image from "next/image";
import { ArrowRight, BookOpen, CheckSquare, Bell, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import ShortBlackLogo from "@/app/Assets/Short black logo.png";

export default function DashboardPage() {
  const router = useRouter();

  const navButtons = [
    { icon: BookOpen, label: "Notes" },
    { icon: CheckSquare, label: "Tasks" },
    { icon: Bell, label: "Alerts" },
    { icon: Clock, label: "Focus" },
  ];

  const recentNotes = [
    { title: "Sprint Planning Ideas", updatedAt: "2h ago", preview: "Draft priorities for next sprint and ownership." },
    { title: "Client Call Summary", updatedAt: "Yesterday", preview: "Budget constraints, timeline updates, and next steps." },
    { title: "UI Polish Checklist", updatedAt: "3 days ago", preview: "Spacing, typography balance, and hover consistency." },
  ];

  return (
    <div className="w-full max-w-none mx-auto h-[calc(100vh-2rem)] overflow-hidden">
      <div className="Main bg-amber-50/80 h-full w-full rounded-2xl p-3 flex gap-3">
        <div className="h-full w-[7%] flex flex-col items-center justify-start pt-2 px-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Go to intro screen"
            className="cursor-pointer"
          >
            <Image src={ShortBlackLogo} alt="Logo" width={72} height={80} className="object-contain" />
          </button>
          <div className="mt-8 flex flex-col gap-4 items-center">
            {navButtons.map(({ icon: Icon, label }) => (
              <button
                key={label}
                aria-label={label}
                className="group relative h-9 w-9 overflow-hidden rounded-xl border-[3px] border-zinc-800 bg-zinc-300 text-zinc-950 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-20 hover:border-black hover:bg-zinc-200 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)] hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 grid place-items-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-90">
                  <Icon className="size-5" />
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold tracking-[0.04em] [font-family:var(--font-outfit)] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
                  {label}
                </span>
              </button>
            ))}
          </div>
          <button
            aria-label="Profile"
            className="group relative mt-auto mb-2 h-9 w-9 overflow-hidden rounded-xl border-[3px] border-zinc-800 bg-zinc-300 text-zinc-950 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-20 hover:border-black hover:bg-zinc-200 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)] hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 grid place-items-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-90">
              <User className="size-5" />
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold tracking-[0.04em] [font-family:var(--font-outfit)] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
              Profile
            </span>
          </button>
        </div>
        <div className="h-full w-full">
          <div className="InfoBox bg-amber-50 h-full w-full rounded-2xl p-6">
            <div className="h-full w-full rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 [font-family:var(--font-outfit)]">Recent Notes</h2>
                  <p className="mt-1 text-sm text-zinc-600">Quick access to your latest updates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/Notes")}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
                >
                  View All
                  <ArrowRight className="size-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {recentNotes.map((note) => (
                  <button
                    key={note.title}
                    type="button"
                    onClick={() => router.push("/Notes")}
                    className="w-full rounded-xl border border-zinc-200 bg-white/90 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-zinc-900">{note.title}</h3>
                      <span className="text-xs font-medium text-zinc-500">{note.updatedAt}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">{note.preview}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
