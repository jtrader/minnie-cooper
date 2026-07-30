import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { ToolPicker } from "./tool-picker";
import { callTool, extractPayload } from "@/lib/kraken/client";
import { pairArgs } from "@/lib/kraken/discovery";
import { parseTicker } from "@/lib/kraken/parse";
import { formatNumber, formatPct, toneClass } from "@/lib/kraken/format";
import type { BridgeSettings, McpTool } from "@/lib/kraken/types";

const PRESETS = ["XBTUSD", "ETHUSD", "SOLUSD", "XBTEUR"];

type MarketCardProps = {
  settings: BridgeSettings;
  tools: McpTool[];
  toolName?: string;
  onSelectTool: (name: string) => void;
  needsPicker: boolean;
};

export function MarketCard({
  settings,
  tools,
  toolName,
  onSelectTool,
  needsPicker,
}: MarketCardProps) {
  const [pair, setPair] = useState("XBTUSD");
  const [draft, setDraft] = useState("XBTUSD");
  const [live, setLive] = useState(true);

  const tool = tools.find((entry) => entry.name === toolName);

  const query = useQuery({
    queryKey: ["ticker", settings.baseUrl, toolName, pair],
    enabled: Boolean(toolName),
    refetchInterval: live ? 10_000 : false,
    queryFn: async () => extractPayload(await callTool(settings, toolName as string, pairArgs(tool, pair))),
  });

  const snapshot = parseTicker(query.data, pair);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Market data</h2>
          {toolName ? (
            <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {toolName}
            </code>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {needsPicker || !toolName ? (
            <ToolPicker tools={tools} value={toolName} onChange={onSelectTool} />
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setLive((value) => !value)}
            aria-label={live ? "Pause auto-refresh" : "Resume auto-refresh"}
          >
            {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>

      <div className="space-y-3 p-3">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPair(draft.trim().toUpperCase());
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-7 w-32 font-mono text-xs uppercase"
            aria-label="Trading pair"
          />
          <Button type="submit" size="sm" variant="outline" className="h-7">
            Load
          </Button>
          <div className="flex gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setDraft(preset);
                  setPair(preset);
                }}
                className={`rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                  pair === preset
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
            {query.isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {live ? "auto-refresh 10s" : "paused"}
          </span>
        </form>

        {!toolName ? (
          <p className="text-xs text-muted-foreground">
            No ticker tool identified. Pick the tool that returns market prices.
          </p>
        ) : query.error ? (
          <BridgeErrorNotice error={query.error} />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Price" value={formatNumber(snapshot.price)} />
            <Stat
              label="24h change"
              value={formatPct(snapshot.changePct)}
              tone={toneClass(snapshot.changePct)}
            />
            <Stat label="24h volume" value={formatNumber(snapshot.volume)} />
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-mono text-lg tabular-nums ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}