import { AlertTriangle } from "lucide-react";

type Props = { kind?: string; message: string };

export function KrakenErrorNotice({ kind, message }: Props) {
  const hint =
    kind === "auth" || kind === "credentials"
      ? "Check that the API key and private key are correct and that the key has Query Funds / Query Ledger permissions."
      : kind === "network"
        ? "Kraken could not be reached. Check connectivity and try again."
        : "Kraken returned an error for this request.";

  return (
    <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      <div>
        <p className="font-medium text-foreground">{message}</p>
        <p className="mt-0.5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}