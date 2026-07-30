import { useCallback, useMemo, useRef, useState } from "react";
import type { CurvePoint } from "@/lib/kraken/stoploss";
import { formatNumber } from "@/lib/kraken/format";

/**
 * Implementation-agnostic contract for a price-vs-time curve drawing surface.
 * Swap the SVG implementation below for TradingView's drawing-tools API later
 * without touching callers: they only depend on this props shape.
 */
export type CurveEditorProps = {
  points: CurvePoint[];
  onChange: (points: CurvePoint[]) => void;
  /** Start of the x-axis (ms epoch). */
  startTime: number;
  /** End of the x-axis (ms epoch). */
  endTime: number;
  /** Latest market price, used to auto-range the y-axis. */
  marketPrice: number | null;
  className?: string;
};

const WIDTH = 1000;
const HEIGHT = 380;
const PAD = { top: 16, right: 64, bottom: 28, left: 12 };

function niceRange(points: CurvePoint[], marketPrice: number | null) {
  const values = points.map((p) => p.price);
  if (marketPrice !== null && Number.isFinite(marketPrice)) values.push(marketPrice);
  if (values.length === 0) return { min: 0, max: 100 };
  const base = marketPrice && Number.isFinite(marketPrice) ? marketPrice : values[0];
  let min = Math.min(...values, base * 0.94);
  let max = Math.max(...values, base * 1.04);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

export function CurveEditor({
  points,
  onChange,
  startTime,
  endTime,
  marketPrice,
  className,
}: CurveEditorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const range = useMemo(() => niceRange(points, marketPrice), [points, marketPrice]);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const xFor = useCallback(
    (t: number) => PAD.left + ((t - startTime) / Math.max(1, endTime - startTime)) * plotW,
    [startTime, endTime, plotW],
  );
  const yFor = useCallback(
    (price: number) =>
      PAD.top + (1 - (price - range.min) / Math.max(1e-9, range.max - range.min)) * plotH,
    [range, plotH],
  );

  const toDomain = useCallback(
    (clientX: number, clientY: number): CurvePoint | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * WIDTH;
      const py = ((clientY - rect.top) / rect.height) * HEIGHT;
      const ratioX = Math.min(1, Math.max(0, (px - PAD.left) / plotW));
      const ratioY = Math.min(1, Math.max(0, (py - PAD.top) / plotH));
      return {
        t: Math.round(startTime + ratioX * (endTime - startTime)),
        price: range.max - ratioY * (range.max - range.min),
      };
    },
    [startTime, endTime, plotW, plotH, range],
  );

  const sorted = useMemo(() => [...points].sort((a, b) => a.t - b.t), [points]);

  const linePath = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t).toFixed(2)} ${yFor(p.price).toFixed(2)}`)
    .join(" ");
  const flatPath =
    sorted.length > 0
      ? `M ${PAD.left} ${yFor(sorted[0].price).toFixed(2)} L ${xFor(sorted[0].t).toFixed(2)} ${yFor(sorted[0].price).toFixed(2)} ${linePath.replace(/^M/, "L")} L ${(PAD.left + plotW).toFixed(2)} ${yFor(sorted[sorted.length - 1].price).toFixed(2)}`
      : "";

  const handleBackgroundClick = (event: React.MouseEvent<SVGRectElement>) => {
    const point = toDomain(event.clientX, event.clientY);
    if (!point) return;
    onChange([...points, point].sort((a, b) => a.t - b.t));
  };

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (dragIndex === null) return;
    const point = toDomain(event.clientX, event.clientY);
    if (!point) return;
    const next = [...sorted];
    next[dragIndex] = point;
    onChange(next);
  };

  const timeTicks = Array.from({ length: 5 }, (_, i) => startTime + ((endTime - startTime) * i) / 4);
  const priceTicks = Array.from({ length: 5 }, (_, i) => range.min + ((range.max - range.min) * i) / 4);

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[380px] w-full touch-none select-none"
        onMouseMove={handleMove}
        onMouseUp={() => setDragIndex(null)}
        onMouseLeave={() => setDragIndex(null)}
        role="application"
        aria-label="Stop-loss curve editor: click to add a point, drag points to adjust"
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotW}
          height={plotH}
          className="fill-transparent"
          onClick={handleBackgroundClick}
        />

        {priceTicks.map((price) => (
          <g key={`p-${price}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={yFor(price)}
              y2={yFor(price)}
              className="stroke-border/40"
              strokeWidth={1}
              pointerEvents="none"
            />
            <text
              x={PAD.left + plotW + 6}
              y={yFor(price) + 3}
              className="fill-muted-foreground font-mono text-[10px]"
              pointerEvents="none"
            >
              {formatNumber(price, 2)}
            </text>
          </g>
        ))}

        {timeTicks.map((t) => (
          <text
            key={`t-${t}`}
            x={xFor(t)}
            y={HEIGHT - 10}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[10px]"
            pointerEvents="none"
          >
            {new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </text>
        ))}

        {marketPrice !== null && Number.isFinite(marketPrice) ? (
          <g pointerEvents="none">
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={yFor(marketPrice)}
              y2={yFor(marketPrice)}
              className="stroke-primary"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <text
              x={PAD.left + 6}
              y={yFor(marketPrice) - 5}
              className="fill-primary font-mono text-[10px]"
            >
              market {formatNumber(marketPrice, 2)}
            </text>
          </g>
        ) : null}

        {sorted.length > 0 ? (
          <path
            d={flatPath}
            className="fill-none stroke-loss"
            strokeWidth={2}
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ) : null}

        {sorted.map((point, index) => (
          <circle
            key={`${point.t}-${index}`}
            cx={xFor(point.t)}
            cy={yFor(point.price)}
            r={7}
            className="cursor-grab fill-loss stroke-background"
            strokeWidth={2}
            onMouseDown={(event) => {
              event.stopPropagation();
              setDragIndex(index);
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              onChange(sorted.filter((_, i) => i !== index));
            }}
          />
        ))}
      </svg>
      <p className="px-1 pt-1 text-[11px] text-muted-foreground">
        Click the plane to add a curve point · drag a point to move it · double-click a point to
        remove it. The floor is flat before the first and after the last point.
      </p>
    </div>
  );
}
