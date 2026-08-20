import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ConnectMt5Modal } from "@/components/mt5/connect-mt5-modal";
import { useAuthSession } from "@/components/auth/use-auth-session";
import { getMt5CredentialStatus, type Mt5CredentialStatus } from "@/lib/mt5/credentials.functions";

type Mt5ConnectionValue = {
  status: Mt5CredentialStatus | undefined;
  connected: boolean;
  isLoading: boolean;
  openConnectModal: () => void;
};

const Context = createContext<Mt5ConnectionValue>({
  status: undefined,
  connected: false,
  isLoading: false,
  openConnectModal: () => {},
});

export function useMt5Connection() { return useContext(Context); }

export function Mt5ConnectionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuthSession();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getMt5CredentialStatus);
  const statusQuery = useQuery({
    queryKey: ["mt5-credentials"],
    enabled: Boolean(session),
    retry: false,
    queryFn: () => fetchStatus({ data: undefined }),
    refetchInterval: 30_000,
  });
  const status = statusQuery.data;
  const openConnectModal = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({
    status,
    connected: status?.connected === true,
    isLoading: statusQuery.isLoading,
    openConnectModal,
  }), [status, statusQuery.isLoading, openConnectModal]);
  return (
    <Context.Provider value={value}>
      {children}
      <ConnectMt5Modal
        open={open}
        onOpenChange={setOpen}
        status={status}
        onSaved={() => void queryClient.invalidateQueries({ queryKey: ["mt5-credentials"] })}
      />
    </Context.Provider>
  );
}
