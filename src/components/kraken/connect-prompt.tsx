import { PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKrakenConnection } from "./kraken-connection";

/** Inline banner shown when a panel is running on the bridge fallback (or has no source). */
export function ConnectPrompt({ note }: { note?: string }) {
  const { openConnectModal } = useKrakenConnection();
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">
        <PlugZap className="mr-1 inline h-3.5 w-3.5 text-primary" />
        {note ?? "Connect your Kraken account to see live data."}
      </p>
      <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={openConnectModal}>
        Connect Kraken
      </Button>
    </div>
  );
}

/** Renders a Kraken proxy error as a readable, non-crashing message. */
export function KrakenErrorNotice({ error }: { error: unknown }) {
  const raw = error instanceof Error ? error.message : String(error);
  const rateLimited = /rate limit|EAPI:Rate limit|EGeneral:Too many/i.test(raw);
  const authFailed = /EAPI:Invalid key|permission|EGeneral:Permission|Invalid signature|No Kraken credentials/i.test(raw);
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <p className="text-xs font-medium text-destructive">
        {rateLimited
          ? "Kraken rate limit reached — retrying shortly."
          : authFailed
            ? "Kraken rejected these credentials or permissions."
            : "Kraken request failed."}
      </p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">{raw}</p>
    </div>
  );
}