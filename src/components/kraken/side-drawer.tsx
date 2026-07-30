import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type SideDrawerProps = {
  title: string;
  side: "left" | "right";
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/** Collapsible side drawer: full panel when open, thin toggle rail when collapsed. */
export function SideDrawer({ title, side, collapsed, onToggle, children }: SideDrawerProps) {
  const Icon =
    side === "left"
      ? collapsed
        ? ChevronRight
        : ChevronLeft
      : collapsed
        ? ChevronLeft
        : ChevronRight;

  if (collapsed) {
    return (
      <section className="flex h-full flex-col items-center rounded-lg border border-border bg-card py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label={`Expand ${title} panel`}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon className="h-4 w-4" />
        </button>
        <span
          className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ writingMode: "vertical-rl" }}
        >
          {title}
        </span>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded
          aria-label={`Collapse ${title} panel`}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon className="h-4 w-4" />
        </button>
      </header>
      {children}
    </section>
  );
}
