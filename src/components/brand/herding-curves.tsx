import { ArrowDownRight, Dog, Flag, Repeat, Timer, TrendingUp } from "lucide-react";

/**
 * Editorial explainer: the two stop-loss curve styles named after the dogs.
 * Presentation only — no trading logic lives here.
 */

const W = 1000;
const H = 420;

/** Market path (a rising, choppy tape). */
const PRICE =
  "M 40 330 L 110 300 L 165 322 L 225 268 L 285 292 L 350 232 L 415 262 L 480 196 L 545 226 L 610 168 L 675 200 L 740 140 L 805 176 L 870 108 L 940 132";

/** Minnie: tight, sharp, hugs every swing low. */
const MINNIE =
  "M 40 352 L 110 330 L 165 344 L 225 296 L 285 314 L 350 258 L 415 284 L 480 224 L 545 250 L 610 196 L 675 224 L 740 168 L 805 200 L 870 136 L 940 158";

/** Cooper: one long, patient floor sweeping under the whole trend. */
const COOPER = "M 40 384 C 260 372, 470 322, 640 274 S 860 206, 940 186";

/** Where Minnie takes small, frequent profits. */
const MINNIE_TAKES = [225, 350, 480, 610, 740, 870];

function priceYAt(x: number) {
  const pts = PRICE.replace(/[ML]/g, "")
    .trim()
    .split(/\s+/)
    .map(Number);
  for (let i = 0; i < pts.length; i += 2) if (pts[i] === x) return pts[i + 1];
  return 200;
}

export function HerdingCurves() {
  return (
    <section className="space-y-8" aria-labelledby="herding-heading">
      <header className="max-w-2xl space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Dog className="h-3.5 w-3.5 text-primary" /> The herding method
        </span>
        <h2 id="herding-heading" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Two dogs. Two curves. One flock of profit.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          A border collie never chases the whole flock at once. It works the edges — nudging strays
          back, closing the gap behind them, never letting the group drift downhill. Your open
          profit behaves exactly like a flock: it scatters, it wanders, and left alone it walks
          straight back down the paddock. Minnie and Cooper are the two working lines you draw
          under it. Minnie holds the near edge. Cooper walks the whole field home.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 sm:p-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Diagram: a rising, choppy market path with Minnie's tight short-term stop curve hugging each swing low and Cooper's long sweeping curve running underneath the whole trend, with profit taken at each contact point."
        >
          <defs>
            <linearGradient id="hc-cooper-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cooper)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--cooper)" stopOpacity="0" />
            </linearGradient>
            <marker id="hc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
            </marker>
          </defs>

          {/* paddock grid */}
          {[100, 160, 220, 280, 340].map((y) => (
            <line key={y} x1="30" y1={y} x2="950" y2={y} stroke="var(--border)" strokeWidth="1" />
          ))}

          {/* the gate / pen where profit is banked */}
          <rect x="946" y="80" width="22" height="300" rx="6" fill="var(--gain)" opacity="0.12" />
          <text
            x="957"
            y="70"
            textAnchor="middle"
            className="font-mono"
            fontSize="11"
            fill="var(--gain)"
          >
            PEN
          </text>

          {/* Cooper zone */}
          <path d={`${COOPER} L 940 396 L 40 396 Z`} fill="url(#hc-cooper-fill)" />

          {/* market tape */}
          <path d={PRICE} fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* the flock: open profit drifting above the floor */}
          {MINNIE_TAKES.map((x) => (
            <g key={`flock-${x}`}>
              <circle cx={x} cy={priceYAt(x) - 26} r="7" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="1.5" />
              <circle cx={x + 14} cy={priceYAt(x) - 14} r="5" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="1.2" opacity="0.8" />
            </g>
          ))}

          {/* Cooper curve */}
          <path d={COOPER} fill="none" stroke="var(--cooper)" strokeWidth="4" strokeLinecap="round" />
          {/* Minnie curve */}
          <path d={MINNIE} fill="none" stroke="var(--minnie)" strokeWidth="2.5" strokeDasharray="7 5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Minnie's small, frequent profit takes */}
          {MINNIE_TAKES.map((x) => {
            const y = priceYAt(x);
            return (
              <g key={`take-${x}`}>
                <line x1={x} y1={y} x2={x} y2={y + 26} stroke="var(--minnie)" strokeWidth="1.5" markerEnd="url(#hc-arrow)" opacity="0.7" />
                <circle cx={x} cy={y} r="5" fill="var(--minnie)" />
              </g>
            );
          })}

          {/* Cooper's single, large take at the gate */}
          <circle cx="940" cy="132" r="8" fill="var(--cooper)" />
          <line x1="940" y1="132" x2="940" y2="186" stroke="var(--cooper)" strokeWidth="2" strokeDasharray="4 4" />

          {/* labels */}
          <text x="60" y="348" fontSize="13" className="font-mono" fill="var(--minnie)">
            MINNIE · tight edge
          </text>
          <text x="60" y="392" fontSize="13" className="font-mono" fill="var(--cooper)">
            COOPER · long sweep
          </text>
          <text x="120" y="284" fontSize="12" className="font-mono" fill="var(--muted-foreground)">
            open profit (the flock)
          </text>
        </svg>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-foreground" /> market tape
          </span>
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-6 border-t-2 border-dashed border-minnie" /> Minnie floor
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-6 rounded bg-cooper" /> Cooper floor
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gain" /> profit banked
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-card-foreground">Minnie</h3>
            <span className="rounded-md bg-minnie/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground">
              Short term · sharp
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The smaller, faster dog. She works close to the flock — quick outruns, sharp turns,
            constant pressure. Her curve sits just under each swing low, so any stray move down is
            met immediately. You give up the big run, but you never give back what you already
            earned. Many small, clean gathers.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs">
            <Stat icon={Timer} label="Horizon" value="Minutes → hours" />
            <Stat icon={Repeat} label="Takes" value="Frequent, small" />
            <Stat icon={ArrowDownRight} label="Buffer" value="Tight (0.5–2%)" />
            <Stat icon={Flag} label="Guards" value="Realised gains" />
          </dl>
        </article>

        <article className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-card-foreground">Cooper</h3>
            <span className="rounded-md bg-cooper/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-cooper">
              Long term · steady
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The bigger, calmer dog. He holds the far side of the paddock and walks the whole flock
            home in one long line. His curve rides well below the noise, rising only as the trend
            rises — a ratchet that never loosens. Volatility is allowed to breathe; a genuine trend
            break is not.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs">
            <Stat icon={Timer} label="Horizon" value="Days → weeks" />
            <Stat icon={TrendingUp} label="Takes" value="Rare, large" />
            <Stat icon={ArrowDownRight} label="Buffer" value="Wide (5–15%)" />
            <Stat icon={Flag} label="Guards" value="The whole run" />
          </dl>
        </article>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/60 p-6">
        <h3 className="font-display text-base font-semibold text-foreground">Why two dogs beat one</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A single tight stop gets shaken out by ordinary noise. A single wide stop hands back
          months of gains in one bad session. Run both curves on the same position and they cover
          each other's flank: Minnie skims profit off every swing and keeps the account earning,
          while Cooper stays out wide so the position is still on when the real move arrives.
          One rounds up the strays. The other brings the flock through the gate.
        </p>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3 text-primary" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}