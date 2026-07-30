import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, KeyRound, PlugZap } from "lucide-react";
import { BridgeError } from "@/lib/kraken/types";

function OriginHint() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  if (!origin) return null;
  const envLine = `KRAKEN_BRIDGE_ALLOWED_ORIGIN=${origin}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(envLine);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-1 space-y-1 rounded border border-loss/30 bg-background/40 p-2">
      <p className="text-loss/80">
        This page is served from <span className="font-mono">{origin}</span>. If the bridge was
        started with a different allowed origin, restart it with:
      </p>
      <div className="flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-foreground">
          {envLine}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy allowed-origin environment variable"
          className="shrink-0 rounded p-1 text-loss/80 hover:bg-loss/10 hover:text-loss"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function BridgeErrorNotice({ error }: { error: unknown }) {
  const bridgeError = error instanceof BridgeError ? error : null;
  const kind = bridgeError?.kind ?? "http";
  const Icon = kind === "unauthorized" ? KeyRound : kind === "network" ? PlugZap : AlertTriangle;
  const message =
    bridgeError?.message ?? (error instanceof Error ? error.message : "Unexpected error");

  return (
    <div className="flex items-start gap-2 rounded-md border border-loss/40 bg-loss/10 px-3 py-2 text-xs text-loss">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          {kind === "unauthorized"
            ? "Unauthorized"
            : kind === "network"
              ? "Bridge unreachable"
              : "Bridge error"}
        </p>
        <p className="text-loss/80">{message}</p>
        {kind === "unauthorized" ? <OriginHint /> : null}
      </div>
    </div>
  );
}