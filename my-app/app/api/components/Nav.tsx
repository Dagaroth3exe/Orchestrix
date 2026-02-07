"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMemo, useState } from "react";


function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type NavItem = {
    name: string;
    href: string;
    external?: boolean;
};

const defaultNavItems: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "Intro", href: "/#intro" },
    { name: "Contact", href: "/#contact" },
];

type NavProps = {
    items?: NavItem[];
};

export default function Nav({ items = defaultNavItems }: NavProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const normalizedPath = useMemo(() => pathname ?? "/", [pathname]);
    const isActive = (href: string) => {
        const baseHref = href.split("#")[0] || "/";
        return baseHref === normalizedPath;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                <Link
                    href="/"
                    className="text-lg font-semibold tracking-wide text-white"
                    aria-label="Orchestrix home"
                >
                    Orchestrix
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    {items.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noreferrer" : undefined}
                            className={cn(
                                "relative text-sm font-medium text-white/70 transition-colors hover:text-white",
                                isActive(item.href) && "text-white",
                            )}
                        >
                            {item.name}
                            {isActive(item.href) && (
                                <motion.span
                                    layoutId="nav-underline"
                                    className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-white"
                                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 md:hidden"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-expanded={isOpen}
                    aria-label="Toggle navigation"
                >
                    Menu
                </button>
            </div>

            {isOpen && (
                <div className="mx-auto w-full max-w-6xl px-6 pb-4 md:hidden">
                    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur">
                        {items.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                target={item.external ? "_blank" : undefined}
                                rel={item.external ? "noreferrer" : undefined}
                                className={cn(
                                    "text-sm font-medium text-white/80 transition-colors hover:text-white",
                                    isActive(item.href) && "text-white",
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}