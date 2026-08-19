import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings2, ShieldAlert } from "lucide-react";
import { OptimalLogo } from "@/components/kraken/optimal-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsPanel } from "@/components/kraken/settings-panel";
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
      { title: "Optimal Risk Management — Dashboard" },
      {
        name: "description",
        content:
          "Kraken trading dashboard with balances, market data, stop-loss curves and order history via local kraken-bridge.",
      },
      { property: "og:title", content: "Optimal Risk Management — Dashboard" },
      {
        property: "og:description",
        content: "Balances, market data, stop-loss curves and order history from your local kraken-bridge.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://kraken-command-center.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kraken-command-center.lovable.app/" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { settings, setSettings, hydrated, configured } = useBridgeSettings();
  const { toolMap, setToolFor, toolMapHydrated } = useToolMap();
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
    // Keep the saved pick while the tool list is still loading, and whenever
    // the bridge still exposes it.
    if (chosen && (tools.length === 0 || tools.some((tool) => tool.name === chosen))) {
      return { name: chosen, needsPicker: true };
    }
    const guess = guessTool(tools, section);
    return { name: guess.tool?.name, needsPicker: !guess.confident };
  };

  if (!hydrated || !toolMapHydrated) return null;

  const balances = resolve("balances");
  const ticker = resolve("ticker");
  const trades = resolve("trades");

  return (
    <main className="min-h-screen bg-background px-4 py-4">
      <div className="mx-auto max-w-6xl space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <OptimalLogo />
            <p className="font-mono text-[11px] text-muted-foreground">
              {configured ? `kraken-bridge: ${settings.baseUrl}` : "kraken-bridge not configured"}
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Link
            to="/stop-loss"
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Stop-Loss
          </Link>
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
          </div>
        </header>

        {configured ? (
          <>
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
