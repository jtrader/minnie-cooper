import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { callTool } from "@/lib/kraken/client";
import type { BridgeSettings, CallToolResult, McpTool } from "@/lib/kraken/types";

function templateArgs(tool: McpTool | undefined): string {
  const schema = tool?.inputSchema as
    | { properties?: Record<string, { type?: string; default?: unknown }> }
    | undefined;
  if (!schema?.properties) return "{}";
  const draft: Record<string, unknown> = {};
  Object.entries(schema.properties).forEach(([key, prop]) => {
    draft[key] =
      prop?.default ??
      (prop?.type === "number" || prop?.type === "integer"
        ? 0
        : prop?.type === "boolean"
          ? false
          : prop?.type === "array"
            ? []
            : "");
  });
  return JSON.stringify(draft, null, 2);
}

export function ToolExplorer({
  settings,
  tools,
}: {
  settings: BridgeSettings;
  tools: McpTool[];
}) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | undefined>(tools[0]?.name);
  const [args, setArgs] = useState("{}");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CallToolResult | null>(null);
  const [error, setError] = useState<unknown>(null);

  const tool = tools.find((entry) => entry.name === selected);

  useEffect(() => {
    if (!selected && tools[0]) setSelected(tools[0].name);
  }, [tools, selected]);

  useEffect(() => {
    setArgs(templateArgs(tool));
    setResult(null);
    setError(null);
  }, [tool]);

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return tools;
    return tools.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term) ||
        (entry.description ?? "").toLowerCase().includes(term),
    );
  }, [tools, filter]);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const parsed = args.trim() ? (JSON.parse(args) as Record<string, unknown>) : {};
      setResult(await callTool(settings, selected as string, parsed));
    } catch (err) {
      setError(err instanceof SyntaxError ? new Error(`Invalid JSON: ${err.message}`) : err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Terminal className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-tight">Tool explorer</h2>
        <span className="text-[11px] text-muted-foreground">{tools.length} tools discovered</span>
      </header>

      <div className="grid gap-3 p-3 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter tools…"
            className="h-7 text-xs"
          />
          <div className="max-h-96 space-y-1 overflow-auto pr-1">
            {filtered.map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => setSelected(entry.name)}
                className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors ${
                  selected === entry.name
                    ? "border-primary/60 bg-primary/10"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                <p className="font-mono text-[11px] text-foreground">{entry.name}</p>
                {entry.description ? (
                  <p className="line-clamp-2 text-[10px] text-muted-foreground">
                    {entry.description}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {tool ? (
            <>
              <p className="text-xs text-muted-foreground">{tool.description ?? "No description"}</p>
              <details className="rounded-md border border-border/60 bg-muted/20">
                <summary className="cursor-pointer px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Input schema
                </summary>
                <pre className="max-h-48 overflow-auto px-2 pb-2 font-mono text-[10px] text-muted-foreground">
                  {JSON.stringify(tool.inputSchema ?? {}, null, 2)}
                </pre>
              </details>
              <Textarea
                value={args}
                onChange={(event) => setArgs(event.target.value)}
                spellCheck={false}
                className="min-h-28 font-mono text-xs"
                aria-label="Tool arguments JSON"
              />
              <Button size="sm" onClick={run} disabled={running}>
                {running ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Run tool
              </Button>
              {error ? <BridgeErrorNotice error={error} /> : null}
              {result ? (
                <pre className="max-h-96 overflow-auto rounded-md border border-border/60 bg-muted/20 p-2 font-mono text-[11px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Select a tool to inspect and run it.</p>
          )}
        </div>
      </div>
    </section>
  );
}