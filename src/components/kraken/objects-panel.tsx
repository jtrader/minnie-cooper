import { Button } from "@/components/ui/button";
import type { CurvePoint, EllipseAnnotation } from "@/lib/kraken/stoploss";

export type ObjectsPanelProps = {
  points: CurvePoint[];
  annotations: EllipseAnnotation[];
  highlightedId: string | null;
  onHighlight: (id: string) => void;
  onClearCurve: () => void;
  onDeleteAnnotation: (id: string) => void;
};

export function ObjectsPanel({
  points,
  annotations,
  highlightedId,
  onHighlight,
  onClearCurve,
  onDeleteAnnotation,
}: ObjectsPanelProps) {
  const curveLabel =
    points.length === 0 ? "No curve yet" : points.length === 2 ? "Trendline" : "Curve";

  const rowClass = (active: boolean) =>
    `flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[11px] transition-colors ${
      active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="max-h-[520px] space-y-2 overflow-y-auto p-2">
      <div className={rowClass(highlightedId === "curve")}>
        <button
          type="button"
          onClick={() => onHighlight("curve")}
          className="min-w-0 flex-1 text-left"
          aria-label={`Highlight ${curveLabel}`}
        >
          <span className="font-medium">{curveLabel}</span>
          <span className="ml-1 font-mono text-[10px]">
            {points.length} pt{points.length === 1 ? "" : "s"}
          </span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px]"
          disabled={points.length === 0}
          onClick={onClearCurve}
        >
          Clear
        </Button>
      </div>

      {annotations.length === 0 ? (
        <p className="px-2 text-[10px] text-muted-foreground">No ellipse annotations.</p>
      ) : null}

      {annotations.map((shape, index) => (
        <div key={shape.id} className={rowClass(highlightedId === shape.id)}>
          <button
            type="button"
            onClick={() => onHighlight(shape.id)}
            className="min-w-0 flex-1 text-left"
            aria-label={`Highlight Ellipse ${index + 1}`}
          >
            Ellipse {index + 1}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-loss hover:text-loss"
            onClick={() => onDeleteAnnotation(shape.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
