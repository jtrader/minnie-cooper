import { useCallback, useEffect, useRef, useState } from "react";
import type { CurvePoint, EllipseAnnotation } from "@/lib/kraken/stoploss";

export type DrawingSnapshot = {
  points: CurvePoint[];
  annotations: EllipseAnnotation[];
};

const LIMIT = 60;
/** Continuous gestures (point drags, shape drags) settle within this window. */
const COMMIT_DELAY = 300;

const key = (snapshot: DrawingSnapshot) =>
  JSON.stringify([
    snapshot.points.map((p) => [p.t, p.price]),
    snapshot.annotations.map((a) => [a.id, a.ct, a.cprice, a.rt, a.rprice]),
  ]);

const clone = (snapshot: DrawingSnapshot): DrawingSnapshot => ({
  points: snapshot.points.map((p) => ({ ...p })),
  annotations: snapshot.annotations.map((a) => ({ ...a })),
});

/**
 * Undo/redo for the drawing surface (curve point drags, trendline edits,
 * ellipse creation/deletion). Changes are coalesced so one drag gesture is a
 * single history entry rather than one per pointer move.
 */
export function useDrawingHistory(
  snapshot: DrawingSnapshot,
  apply: (snapshot: DrawingSnapshot) => void,
) {
  const pastRef = useRef<DrawingSnapshot[]>([]);
  const futureRef = useRef<DrawingSnapshot[]>([]);
  const currentRef = useRef<DrawingSnapshot>(clone(snapshot));
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);

  const snapshotKey = key(snapshot);
  const currentKey = key(currentRef.current);

  useEffect(() => {
    if (snapshotKey === currentKey) return;
    const timer = window.setTimeout(() => {
      pastRef.current = [...pastRef.current, currentRef.current].slice(-LIMIT);
      futureRef.current = [];
      currentRef.current = clone(snapshot);
      rerender();
    }, COMMIT_DELAY);
    return () => window.clearTimeout(timer);
  }, [snapshotKey, currentKey, snapshot, rerender]);

  const undo = useCallback(() => {
    const prev = pastRef.current[pastRef.current.length - 1];
    if (!prev) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, currentRef.current];
    currentRef.current = prev;
    apply(clone(prev));
    rerender();
  }, [apply, rerender]);

  const redo = useCallback(() => {
    const next = futureRef.current[futureRef.current.length - 1];
    if (!next) return;
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, currentRef.current];
    currentRef.current = next;
    apply(clone(next));
    rerender();
  }, [apply, rerender]);

  /** Drop history and rebase on a new baseline (e.g. after switching pair). */
  const reset = useCallback(
    (base: DrawingSnapshot) => {
      pastRef.current = [];
      futureRef.current = [];
      currentRef.current = clone(base);
      rerender();
    },
    [rerender],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      const code = event.key.toLowerCase();
      if (code === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (code === "y" || (code === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    undo,
    redo,
    reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
