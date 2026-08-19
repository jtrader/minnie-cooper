import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Activity, LineChart, Wallet, Terminal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimalLogo } from "@/components/kraken/optimal-logo";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuthSession } from "@/components/auth/use-auth-session";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { auth?: "1" } =>
    search["auth"] === "1" ? { auth: "1" } : {},
  head: () => ({
    meta: [
      { title: "Optimal — Kraken Trading Dashboard" },
      {
        name: "description",
        content:
          "Optimal is a dark, data-dense Kraken trading dashboard: live balances, market data, recent trades, stop-loss curves and a raw tool explorer.",
      },
      { property: "og:title", content: "Optimal — Kraken Trading Dashboard" },
      {
        property: "og:description",
        content:
          "Live Kraken balances, market data, recent trades and stop-loss curves in one dark, data-dense dashboard.",
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
    body: "Auto-refreshing tickers with green/red movement so you read the tape at a glance.",
  },
  {
    icon: Activity,
    title: "Recent trades",
    body: "Your latest fills and orders, timestamped and side-coloured for quick scanning.",
  },
  {
    icon: Terminal,
    title: "Tool explorer",
    body: "Call any bridge tool directly and inspect the raw JSON response — nothing hidden.",
  },
];

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
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <OptimalLogo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => launch("sign-in")}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => launch("sign-up")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-primary">
            Kraken · risk management console
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your Kraken account, in one dense dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Optimal connects to your locally-running kraken-bridge and surfaces live balances,
            market data, recent trades and hand-drawn stop-loss curves — no keys ever leave your
            machine.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => launch("sign-up")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => launch("sign-in")}>
              Sign In
            </Button>
          </div>

          <div className="mt-12 grid gap-2 rounded-lg border border-border bg-card p-4 font-mono text-xs sm:grid-cols-3">
            <Row label="XBT/USD" value="64,812.40" change="+1.84%" up />
            <Row label="ETH/USD" value="3,241.07" change="+0.92%" up />
            <Row label="SOL/USD" value="142.68" change="-2.31%" />
          </div>
        </section>

        <section className="border-t border-border bg-card/30">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-12 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-border bg-card p-4">
                <feature.icon className="h-4 w-4 text-primary" />
                <h2 className="mt-3 text-sm font-semibold text-foreground">{feature.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Stop-loss curves</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Draw price floors over time and let the bridge monitor them continuously.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => launch("sign-in")}>
              Open dashboard
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 font-mono text-[11px] text-muted-foreground">
          Optimal Risk Management · dashboard access requires sign in
        </div>
      </footer>

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

function Row({ label, value, change, up }: { label: string; value: string; change: string; up?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
      <span className={up ? "text-emerald-400" : "text-red-400"}>{change}</span>
    </div>
  );
}
