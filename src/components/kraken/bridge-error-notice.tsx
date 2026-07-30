import { AlertTriangle, KeyRound, PlugZap } from "lucide-react";
import { BridgeError } from "@/lib/kraken/types";

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
      </div>
    </div>
  );
}