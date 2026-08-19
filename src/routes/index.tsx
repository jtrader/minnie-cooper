import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Activity, LineChart, Wallet, Terminal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MinnieCooperLogo } from "@/components/brand/minnie-cooper-logo";
import { HerdingCurves } from "@/components/brand/herding-curves";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuthSession } from "@/components/auth/use-auth-session";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { auth?: "1" } =>
    search["auth"] === "1" ? { auth: "1" } : {},
  head: () => ({
    meta: [
      { title: "Minnie Cooper — Money Keeper Risk Management" },
      {
        name: "description",
        content:
          "Minnie Cooper guards your Kraken capital: live balances, auto-refreshing market data, recent orders, a raw tool explorer and hand-drawn stop-loss curves.",
      },
      { property: "og:title", content: "Minnie Cooper — Money Keeper Risk Management" },
      {
        property: "og:description",
        content:
          "Two collies on watch: live Kraken balances, market data, recent orders and stop-loss curves in one calm, data-dense console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Wallet,
    title: "Account balances",
    body: "Live spot balances pulled straight from your Kraken account, in monospace precision.",
  },
  {
    icon: LineChart,
    title: "Market data",
    body: "Auto-refreshing tickers with gain/loss colouring so you read the tape at a glance.",
  },
  {
    icon: Activity,
    title: "Recent orders",
    body: "Your latest fills and open orders, timestamped and side-coloured for quick scanning.",
  },
  {
    icon: Terminal,
    title: "Tool explorer",
    body: "Call any bridge tool directly and inspect the raw JSON response — nothing hidden.",
  },
];

const ticker = [
  { pair: "XBT/USD", price: "64,281.40", tone: "gain" as const },
  { pair: "ETH/USD", price: "3,492.12", tone: "loss" as const },
  { pair: "SOL/USD", price: "145.88", tone: "gain" as const },
  { pair: "XRP/USD", price: "0.62", tone: "flat" as const },
];

const bars = [40, 52, 88, 68, 100];

function Landing() {
  const { auth } = Route.useSearch();
  const { status } = useAuthSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  useEffect(() => {
    if (auth === "1") setOpen(true);
  }, [auth]);

  const launch = (next: "sign-in" | "sign-up") => {
    if (status === "signed-in") {
      void navigate({ to: "/dashboard" });
      return;
    }
    setMode(next);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <MinnieCooperLogo />
          <div className="flex items-center gap-4">
            <button
              onClick={() => launch("sign-in")}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              Sign In
            </button>
            <Button className="rounded-full px-5" onClick={() => launch("sign-up")}>
              Get Started
            </Button>
          </div>
        </header>

        <section className="space-y-6 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            The smartest way to <span className="text-primary">guard</span> your capital on Kraken & Interactive Brokers.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
            Named after two border collies who never take their eyes off the flock. Automated risk
            buffers, live account intelligence and downside protection for serious digital asset
            traders.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button className="rounded-full px-6" onClick={() => launch("sign-up")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-full px-6" onClick={() => launch("sign-in")}>
              Sign In
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:flex sm:justify-between sm:px-4">
          {ticker.map((row) => (
            <div key={row.pair} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{row.pair}</span>
              <span
                className={`font-mono text-sm font-medium tabular-nums ${
                  row.tone === "gain"
                    ? "text-gain"
                    : row.tone === "loss"
                      ? "text-loss"
                      : "text-muted-foreground"
                }`}
              >
                {row.price}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:h-[500px] lg:grid-cols-12 lg:grid-rows-2">
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 lg:col-span-8 lg:row-span-2">
            <div>
              <h2 className="font-display text-3xl font-bold text-card-foreground">
                Intelligent stop-loss
              </h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Dynamic liquidation buffers you draw by hand and the bridge watches continuously —
                following the trend, not just the price.
              </p>
            </div>
            <div className="mt-8 flex items-end gap-2" aria-hidden="true">
              {bars.map((height, index) => (
                <div
                  key={height}
                  className={`h-full w-12 rounded-t-lg ${index === 2 ? "bg-primary" : "bg-accent"}`}
                  style={{ height: `${height * 2.2}px` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-secondary/60 p-6 lg:col-span-4">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Position health</h2>
              <span className="rounded-md bg-gain/15 px-2 py-1 text-xs font-bold uppercase text-gain">
                Secure
              </span>
            </div>
            <div className="mt-4 font-mono text-4xl font-bold tabular-nums text-primary">98.4%</div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-minnie p-6 lg:col-span-4">
            <p className="text-sm text-background/70">Quick action</p>
            <button
              onClick={() => launch("sign-in")}
              className="flex items-center justify-between font-display text-xl font-semibold text-background"
            >
              Open the console
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <HerdingCurves />

        <section className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
              <feature.icon className="h-4 w-4 text-primary" />
              <h2 className="mt-3 font-display text-base font-semibold text-card-foreground">
                {feature.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/60 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Stop-loss curves
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Draw price floors over time and let the bridge monitor them around the clock.
              </p>
            </div>
          </div>
          <Button className="rounded-full px-5" onClick={() => launch("sign-in")}>
            Open dashboard
          </Button>
        </section>

        <footer className="border-t border-border pt-6 font-mono text-[11px] text-muted-foreground">
          Minnie Cooper · Money Keeper Risk Management · dashboard access requires sign in
        </footer>
      </div>

      <AuthModal
        open={open}
        onOpenChange={setOpen}
        defaultMode={mode}
        onAuthenticated={() => {
          setOpen(false);
          void navigate({ to: "/dashboard" });
        }}
      />
    </div>
  );
}
