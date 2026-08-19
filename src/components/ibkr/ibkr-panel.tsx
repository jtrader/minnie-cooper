import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";
import { IbkrBalancesCard } from "@/components/ibkr/ibkr-balances-card";
import { IbkrPositionsCard } from "@/components/ibkr/ibkr-positions-card";
import { IbkrOrdersCard } from "@/components/ibkr/ibkr-orders-card";
import { IbkrOrderForm } from "@/components/ibkr/ibkr-order-form";
import { IbkrConnectPrompt, IbkrErrorNotice } from "@/components/ibkr/ibkr-status-notice";

export function IbkrPanel() {
  const { configured, statusError, baseUrl } = useIbkrConnection();

  return (
    <div className="space-y-3">
      <IbkrConnectPrompt />
      {configured && statusError ? <IbkrErrorNotice error={statusError} /> : null}
      {configured ? (
        <p className="font-mono text-[11px] text-muted-foreground">gateway: {baseUrl}</p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <IbkrBalancesCard />
        <IbkrPositionsCard />
      </div>
      <IbkrOrdersCard />
      <IbkrOrderForm />
    </div>
  );
}
