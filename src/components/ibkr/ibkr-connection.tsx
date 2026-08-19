import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuthSession } from "@/components/auth/use-auth-session";
import { ConnectIbkrModal } from "@/components/ibkr/connect-ibkr-modal";
import { getIbkrSettings, saveIbkrSettings, type IbkrSettings } from "@/lib/ibkr/settings.functions";
import { fetchAccounts, fetchAuthStatus, gatewayOrigin, tickle } from "@/lib/ibkr/gateway";
import type { IbkrAccount, IbkrAuthStatus } from "@/lib/ibkr/types";

type IbkrConnectionValue = {
  settings: IbkrSettings | undefined;
  baseUrl: string;
  configured: boolean;
  status: IbkrAuthStatus | undefined;
  statusError: unknown;
  authenticated: boolean;
  isLoading: boolean;
  accounts: IbkrAccount[];
  accountId: string | null;
  setAccountId: (id: string) => void;
  openGateway: () => void;
  openConnectModal: () => void;
  refresh: () => void;
};

const IbkrConnectionContext = createContext<IbkrConnectionValue | null>(null);

export function useIbkrConnection(): IbkrConnectionValue {
  const value = useContext(IbkrConnectionContext);
  if (!value) throw new Error("useIbkrConnection must be used inside IbkrConnectionProvider");
  return value;
}

/** Only poll while the tab is visible — CPGW sessions are per-browser and cheap to keep warm. */
function useTabActive(): boolean {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const onChange = () => setActive(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return active;
}

export function IbkrConnectionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [accountOverride, setAccountOverride] = useState<string | null>(null);
  const tabActive = useTabActive();
  const queryClient = useQueryClient();
  const loadSettings = useServerFn(getIbkrSettings);
  const persistSettings = useServerFn(saveIbkrSettings);

  const settingsQuery = useQuery({
    queryKey: ["ibkr-settings"],
    enabled: Boolean(session),
    retry: false,
    queryFn: () => loadSettings({ data: undefined }),
  });

  const settings = settingsQuery.data;
  const configured = settings?.configured === true;
  const baseUrl = settings?.gatewayBaseUrl ?? "";

  const statusQuery = useQuery({
    queryKey: ["ibkr-auth-status", baseUrl],
    enabled: configured && tabActive,
    retry: false,
    refetchInterval: tabActive ? 20_000 : false,
    queryFn: () => fetchAuthStatus(baseUrl),
  });

  const authenticated = statusQuery.data?.authenticated === true;

  const accountsQuery = useQuery({
    queryKey: ["ibkr-accounts", baseUrl],
    enabled: configured && authenticated,
    retry: false,
    queryFn: () => fetchAccounts(baseUrl),
  });

  // Keep the gateway session alive while the dashboard is open and signed in.
  useEffect(() => {
    if (!configured || !authenticated || !tabActive) return;
    const id = window.setInterval(() => {
      void tickle(baseUrl).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [configured, authenticated, tabActive, baseUrl]);

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const accountId =
    accountOverride ??
    (settings?.defaultAccountId && accounts.some((a) => a.accountId === settings.defaultAccountId)
      ? settings.defaultAccountId
      : (accounts[0]?.accountId ?? null));

  const setAccountId = useCallback(
    (id: string) => {
      setAccountOverride(id);
      if (!baseUrl) return;
      void persistSettings({ data: { gatewayBaseUrl: baseUrl, defaultAccountId: id } }).then(() =>
        queryClient.invalidateQueries({ queryKey: ["ibkr-settings"] }),
      );
    },
    [baseUrl, persistSettings, queryClient],
  );

  const openGateway = useCallback(() => {
    if (!baseUrl) return;
    window.open(gatewayOrigin(baseUrl), "_blank", "noopener");
  }, [baseUrl]);

  const refresh = useCallback(() => {
    void statusQuery.refetch();
    void accountsQuery.refetch();
  }, [statusQuery, accountsQuery]);

  const value = useMemo<IbkrConnectionValue>(
    () => ({
      settings,
      baseUrl,
      configured,
      status: statusQuery.data,
      statusError: statusQuery.error,
      authenticated,
      isLoading: settingsQuery.isLoading || statusQuery.isLoading,
      accounts,
      accountId,
      setAccountId,
      openGateway,
      openConnectModal: () => setOpen(true),
      refresh,
    }),
    [
      settings,
      baseUrl,
      configured,
      statusQuery.data,
      statusQuery.error,
      statusQuery.isLoading,
      settingsQuery.isLoading,
      authenticated,
      accounts,
      accountId,
      setAccountId,
      openGateway,
      refresh,
    ],
  );

  return (
    <IbkrConnectionContext.Provider value={value}>
      {children}
      <ConnectIbkrModal open={open} onOpenChange={setOpen} settings={settings} />
    </IbkrConnectionContext.Provider>
  );
}
