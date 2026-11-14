import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

/* ───────── Buttons ───────── */

type BtnVariant = "primary" | "accent" | "ghost" | "soft" | "danger";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-ink text-ink-fg hover:opacity-85",
  accent: "bg-accent text-accent-ink hover:bg-accent-strong",
  soft: "bg-surface-2 text-fg hover:bg-surface-3",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white",
};

export function Btn({
  variant = "soft",
  size = "md",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" | "icon" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "size-9",
        btnVariants[variant],
        className
      )}
      {...props}
    />
  );
}

/* ───────── Layout ───────── */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-subtle", className)}>{children}</p>
  );
}

/** Chunky display heading. */
export function Display({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={cn("font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-fg md:text-4xl", className)}>
      {children}
    </h1>
  );
}

/** The Orchestrix note-head: a tilted coral ellipse with a stem. */
export function NoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 22" className={cn("inline-block h-[0.7em] w-auto", className)} aria-hidden>
      <ellipse cx="6" cy="17" rx="5.4" ry="4" transform="rotate(-22 6 17)" fill="currentColor" />
      <rect x="10.2" y="1" width="1.6" height="15.5" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 md:px-8 md:py-6", className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>}
        <Display>{title}</Display>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-[28px] border border-line bg-surface", className)} {...props} />;
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-medium text-fg">{title}</p>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-3 text-sm text-muted">
      <Equalizer />
      {label}
    </div>
  );
}

/** Little orchestra equalizer — used for loading and "playing" states. */
export function Equalizer({ className, bars = 4 }: { className?: string; bars?: number }) {
  return (
    <span className={cn("inline-flex h-4 items-end gap-[3px]", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="h-full w-[3px] origin-bottom animate-eq rounded-full bg-accent"
          style={{ animationDelay: `${i * -0.22}s`, animationDuration: `${0.8 + (i % 3) * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function ErrorBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="mx-5 mt-3 flex items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger md:mx-8">
      <span className="min-w-0 truncate">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 font-medium hover:underline">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <svg
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pr-4 pl-9 text-sm text-fg placeholder:text-subtle transition-colors focus:border-accent focus:bg-surface focus:outline-none"
      />
    </label>
  );
}

/* ───────── Priority = musical dynamics ───────── */

export const priorityStyles: Record<Priority, { dot: string; chip: string; label: string; mark: string; term: string }> = {
  high: { dot: "bg-danger", chip: "bg-danger-soft text-danger", label: "High", mark: "ff", term: "fortissimo" },
  medium: { dot: "bg-warn", chip: "bg-warn-soft text-warn", label: "Medium", mark: "mf", term: "mezzo-forte" },
  low: { dot: "bg-success", chip: "bg-success-soft text-success", label: "Low", mark: "p", term: "piano" },
};

/** Dynamic marking (ff / mf / p) in the italic serif used on real scores. */
export function Dynamic({ priority, className }: { priority: Priority; className?: string }) {
  const s = priorityStyles[priority];
  return (
    <span title={`${s.label} priority · ${s.term}`} className={cn("font-serif text-[13px] font-semibold normal-case italic", className)}>
      {s.mark}
    </span>
  );
}

export function PriorityChip({ priority, className }: { priority: Priority; className?: string }) {
  const s = priorityStyles[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", s.chip, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-transparent bg-surface-2 px-4 text-sm text-fg placeholder:text-subtle transition-colors focus:border-accent focus:bg-surface focus:outline-none";
