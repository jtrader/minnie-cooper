import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ConnectKrakenModal } from "@/components/kraken/connect-kraken-modal";
import { useAuthSession } from "@/components/auth/use-auth-session";
import {
  getKrakenCredentialStatus,
  type KrakenCredentialStatus,
} from "@/lib/kraken/credentials.functions";

// Accounts configured before this flow existed are never pushed through
// onboarding automatically.
const LEGACY_ACCOUNTS = ["support@lovekey.com.au"];
const DISMISS_PREFIX = "kraken-connect-dismissed:";

type KrakenConnectionValue = {
  status: KrakenCredentialStatus | undefined;
  connected: boolean;
  isLoading: boolean;
  openConnectModal: () => void;
};

const KrakenConnectionContext = createContext<KrakenConnectionValue>({
  status: undefined,
  connected: false,
  isLoading: false,
  openConnectModal: () => {},
});

export function useKrakenConnection() {
  return useContext(KrakenConnectionContext);
}

export function KrakenConnectionProvider({ children }: { children: ReactNode }) {
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

  const openConnectModal = useCallback(() => setOpen(true), []);

  const value = useMemo<KrakenConnectionValue>(
    () => ({
      status,
      connected: status?.connected === true,
      isLoading: statusQuery.isLoading,
      openConnectModal,
    }),
    [status, statusQuery.isLoading, openConnectModal],
  );

  return (
    <KrakenConnectionContext.Provider value={value}>
      {children}
      <ConnectKrakenModal open={open} onOpenChange={setOpen} status={status} />
    </KrakenConnectionContext.Provider>
  );
}