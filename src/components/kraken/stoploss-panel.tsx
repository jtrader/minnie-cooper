import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { CurveEditor } from "./curve-editor";
import { TradingViewChart } from "./tradingview-chart";
import { MarketsPanel } from "./markets-panel";
import { callTool, extractPayload, listTools } from "@/lib/kraken/client";
import { guessTool, pairArgs } from "@/lib/kraken/discovery";
import { parseTicker } from "@/lib/kraken/parse";
import {
  cancelStopLossPlan,
  createStopLossPlan,
  curvePriceAt,
  listStopLossPlans,
  type CurvePoint,
  type StopLossPlan,
} from "@/lib/kraken/stoploss";
import { formatNumber, formatTime } from "@/lib/kraken/format";
import {
  DEFAULT_HOURS,
  TIMEFRAMES,
  clearDraft,
  listDraftPairs,
  loadDraft,
  loadTimeframe,
  saveDraft,
  saveTimeframe,
  type ChartTimeframe,
} from "@/lib/kraken/drafts";
import type { BridgeSettings } from "@/lib/kraken/types";

const HORIZONS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
];

export function StopLossPanel({ settings, configured }: { settings: BridgeSettings; configured: boolean }) {
  const queryClient = useQueryClient();
  const [pair, setPair] = useState("XBTUSD");
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [volume, setVolume] = useState("");
  const [armed, setArmed] = useState(false);
  const [points, setPoints] = useState<CurvePoint[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("15");
  const [draftPairs, setDraftPairs] = useState<Set<string>>(new Set());
  const hydratedRef = useRef(false);

  const refreshDraftPairs = useCallback(() => setDraftPairs(new Set(listDraftPairs())), []);

  // Restore the selected pair's draft on mount (survives a full page reload).
  useEffect(() => {
    const restored = loadDraft(pair);
    setPoints(restored.points);
    setHours(restored.hours);
    setTimeframe(loadTimeframe());
    refreshDraftPairs();
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPair = useCallback(
    (next: string) => {
      if (next === pair) return;
      const restored = loadDraft(next);
      setPair(next);
      setPoints(restored.points);
      setHours(restored.hours);
    },
    [pair],
  );

  // Debounced per-pair draft persistence.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = window.setTimeout(() => {
      saveDraft(pair, { points, hours });
      refreshDraftPairs();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pair, points, hours, refreshDraftPairs]);

  const pickTimeframe = (value: ChartTimeframe) => {
    setTimeframe(value);
    saveTimeframe(value);
  };

  const toolsQuery = useQuery({
    queryKey: ["tools", settings.baseUrl, settings.token],
    enabled: configured,
    retry: false,
    queryFn: () => listTools(settings),
  });
  const tools = toolsQuery.data ?? [];
  const tickerTool = guessTool(tools, "ticker").tool;

  const ticker = useQuery({
    queryKey: ["ticker", settings.baseUrl, tickerTool?.name, pair],
    enabled: configured && Boolean(tickerTool),
    retry: false,
    refetchInterval: 10_000,
    queryFn: async () =>
      extractPayload(await callTool(settings, tickerTool!.name, pairArgs(tickerTool, pair))),
  });
  const marketPrice = parseTicker(ticker.data, pair).price;

  const plans = useQuery({
    queryKey: ["stoploss", settings.baseUrl, settings.token],
    enabled: configured,
    retry: false,
    refetchInterval: 7_000,
    queryFn: () => listStopLossPlans(settings),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createStopLossPlan(settings, {
        pair,
        points: [...points].sort((a, b) => a.t - b.t),
        volume: volume.trim() ? Number(volume) : undefined,
        dryRun: !armed,
      }),
    onSuccess: () => {
      setPoints([]);
      clearDraft(pair);
      refreshDraftPairs();
      void queryClient.invalidateQueries({ queryKey: ["stoploss"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelStopLossPlan(settings, id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["stoploss"] }),
  });

  const sorted = useMemo(() => [...points].sort((a, b) => a.t - b.t), [points]);
  const validPoints = sorted.length >= 2 && sorted.every((p, i) => i === 0 || p.t > sorted[i - 1].t);
  const nowCurve = curvePriceAt(sorted, Date.now());

  const endTime = startTime + hours * 3_600_000;
  const activePlan = (plans.data ?? []).find(
    (plan) => plan.pair === pair && plan.status === "active",
  );
  const overlayPoints = activePlan?.points ?? [];
  const activePlanPairs = useMemo(
    () =>
      new Set(
        (plans.data ?? []).filter((plan) => plan.status === "active").map((plan) => plan.pair),
      ),
    [plans.data],
  );

  // Always widen the visible domain so restored points are never clipped out of view.
  const domainPoints = [...sorted, ...overlayPoints];
  const domainStart = domainPoints.reduce((min, p) => Math.min(min, p.t), startTime);
  const domainEnd = domainPoints.reduce((max, p) => Math.max(max, p.t), endTime);

  const submit = () => {
    if (armed) {
      setConfirmOpen(true);
      return;
    }
    createMutation.mutate();
  };

  if (!configured) {
    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Configure the bridge base URL and bearer token in Settings to use stop-loss plans.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
      <MarketsPanel
        pair={pair}
        onSelect={selectPair}
        activePlanPairs={activePlanPairs}
        draftPairs={draftPairs}
      />
      <div className="min-w-0 space-y-3">
      <section className="rounded-lg border border-border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold tracking-tight">Draw stop-loss curve</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                candles
              </span>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => pickTimeframe(tf.value)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                    timeframe === tf.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                horizon
              </span>
            {HORIZONS.map((horizon) => (
              <button
                key={horizon.label}
                type="button"
                onClick={() => setHours(horizon.hours)}
                className={`rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                  hours === horizon.hours
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {horizon.label}
              </button>
            ))}
            </div>
          </div>
        </header>

        <div className="p-3">
          <div className="relative overflow-hidden rounded-md border border-border/60">
            <div className="absolute inset-0 opacity-60">
              <TradingViewChart symbol={pair} interval={timeframe} />
            </div>
            <div className="relative">
              <CurveEditor
                points={points}
                onChange={setPoints}
                startTime={domainStart}
                endTime={domainEnd}
                marketPrice={marketPrice}
                overlayPoints={overlayPoints}
                overlayLabel={
                  activePlan
                    ? `Active plan · floor ${formatNumber(
                        activePlan.lastCurvePrice ?? curvePriceAt(activePlan.points, Date.now()),
                        2,
                      )}`
                    : undefined
                }
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Pair</Label>
                <Input
                  value={pair}
                  onChange={(event) => selectPair(event.target.value.toUpperCase())}
                  className="h-7 font-mono text-[11px]"
                  aria-label="Trading pair"
                />
                <p className="text-[10px] text-muted-foreground">
                  Pick from Markets, or retype if the bridge uses a different code.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sl-volume" className="text-[11px]">
                  Volume (optional)
                </Label>
                <Input
                  id="sl-volume"
                  value={volume}
                  onChange={(event) => setVolume(event.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 0.25"
                  className="h-7 font-mono text-[11px]"
                />
                <p className="text-[10px] text-muted-foreground">
                  Left blank, the bridge decides the sell size.
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Mode</Label>
                <div
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${
                    armed ? "border-loss bg-loss/15" : "border-border bg-muted/30"
                  }`}
                >
                  <Switch checked={armed} onCheckedChange={setArmed} aria-label="Arm plan" />
                  {armed ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-loss">
                      <ShieldAlert className="h-3.5 w-3.5" /> Armed — places real orders
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" /> Dry run — records only
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-1">
              <p className="font-mono text-[11px] text-muted-foreground">
                {sorted.length} point{sorted.length === 1 ? "" : "s"} · floor now{" "}
                {formatNumber(nowCurve, 2)} · market {formatNumber(marketPrice, 2)}
              </p>
              <Button
                onClick={submit}
                disabled={!validPoints || createMutation.isPending}
                variant={armed ? "destructive" : "default"}
                size="sm"
              >
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {armed ? "Create ARMED plan" : "Create dry-run plan"}
              </Button>
              {!validPoints ? (
                <p className="text-[10px] text-muted-foreground">
                  Place at least 2 points at different times.
                </p>
              ) : null}
            </div>
          </div>

          {createMutation.error ? (
            <div className="mt-3">
              <BridgeErrorNotice error={createMutation.error} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold tracking-tight">Stop-loss plans</h2>
          {plans.isFetching ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : null}
        </header>
        <div className="space-y-2 p-3">
          {plans.error ? <BridgeErrorNotice error={plans.error} /> : null}
          {!plans.error && (plans.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No stop-loss plans yet.</p>
          ) : null}
          {(plans.data ?? []).map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              onCancel={() => cancelMutation.mutate(plan.id)}
              cancelling={cancelMutation.isPending && cancelMutation.variables === plan.id}
            />
          ))}
          {cancelMutation.error ? <BridgeErrorNotice error={cancelMutation.error} /> : null}
        </div>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-loss">Arm a live stop-loss?</AlertDialogTitle>
            <AlertDialogDescription>
              This will place a real sell order when triggered. Pair {pair}
              {volume.trim() ? `, volume ${volume}` : ""}. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-loss text-white hover:bg-loss/90"
              onClick={() => createMutation.mutate()}
            >
              Yes, arm it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const STATUS_CLASS: Record<StopLossPlan["status"], string> = {
  active: "bg-primary/15 text-primary border-primary/40",
  triggered: "bg-gain/15 text-gain border-gain/40",
  cancelled: "bg-muted text-muted-foreground border-border",
  error: "bg-loss/15 text-loss border-loss/40",
};

function PlanRow({
  plan,
  onCancel,
  cancelling,
}: {
  plan: StopLossPlan;
  onCancel: () => void;
  cancelling: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-2.5 text-xs ${
        plan.dryRun ? "border-border bg-muted/20" : "border-loss/50 bg-loss/5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium">{plan.pair}</span>
        <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${STATUS_CLASS[plan.status]}`}>
          {plan.status}
        </span>
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
            plan.dryRun
              ? "border-border bg-muted text-muted-foreground"
              : "border-loss bg-loss/20 text-loss"
          }`}
        >
          {plan.dryRun ? "Dry run" : "Armed · live orders"}
        </span>
        {plan.volume ? (
          <span className="font-mono text-[11px] text-muted-foreground">vol {plan.volume}</span>
        ) : null}
        {plan.status === "active" ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Cancel
          </Button>
        ) : null}
      </div>

      <div className="mt-1.5 grid gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <span>market {formatNumber(plan.lastMarketPrice, 2)}</span>
        <span>floor {formatNumber(plan.lastCurvePrice, 2)}</span>
        <span>checked {formatTime(plan.lastCheckedAt)}</span>
        <span>
          {plan.triggeredAt ? `triggered ${formatTime(plan.triggeredAt)}` : `created ${formatTime(plan.createdAt)}`}
        </span>
      </div>

      {plan.lastError ? (
        <div className="mt-2 flex items-start gap-2 rounded border border-loss/40 bg-loss/10 px-2 py-1.5 text-[11px] text-loss">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{plan.lastError}</span>
        </div>
      ) : null}
    </div>
  );
}
