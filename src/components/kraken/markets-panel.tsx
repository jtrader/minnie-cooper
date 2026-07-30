import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FLAT_WATCHLIST, WATCHLIST, toKrakenPair } from "@/lib/kraken/watchlist";

export type MarketsPanelProps = {
  pair: string;
  onSelect: (pair: string) => void;
  activePlanPairs: Set<string>;
  draftPairs: Set<string>;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function MarketsPanel({
  pair,
  onSelect,
  activePlanPairs,
  draftPairs,
  collapsed = false,
  onToggleCollapsed,
}: MarketsPanelProps) {
  const index = FLAT_WATCHLIST.findIndex((entry) => entry.pair === pair);
  const step = (delta: number) => {
    const base = index === -1 ? 0 : index;
    const next = (base + delta + FLAT_WATCHLIST.length) % FLAT_WATCHLIST.length;
    onSelect(FLAT_WATCHLIST[next].pair);
  };

  if (collapsed) {
    return (
      <section className="flex h-full flex-col items-center rounded-lg border border-border bg-card py-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-label="Expand Markets panel"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <span
          className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ writingMode: "vertical-rl" }}
        >
          Markets
        </span>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold tracking-tight">Markets</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-1.5" onClick={() => step(-1)} aria-label="Previous market">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-6 px-1.5" onClick={() => step(1)} aria-label="Next market">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded
              aria-label="Collapse Markets panel"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="max-h-[520px] space-y-3 overflow-y-auto p-2">
        {WATCHLIST.map((group) => (
          <div key={group.category}>
            <div className="flex items-baseline justify-between px-1 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.category}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">#{group.tag}</span>
            </div>
            <ul className="space-y-0.5">
              {group.items.map((symbol) => {
                const krakenPair = toKrakenPair(symbol);
                const selected = krakenPair === pair;
                return (
                  <li key={symbol}>
                    <button
                      type="button"
                      onClick={() => onSelect(krakenPair)}
                      aria-current={selected ? "true" : undefined}
                      className={`flex w-full items-center justify-between rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{symbol}</span>
                      <span className="flex items-center gap-1">
                        {activePlanPairs.has(krakenPair) ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-gain"
                            title="Active stop-loss plan"
                            aria-label="Active stop-loss plan"
                          />
                        ) : null}
                        {draftPairs.has(krakenPair) ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-loss"
                            title="Unsaved draft curve"
                            aria-label="Unsaved draft curve"
                          />
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <footer className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-gain" /> active plan
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-loss" /> unsaved draft
        </span>
      </footer>
    </section>
  );
}
