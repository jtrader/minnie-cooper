import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsPanel } from "@/components/kraken/settings-panel";
import { DirectBalancesCard } from "@/components/kraken/direct-balances-card";
import { DirectMarketCard } from "@/components/kraken/direct-market-card";
import { DirectActivityCard } from "@/components/kraken/direct-activity-card";
import { BalancesCard } from "@/components/kraken/balances-card";
import { MarketCard } from "@/components/kraken/market-card";
import { TradesCard } from "@/components/kraken/trades-card";
import { ToolExplorer } from "@/components/kraken/tool-explorer";
import { BridgeErrorNotice } from "@/components/kraken/bridge-error-notice";
import { listTools } from "@/lib/kraken/client";
import { guessTool } from "@/lib/kraken/discovery";
import { useBridgeSettings, useToolMap, type SectionKey } from "@/lib/kraken/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kraken Bridge Dashboard — Balances, Market Data, Orders" },
      {
        name: "description",
        content:
          "A local single-user Kraken trading dashboard that reads balances, live prices and order history from your kraken-bridge service.",
      },
      { property: "og:title", content: "Kraken Bridge Dashboard" },
      {
        property: "og:description",
        content: "Balances, live market data and order history from your local kraken-bridge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { settings, setSettings, hydrated, configured } = useBridgeSettings();
  const { toolMap, setToolFor } = useToolMap();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toolsQuery = useQuery({
    queryKey: ["tools", settings.baseUrl, settings.token],
    enabled: configured,
    retry: false,
    queryFn: () => listTools(settings),
  });

  const tools = toolsQuery.data ?? [];

  const resolve = (section: SectionKey) => {
    const chosen = toolMap[section];
    if (chosen && tools.some((tool) => tool.name === chosen)) {
      return { name: chosen, needsPicker: true };
    }
    const guess = guessTool(tools, section);
    return { name: guess.tool?.name, needsPicker: !guess.confident };
  };

  if (!hydrated) return null;

  const balances = resolve("balances");
  const ticker = resolve("ticker");
  const trades = resolve("trades");

  return (
    <main className="min-h-screen bg-background px-4 py-4">
      <div className="mx-auto max-w-6xl space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Kraken bridge dashboard</h1>
            <p className="font-mono text-[11px] text-muted-foreground">
              Kraken REST API {configured ? `· bridge ${settings.baseUrl}` : "· bridge not configured"}
            </p>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-3.5 w-3.5" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bridge settings</DialogTitle>
              </DialogHeader>
              <SettingsPanel
                settings={settings}
                onSave={setSettings}
                onDone={() => setSettingsOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid gap-3 lg:grid-cols-2">
          <DirectBalancesCard />
          <DirectMarketCard />
        </div>
        <DirectActivityCard />

        {configured ? (
          <>
            <h2 className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Local bridge
            </h2>
            {toolsQuery.error ? <BridgeErrorNotice error={toolsQuery.error} /> : null}
            {toolsQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Discovering tools…</p>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              <BalancesCard
                settings={settings}
                tools={tools}
                toolName={balances.name}
                needsPicker={balances.needsPicker}
                onSelectTool={(name) => setToolFor("balances", name)}
              />
              <MarketCard
                settings={settings}
                tools={tools}
                toolName={ticker.name}
                needsPicker={ticker.needsPicker}
                onSelectTool={(name) => setToolFor("ticker", name)}
              />
            </div>

            <TradesCard
              settings={settings}
              tools={tools}
              toolName={trades.name}
              needsPicker={trades.needsPicker}
              onSelectTool={(name) => setToolFor("trades", name)}
            />

            <ToolExplorer settings={settings} tools={tools} />
          </>
        ) : null}
      </div>
    </main>
  );
}
