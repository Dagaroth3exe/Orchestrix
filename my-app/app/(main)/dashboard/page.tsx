import Image from "next/image";
import { BookOpen, CheckSquare, Bell, Clock } from "lucide-react";
import ShortBlackLogo from "@/app/Assets/Short black logo.png";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-none mx-auto h-[calc(100vh-2rem)] overflow-hidden">
      <div className="Main bg-amber-50/55 h-full w-full rounded-2xl p-4 flex gap-4">
        <div className="h-full w-[8%] flex flex-col items-center justify-start pt-2 px-2">
          <Image src={ShortBlackLogo} alt="Logo" width={110} height={140} className="object-contain" />
          <div className="mt-8 flex flex-col gap-4 items-center">
            <button className="size-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-900 transition-colors grid place-items-center shadow-md">
              <BookOpen className="size-5" />
            </button>
            <button className="size-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-900 transition-colors grid place-items-center shadow-md">
              <CheckSquare className="size-5" />
            </button>
            <button className="size-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-900 transition-colors grid place-items-center shadow-md">
              <Bell className="size-5" />
            </button>
            <button className="size-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-900 transition-colors grid place-items-center shadow-md">
              <Clock className="size-5" />
            </button>
          </div>
        </div>
        <div className="h-full w-[92%]">
          <div className="InfoBox bg-amber-50 h-full w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
