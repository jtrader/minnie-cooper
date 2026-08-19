import { ArrowUpRight, Dog, Flag, Repeat, Timer, TrendingUp } from "lucide-react";

/**
 * Editorial explainer: the two curved stop-loss lines named after the dogs.
 * Presentation only — no trading logic lives here.
 */

const W = 1000;
const H = 500;

/** Market path: a rising, choppy tape that peaks and then breaks down hard. */
const PRICE =
  "M 40 388 L 138 330 L 232 402 L 384 250 L 515 312 L 706 104 L 928 372";

/** Minnie: the short, tight arc — curls up under the near swing and cuts in early. */
const MINNIE = "M 171 432 C 300 424, 430 394, 458 286";

/** Cooper: the long, wide arc — sweeps under the whole advance and only bites at the top. */
const COOPER = "M 225 450 C 500 444, 700 362, 742 148";

export function HerdingCurves() {
  return (
    <section className="space-y-8" aria-labelledby="herding-heading">
      <header className="max-w-2xl space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Dog className="h-3.5 w-3.5 text-primary" /> The herding method
        </span>
        <h2 id="herding-heading" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Two curves. Two dogs. One flock brought home.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Both Minnie and Cooper are the same shape: a curve that starts flat and steepens as a
          trend matures — patient early, impatient late. The only difference is how wide the arc is
          drawn. Minnie runs a short, tight arc close under the recent swings, so she meets price on
          the first real pullback and banks a smaller, certain gain. Cooper runs a long, wide arc
          under the whole advance, letting the mid-trend shakeouts pass and only closing the gate
          once the trend itself turns. Neither curve ever moves down — like a collie closing on the
          flock, the distance only ever shrinks.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 sm:p-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Diagram: a rising, choppy market path that peaks and reverses. A green dot marks the shared Minnie and Cooper entry just above the lowest V of the tape. A short tight black curve (Minnie) rises steeply and meets price at the mid-trend pullback for an early exit. A longer, wider orange curve (Cooper) sweeps beneath the whole advance and meets price just after the peak for a later, larger exit."
        >
          <defs>
            <linearGradient id="hc-cooper-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cooper)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--cooper)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* paddock grid */}
          {[120, 190, 260, 330, 400].map((y) => (
            <line key={y} x1="30" y1={y} x2="960" y2={y} stroke="var(--border)" strokeWidth="1" />
          ))}

          {/* the zone Cooper allows price to breathe in */}
          <path d={`${COOPER} L 742 452 L 225 452 Z`} fill="url(#hc-cooper-fill)" />

          {/* market tape */}
          <path
            d={PRICE}
            fill="none"
            stroke="var(--chart-1, var(--primary))"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* shared entry — both dogs start below the lowest V of the tape */}
          <line x1="232" y1="402" x2="232" y2="392" stroke="var(--gain)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
          <circle cx="232" cy="392" r="7" fill="var(--gain)" />
          <text x="232" y="374" textAnchor="middle" fontSize="13" className="font-mono" fill="var(--gain)">
            MINNIE & COOPER ENTRY · shared
          </text>

          {/* Cooper curve — long, wide, thick */}
          <path d={COOPER} fill="none" stroke="var(--cooper)" strokeWidth="9" strokeLinecap="round" />
          {/* Minnie curve — short, tight, sharp */}
          <path d={MINNIE} fill="none" stroke="var(--minnie)" strokeWidth="5.5" strokeLinecap="round" />

          {/* Minnie's early exit, on the first pullback */}
          <circle cx="458" cy="286" r="7" fill="var(--minnie)" />
          <line x1="458" y1="286" x2="458" y2="162" stroke="var(--minnie)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          <text x="448" y="152" textAnchor="end" fontSize="13" className="font-mono" fill="var(--minnie)">
            MINNIE EXIT · early, smaller
          </text>

          {/* Cooper's late exit, just after the turn */}
          <circle cx="742" cy="148" r="8" fill="var(--cooper)" />
          <line x1="742" y1="148" x2="742" y2="72" stroke="var(--cooper)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
          <text x="752" y="64" fontSize="13" className="font-mono" fill="var(--cooper)">
            COOPER EXIT · late, larger
          </text>

          {/* labels */}
          <text x="40" y="486" fontSize="12" className="font-mono" fill="var(--muted-foreground)">
            trend begins — both curves sit flat and far below price
          </text>
        </svg>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-primary" /> market tape
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-6 rounded bg-minnie" /> Minnie curve · tight arc
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-6 rounded bg-cooper" /> Cooper curve · wide arc
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-card-foreground">Minnie</h3>
            <span className="rounded-md bg-minnie/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground">
              Short term · tight arc
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The smaller, faster dog works close to the flock. Her arc is drawn short and steep just
            under the recent swings, so the first genuine pullback puts price into the curve and the
            trade is closed. You forfeit the rest of the run, but the gain you already made is never
            handed back. Many small, clean gathers.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs">
            <Stat icon={Timer} label="Horizon" value="Minutes → hours" />
            <Stat icon={Repeat} label="Exits" value="Early, frequent" />
            <Stat icon={ArrowUpRight} label="Arc" value="Short, steep, close" />
            <Stat icon={Flag} label="Guards" value="Gains already made" />
          </dl>
        </article>

        <article className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-card-foreground">Cooper</h3>
            <span className="rounded-md bg-cooper/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-cooper">
              Long term · wide arc
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The bigger, calmer dog holds the far side of the paddock. His arc starts wider and lower,
            so mid-trend shakeouts pass straight through it untouched. It steepens as the advance
            matures until it is nearly vertical at the top — meaning the exit lands just after the
            trend actually breaks, capturing the bulk of the move in one gather.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs">
            <Stat icon={Timer} label="Horizon" value="Days → weeks" />
            <Stat icon={TrendingUp} label="Exits" value="Late, rare, large" />
            <Stat icon={ArrowUpRight} label="Arc" value="Long, wide, patient" />
            <Stat icon={Flag} label="Guards" value="The whole run" />
          </dl>
        </article>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/60 p-6">
        <h3 className="font-display text-base font-semibold text-foreground">Why two curves beat one</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A single tight curve is shaken out by ordinary noise. A single wide curve hands back months
          of gains before it triggers. Run both arcs on the same position and they cover each other's
          flank: Minnie takes a certain profit off the first pullback and keeps the account earning,
          while Cooper stays out wide so a share of the position is still on when the real move
          arrives. One rounds up the strays. The other brings the flock through the gate.
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
