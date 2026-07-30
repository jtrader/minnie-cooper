import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { StopLossPanel } from "@/components/kraken/stoploss-panel";
import { useBridgeSettings } from "@/lib/kraken/settings";

export const Route = createFileRoute("/stop-loss")({
  head: () => ({
    meta: [
      { title: "Stop-Loss Curves — Kraken Bridge Dashboard" },
      {
        name: "description",
        content:
          "Draw a hand-made price floor over time and let the local kraken-bridge watch the market against it, in dry run or armed mode.",
      },
      { property: "og:title", content: "Stop-Loss Curves — Kraken Bridge Dashboard" },
      {
        property: "og:description",
        content: "Hand-drawn stop-loss curves monitored continuously by your local kraken-bridge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StopLossPage,
});

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
