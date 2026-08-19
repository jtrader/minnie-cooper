import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { StopLossPanel } from "@/components/kraken/stoploss-panel";
import { useBridgeSettings } from "@/lib/kraken/settings";

export const Route = createFileRoute("/stop-loss")({
  head: () => ({
    meta: [
      { title: "Stop-Loss Curves — Minnie Cooper — Money Keeper Risk Management" },
      {
        name: "description",
        content:
          "Draw and monitor hand-made stop-loss price floors over time via your local kraken-bridge.",
      },
      { property: "og:title", content: "Stop-Loss Curves — Minnie Cooper — Money Keeper Risk Management" },
      {
        property: "og:description",
        content: "Hand-drawn stop-loss curves monitored continuously by your local kraken-bridge.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://kraken-command-center.lovable.app/stop-loss" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kraken-command-center.lovable.app/stop-loss" }],
  }),
  component: StopLossRoute,
});

function StopLossRoute() {
  return (
    <AuthGate>
      <StopLossPage />
    </AuthGate>
  );
}

function StopLossPage() {
  const { settings, hydrated, configured } = useBridgeSettings();
  if (!hydrated) return null;

  return (
    <main className="min-h-screen bg-background px-4 py-4">
      <div className="mx-auto max-w-6xl space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Stop-loss curves</h1>
            <p className="font-mono text-[11px] text-muted-foreground">
              Monitored by the bridge {configured ? `· ${settings.baseUrl}` : "· not configured"}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs hover:bg-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
        </header>
        <StopLossPanel settings={settings} configured={configured} />
      </div>
    </main>
  );
}
