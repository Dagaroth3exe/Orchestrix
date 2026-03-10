"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tasks",     href: "/Tasks"     },
  { label: "Notes",     href: "/Notes"     },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r border-white/10 bg-black/20 backdrop-blur-md px-4 py-8 gap-2">
      <p className="text-amber-50/40 text-xs uppercase tracking-widest mb-4 px-2">Menu</p>
      {navItems.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === href
              ? "bg-amber-50 text-black"
              : "text-amber-50/70 hover:text-amber-50 hover:bg-white/10"
          )}
        >
          {label}
        </Link>
      ))}
    </aside>
  );
}
