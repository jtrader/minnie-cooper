import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectKrakenModal } from "@/components/kraken/connect-kraken-modal";
import { useAuthSession } from "@/components/auth/use-auth-session";
import { getKrakenCredentialStatus } from "@/lib/kraken/credentials.functions";

// Accounts that were configured before this flow existed are never pushed
// through onboarding automatically.
const LEGACY_ACCOUNTS = ["support@lovekey.com.au"];
const DISMISS_PREFIX = "kraken-connect-dismissed:";

export function KrakenAccountButton() {
  const { session } = useAuthSession();
  const [open, setOpen] = useState(false);
  const fetchStatus = useServerFn(getKrakenCredentialStatus);

  const statusQuery = useQuery({
    queryKey: ["kraken-credentials"],
    enabled: Boolean(session),
    retry: false,
    queryFn: () => fetchStatus({ data: undefined }),
  });

  const status = statusQuery.data;
  const email = session?.user.email ?? "";
  const userId = session?.user.id ?? "";

  useEffect(() => {
    if (!status || status.connected || !userId) return;
    if (LEGACY_ACCOUNTS.includes(email)) return;
    if (window.localStorage.getItem(`${DISMISS_PREFIX}${userId}`)) return;
    window.localStorage.setItem(`${DISMISS_PREFIX}${userId}`, "1");
    setOpen(true);
  }, [status, userId, email]);

  const connected = status?.connected === true;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <KeyRound className={`h-3.5 w-3.5 ${connected ? "text-[#4ECDC4]" : "text-muted-foreground"}`} />
        <span className="font-mono text-[11px]">
          {connected ? `Kraken ····${status?.apiKeyLast4 ?? "????"}` : "Connect Kraken"}
        </span>
      </Button>
      <ConnectKrakenModal open={open} onOpenChange={setOpen} status={status} />
    </>
  );
}