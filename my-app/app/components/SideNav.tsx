"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/components/sidebar";
import {
  IconBell,
  IconChecklist,
  IconClock,
  IconNotes,
  IconPlus,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Using your existing utility

const SideNav = () => {
  const [open, setOpen] = useState(false);
  const itemPadding = open ? "px-3 py-3" : "p-3";
  const itemWidth = open ? "w-full" : "w-12";
  const itemAlign = open ? "justify-start" : "justify-center";

  return (
    <div className={cn("flex h-screen")}>
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-4 border-t border-neutral-200" />
            <div className="mt-6 flex flex-col gap-3">
              <SidebarLink
                link={{
                  label: "New",
                  href: "#",
                  icon: (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                      <IconPlus className="text-black h-4 w-4" />
                    </span>
                  ),
                }}
                className={cn(
                  "rounded-2xl bg-black text-white shadow-sm",
                  itemPadding,
                  itemWidth,
                  itemAlign
                )}
              />
              <SidebarLink
                link={{
                  label: "All Notes",
                  href: "#",
                  icon: (
                    <IconNotes className="text-black h-5 w-5 flex-shrink-0" />
                  ),
                }}
                className={cn(
                  "rounded-2xl bg-neutral-200 text-black shadow-sm",
                  itemPadding,
                  itemWidth,
                  itemAlign
                )}
              />
              <SidebarLink
                link={{
                  label: "All Tasks",
                  href: "#",
                  icon: (
                    <IconChecklist className="text-black h-5 w-5 flex-shrink-0" />
                  ),
                }}
                className={cn(
                  "rounded-2xl bg-neutral-200 text-black shadow-sm",
                  itemPadding,
                  itemWidth,
                  itemAlign
                )}
              />
              <div className={cn("grid gap-3", open ? "grid-cols-2" : "grid-cols-1")}> 
                <a
                  href="#"
                  aria-label="Reminders"
                  className={cn(
                    "flex items-center rounded-2xl bg-black text-white shadow-sm",
                    itemPadding,
                    itemWidth,
                    itemAlign
                  )}
                >
                  <IconBell className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  aria-label="Pomodoro Timer"
                  className={cn(
                    "flex items-center rounded-2xl bg-black text-white shadow-sm",
                    itemPadding,
                    itemWidth,
                    itemAlign
                  )}
                >
                  <IconClock className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <SidebarLink
              link={{
                label: "Trash",
                href: "#",
                icon: (
                  <IconTrash className="text-red-700 h-5 w-5 flex-shrink-0" />
                ),
              }}
              className={cn(
                "rounded-2xl bg-red-100 text-red-900 shadow-sm",
                itemPadding,
                itemWidth,
                itemAlign
              )}
            />
            <SidebarLink
              link={{
                label: "Profile",
                href: "#",
                icon: (
                  <IconUser className="text-black h-5 w-5 flex-shrink-0" />
                ),
              }}
              className={cn(
                "rounded-2xl bg-neutral-200 text-black shadow-sm",
                itemPadding,
                itemWidth,
                itemAlign
              )}
            />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
};

// Logo components to toggle based on sidebar state
const Logo = () => (
  <Link href="/" className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
    <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-medium text-black whitespace-pre font-[family-name:var(--font-outfit)]"
    >
      Orchestrix
    </motion.span>
  </Link>
);

const LogoIcon = () => (
  <Link href="/" className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
    <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
  </Link>
);

export default SideNav;