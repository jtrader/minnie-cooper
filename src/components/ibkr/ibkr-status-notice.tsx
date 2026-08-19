import { ExternalLink, PlugZap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";
import { IbkrError } from "@/lib/ibkr/types";

/** Explains a gateway failure in terms of the three things that actually go wrong. */
export function IbkrErrorNotice({ error }: { error: unknown }) {
  const { openGateway, baseUrl } = useIbkrConnection();
  const kind = error instanceof IbkrError ? error.kind : "http";
  const raw = error instanceof Error ? error.message : String(error);

  const title =
    kind === "unreachable"
      ? "Can't reach the Client Portal Gateway"
      : kind === "auth"
        ? "IBKR gateway session expired or not signed in"
        : "IBKR gateway request failed";

  const hint =
    kind === "unreachable"
      ? `Start the gateway, then open ${baseUrl} in a tab once so this browser trusts its self-signed certificate. If it is running and trusted, the gateway also needs this dashboard's origin allowed for cross-origin requests.`
      : kind === "auth"
        ? "Open the gateway tab, log in again with your IBKR credentials and 2FA, then come back — polling resumes automatically."
        : null;

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <ShieldAlert className="h-3.5 w-3.5" /> {title}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">{raw}</p>
      <Button size="sm" variant="outline" className="mt-2 h-6 text-[11px]" onClick={openGateway}>
        Open gateway <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}

/** Top-of-panel state for "not configured" / "not logged in to the gateway". */
export function IbkrConnectPrompt() {
  const { configured, authenticated, status, openConnectModal, openGateway, refresh } =
    useIbkrConnection();

  if (configured && authenticated) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">
        <PlugZap className="mr-1 inline h-3.5 w-3.5 text-primary" />
        {!configured
          ? "Add your Client Portal Gateway URL to start pulling Interactive Brokers data."
          : status?.connected
            ? "Not signed in to IBKR Gateway — open the gateway and log in."
            : "Waiting for an authenticated IBKR Gateway session — open the gateway and log in."}
      </p>
      {configured ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={openGateway}>
            Open gateway <ExternalLink className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={refresh}>
            Re-check
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={openConnectModal}>
          Connect IBKR
        </Button>
      )}
    </div>
  );
}
