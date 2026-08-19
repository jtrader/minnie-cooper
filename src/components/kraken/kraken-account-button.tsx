import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKrakenConnection } from "@/components/kraken/kraken-connection";

export function KrakenAccountButton() {
  const { status, connected, openConnectModal } = useKrakenConnection();

  return (
    <Button variant="outline" size="sm" onClick={openConnectModal}>
      <KeyRound className={`h-3.5 w-3.5 ${connected ? "text-[#4ECDC4]" : "text-muted-foreground"}`} />
      <span className="font-mono text-[11px]">
        {connected ? `Kraken ····${status?.apiKeyLast4 ?? "????"}` : "Connect Kraken"}
      </span>
    </Button>
  );
}