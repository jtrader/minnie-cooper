import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2, ShieldAlert, LogOut } from "lucide-react";
import { MinnieCooperLogo } from "@/components/brand/minnie-cooper-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SettingsPanel } from "@/components/kraken/settings-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalancesCard } from "@/components/kraken/balances-card";
import { MarketCard } from "@/components/kraken/market-card";
import { TradesCard } from "@/components/kraken/trades-card";
import { ToolExplorer } from "@/components/kraken/tool-explorer";
import { BridgeErrorNotice } from "@/components/kraken/bridge-error-notice";
import { listTools } from "@/lib/kraken/client";
import { guessTool } from "@/lib/kraken/discovery";
import { useBridgeSettings, useToolMap, type SectionKey } from "@/lib/kraken/settings";
import { AuthGate } from "@/components/auth/auth-gate";
import { KrakenAccountButton } from "@/components/kraken/kraken-account-button";
import { KrakenConnectionProvider } from "@/components/kraken/kraken-connection";
import { useKrakenConnection } from "@/components/kraken/kraken-connection";
import { ConnectPrompt } from "@/components/kraken/connect-prompt";
import { IbkrConnectionProvider } from "@/components/ibkr/ibkr-connection";
import { IbkrAccountButton } from "@/components/ibkr/ibkr-account-button";
import { IbkrPanel } from "@/components/ibkr/ibkr-panel";
import { Mt5ConnectionProvider } from "@/components/mt5/mt5-connection";
import { Mt5AccountButton } from "@/components/mt5/mt5-account-button";
import { Mt5Panel } from "@/components/mt5/mt5-panel";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({ head: () => ({ meta: [{ title: "Minnie Cooper — Money Keeper Risk Management — Dashboard" }, { name: "description", content: "Kraken, Interactive Brokers and MetaTrader 5 trading dashboard." }, { property: "og:title", content: "Minnie Cooper — Money Keeper Risk Management — Dashboard" }, { property: "og:description", content: "Balances, market data, positions and orders across connected brokers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: "https://kraken-command-center.lovable.app/dashboard" }] }), component: DashboardRoute });

function DashboardRoute() { return <AuthGate><KrakenConnectionProvider><IbkrConnectionProvider><Mt5ConnectionProvider><Dashboard /></Mt5ConnectionProvider></IbkrConnectionProvider></KrakenConnectionProvider></AuthGate>; }

function Dashboard() {
  const { settings, setSettings, hydrated, configured } = useBridgeSettings();
  const { toolMap, setToolFor, toolMapHydrated } = useToolMap();
  const { connected } = useKrakenConnection();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate(); const queryClient = useQueryClient();
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); void navigate({ to: "/", replace: true }); };
  const toolsQuery = useQuery({ queryKey: ["tools", settings.baseUrl, settings.token], enabled: configured, retry: false, queryFn: () => listTools(settings) });
  const tools = toolsQuery.data ?? [];
  const resolve = (section: SectionKey) => { const chosen = toolMap[section]; if (chosen && (tools.length === 0 || tools.some(tool => tool.name === chosen))) return { name: chosen, needsPicker: true }; const guess = guessTool(tools, section); return { name: guess.tool?.name, needsPicker: !guess.confident }; };
  if (!hydrated || !toolMapHydrated) return null;
  const balances = resolve("balances"), ticker = resolve("ticker"), trades = resolve("trades");
  return <main className="min-h-screen bg-background px-4 py-4"><div className="mx-auto max-w-6xl space-y-3"><header className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-col gap-0.5"><MinnieCooperLogo variant="compact" /><p className="font-mono text-[11px] text-muted-foreground">{configured ? `kraken-bridge: ${settings.baseUrl}` : "kraken-bridge not configured"}</p></div><div className="flex items-center gap-2"><KrakenAccountButton /><IbkrAccountButton /><Mt5AccountButton /><Link to="/stop-loss" className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent"><ShieldAlert className="h-3.5 w-3.5" /> Stop-Loss</Link><Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogTrigger asChild><Button variant="outline" size="sm"><Settings2 className="h-3.5 w-3.5" /> Settings</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Bridge settings</DialogTitle></DialogHeader><SettingsPanel settings={settings} onSave={setSettings} onDone={() => setSettingsOpen(false)} /></DialogContent></Dialog><Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="h-3.5 w-3.5" /> Sign out</Button></div></header><Tabs defaultValue="kraken" className="space-y-3"><TabsList className="h-8"><TabsTrigger value="kraken" className="text-xs">Kraken</TabsTrigger><TabsTrigger value="ibkr" className="text-xs">Interactive Brokers</TabsTrigger><TabsTrigger value="mt5" className="text-xs">MetaTrader 5</TabsTrigger></TabsList><TabsContent value="kraken" className="space-y-3">{configured || connected ? <>{configured && toolsQuery.error ? <BridgeErrorNotice error={toolsQuery.error} /> : null}{toolsQuery.isLoading ? <p className="text-xs text-muted-foreground">Discovering tools…</p> : null}<div className="grid gap-3 lg:grid-cols-2"><BalancesCard settings={settings} tools={tools} toolName={balances.name} needsPicker={balances.needsPicker} onSelectTool={name => setToolFor("balances", name)} /><MarketCard settings={settings} tools={tools} toolName={ticker.name} needsPicker={ticker.needsPicker} onSelectTool={name => setToolFor("ticker", name)} /></div><TradesCard settings={settings} tools={tools} toolName={trades.name} needsPicker={trades.needsPicker} onSelectTool={name => setToolFor("trades", name)} />{configured ? <ToolExplorer settings={settings} tools={tools} /> : null}</> : <ConnectPrompt note="No data source yet — connect your Kraken account, or configure the local bridge in Settings." />}</TabsContent><TabsContent value="ibkr"><IbkrPanel /></TabsContent><TabsContent value="mt5"><Mt5Panel /></TabsContent></Tabs></div></main>;
}
