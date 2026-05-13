"use client";

import Image from "next/image";
import { BookOpen, CheckSquare, Bell, Clock, User, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ShortBlackLogo from "@/app/Assets/Short black logo.png";
import NoteCard from "@/app/components/NoteCard";
import TaskCard from "@/app/components/TaskCard";

export default function DashboardPage() {


  const router = useRouter();

  const navButtons = [
    { icon: BookOpen, label: "Notes" },
    { icon: CheckSquare, label: "Tasks" },
    { icon: Bell, label: "Alerts" },
    { icon: Clock, label: "Focus" },
  ];
  
  const recentNotes = [
    {title : "Potential topics for automotive videos", updatesAt : "2hr ago", Preview :"make notes on the videos you wanna make"},
    {title : "NIMCET Prep", updatesAt : "4hr ago", Preview :"clear fundamentals on quant"},
    {title : "GtM explore", updatesAt : "1hr ago", Preview :"explore what GTM does"}
  ]

  const recentTasks = [
    {title: "Finish Q1 report", description: "Complete the quarterly business report and send to management", priority: "high" as const, dueDate: "2026-05-15"},
    {title: "Review team feedback", description: "Go through all team feedback from the last sprint", priority: "medium" as const, dueDate: "2026-05-20"},
  ]

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
          <button
            aria-label="Profile"
            className="group relative mt-auto mb-2 h-9 w-9 overflow-hidden rounded-xl border-[5px] border-zinc-200 bg-zinc-300 text-zinc-950 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-20 hover:border-zinc-300 hover:bg-zinc-200 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)] hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 grid place-items-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-90">
              <User className="size-5" style={{ color: "#231E1F" }} />
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold tracking-[0.04em] [font-family:var(--font-outfit)] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
              Profile
            </span>
          </button>
        </div>
        <div className="h-full w-full">
          {/* Dashboard */}
          <div className="InfoBox flex flex-col gap-2 bg-amber-50 h-full w-full rounded-2xl p-6 pl-8"> 

            {/* Recent Notes */}
            <div className="">
              <div className="flex items-center justify-between mb-4">
                <div className="RecentNote text-4xl text-[#231E1F] [font-family:var(--font-outfit)] p-2 font-semibold">
                  Recent Notes
                </div>
                <button
                  onClick={() => router.push("/Notes")}
                  className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold text-sm"
                >
                  View All <ArrowRight className="size-4" />
                </button>
              </div>
              <div className="flex gap-4 mb-6">
                {recentNotes.map((note, index) => (
                  <NoteCard
                    key={index}
                    title={note.title}
                    preview={note.Preview}
                    updatedAt={note.updatesAt}
                    onClick={() => router.push("/Notes")}
                  />
                ))}
              </div>
            </div>
             
             {/* Recent Tasks */}
            <div className="flex items-center justify-between mb-4">
              <div className="RecentTask text-4xl text-[#231E1F] [font-family:var(--font-outfit)] font-semibold">
                Recent Tasks
              </div>
              <button
                onClick={() => router.push("/Tasks")}
                className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold text-sm"
              >
                View All <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="flex gap-4">
              {recentTasks.map((task, index) => (
                <TaskCard
                  key={index}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  dueDate={task.dueDate}
                  onClick={() => router.push("/Tasks")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
