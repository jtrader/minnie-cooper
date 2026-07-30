import { useCallback, useMemo, useRef, useState } from "react";
import type { CurvePoint, EllipseAnnotation } from "@/lib/kraken/stoploss";
import { formatNumber } from "@/lib/kraken/format";

export type CurveTool = "curve" | "trendline" | "ellipse";

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
  /** Read-only curve of an already-active plan, drawn as a dashed overlay. */
  overlayPoints?: CurvePoint[];
  overlayLabel?: string;
  /** Active drawing tool. Defaults to "curve" (legacy behaviour). */
  tool?: CurveTool;
  /** Visual-only ellipse annotations, never part of the submitted curve. */
  annotations?: EllipseAnnotation[];
  onAnnotationsChange?: (annotations: EllipseAnnotation[]) => void;
  /** Id of the shape to highlight: "curve" for the drawn floor, or an annotation id. */
  highlightedId?: string | null;
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
  overlayPoints,
  overlayLabel,
  tool = "curve",
  annotations,
  onAnnotationsChange,
  highlightedId,
  className,
}: CurveEditorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ from: CurvePoint; to: CurvePoint } | null>(null);
  const shapes = annotations ?? [];

  const range = useMemo(
    () => niceRange([...points, ...(overlayPoints ?? [])], marketPrice),
    [points, overlayPoints, marketPrice],
  );

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
  const sortedOverlay = useMemo(
    () => [...(overlayPoints ?? [])].sort((a, b) => a.t - b.t),
    [overlayPoints],
  );
  const overlayPath = sortedOverlay
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t).toFixed(2)} ${yFor(p.price).toFixed(2)}`)
    .join(" ");

  const linePath = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t).toFixed(2)} ${yFor(p.price).toFixed(2)}`)
    .join(" ");
  const flatPath =
    sorted.length > 0
      ? `M ${PAD.left} ${yFor(sorted[0].price).toFixed(2)} L ${xFor(sorted[0].t).toFixed(2)} ${yFor(sorted[0].price).toFixed(2)} ${linePath.replace(/^M/, "L")} L ${(PAD.left + plotW).toFixed(2)} ${yFor(sorted[sorted.length - 1].price).toFixed(2)}`
      : "";

  const handleBackgroundClick = (event: React.MouseEvent<SVGRectElement>) => {
    if (tool !== "curve") return;
    const point = toDomain(event.clientX, event.clientY);
    if (!point) return;
    onChange([...points, point].sort((a, b) => a.t - b.t));
  };

  const handleBackgroundDown = (event: React.MouseEvent<SVGRectElement>) => {
    if (tool === "curve") return;
    const point = toDomain(event.clientX, event.clientY);
    if (!point) return;
    setDrag({ from: point, to: point });
  };

  const finishDrag = () => {
    if (!drag) return;
    const { from, to } = drag;
    setDrag(null);
    if (tool === "trendline") {
      if (from.t === to.t) return;
      onChange([from, to].sort((a, b) => a.t - b.t));
      return;
    }
    if (tool === "ellipse") {
      const rt = Math.abs(to.t - from.t) / 2;
      const rprice = Math.abs(to.price - from.price) / 2;
      if (rt <= 0 || rprice <= 0) return;
      onAnnotationsChange?.([
        ...shapes,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ct: (from.t + to.t) / 2,
          cprice: (from.price + to.price) / 2,
          rt,
          rprice,
        },
      ]);
    }
  };

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (drag) {
      const point = toDomain(event.clientX, event.clientY);
      if (point) setDrag({ from: drag.from, to: point });
      return;
    }
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
        onMouseUp={() => {
          setDragIndex(null);
          finishDrag();
        }}
        onMouseLeave={() => {
          setDragIndex(null);
          setDrag(null);
        }}
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
          onMouseDown={handleBackgroundDown}
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
          <>
            {highlightedId === "curve" ? (
              <path
                d={flatPath}
                className="fill-none stroke-loss/40"
                strokeWidth={12}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            ) : null}
          <path
            d={flatPath}
            className="fill-none stroke-loss"
            strokeWidth={highlightedId === "curve" ? 4 : 2}
            strokeLinejoin="round"
            pointerEvents="none"
          />
          </>
        ) : null}

        {sortedOverlay.length > 0 ? (
          <g pointerEvents="none">
            <path
              d={overlayPath}
              className="fill-none stroke-gain"
              strokeWidth={2}
              strokeDasharray="8 5"
              strokeLinejoin="round"
            />
            <text
              x={xFor(sortedOverlay[0].t) + 6}
              y={yFor(sortedOverlay[0].price) - 6}
              className="fill-gain font-mono text-[10px]"
            >
              {overlayLabel ?? "Active plan"}
            </text>
          </g>
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
              if (tool !== "curve") return;
              event.stopPropagation();
              setDragIndex(index);
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              onChange(sorted.filter((_, i) => i !== index));
            }}
          />
        ))}

        {shapes.map((shape) => {
          const active = highlightedId === shape.id;
          return (
          <ellipse
            key={shape.id}
            cx={xFor(shape.ct)}
            cy={yFor(shape.cprice)}
            rx={Math.abs(xFor(shape.ct + shape.rt) - xFor(shape.ct))}
            ry={Math.abs(yFor(shape.cprice - shape.rprice) - yFor(shape.cprice))}
            className={`cursor-pointer stroke-primary ${active ? "fill-primary/25" : "fill-primary/10"}`}
            strokeWidth={active ? 5 : 2}
            strokeDasharray="7 5"
            onDoubleClick={(event) => {
              event.stopPropagation();
              onAnnotationsChange?.(shapes.filter((s) => s.id !== shape.id));
            }}
          />
          );
        })}

        {drag && tool === "trendline" ? (
          <line
            x1={xFor(drag.from.t)}
            y1={yFor(drag.from.price)}
            x2={xFor(drag.to.t)}
            y2={yFor(drag.to.price)}
            className="stroke-loss"
            strokeWidth={2}
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        ) : null}

        {drag && tool === "ellipse" ? (
          <ellipse
            cx={(xFor(drag.from.t) + xFor(drag.to.t)) / 2}
            cy={(yFor(drag.from.price) + yFor(drag.to.price)) / 2}
            rx={Math.abs(xFor(drag.to.t) - xFor(drag.from.t)) / 2}
            ry={Math.abs(yFor(drag.to.price) - yFor(drag.from.price)) / 2}
            className="fill-primary/10 stroke-primary"
            strokeWidth={2}
            strokeDasharray="7 5"
            pointerEvents="none"
          />
        ) : null}
      </svg>
      <p className="px-1 pt-1 text-[11px] text-muted-foreground">
        {tool === "curve"
          ? "Click the plane to add a curve point · drag a point to move it · double-click a point to remove it. The floor is flat before the first and after the last point."
          : tool === "trendline"
            ? "Drag from start to end to replace the whole floor with a straight trendline."
            : "Drag a box to draw an ellipse annotation · double-click one to delete it. Ellipses are visual only and are never sent to the bridge."}
      </p>
    </div>
  );
}
