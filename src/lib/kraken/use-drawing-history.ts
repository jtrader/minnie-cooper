import { useCallback, useEffect, useRef, useState } from "react";
import type { CurvePoint, EllipseAnnotation } from "@/lib/kraken/stoploss";

export type DrawingSnapshot = {
  points: CurvePoint[];
  annotations: EllipseAnnotation[];
};

type Stack = { past: DrawingSnapshot[]; future: DrawingSnapshot[] };

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
 * single history entry rather than one per pointer move. History stacks are
 * kept per trading pair for the browser session, so switching away and back
 * preserves that pair's undo history.
 */
export function useDrawingHistory(
  pair: string,
  snapshot: DrawingSnapshot,
  apply: (snapshot: DrawingSnapshot) => void,
) {
  const stacksRef = useRef<Map<string, Stack>>(new Map());
  const currentRef = useRef<Map<string, DrawingSnapshot>>(new Map());
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);

  const stackFor = useCallback((p: string): Stack => {
    let stack = stacksRef.current.get(p);
    if (!stack) {
      stack = { past: [], future: [] };
      stacksRef.current.set(p, stack);
    }
    return stack;
  }, []);

  // Rebase the current baseline whenever the active pair changes; never treat
  // a pair switch as an edit.
  const pairRef = useRef(pair);
  if (pairRef.current !== pair) {
    pairRef.current = pair;
    currentRef.current.set(pair, clone(snapshot));
    stackFor(pair);
  }
  if (!currentRef.current.has(pair)) currentRef.current.set(pair, clone(snapshot));

  const snapshotKey = key(snapshot);
  const currentKey = key(currentRef.current.get(pair)!);

  useEffect(() => {
    if (snapshotKey === currentKey) return;
    const timer = window.setTimeout(() => {
      const stack = stackFor(pair);
      stack.past = [...stack.past, currentRef.current.get(pair)!].slice(-LIMIT);
      stack.future = [];
      currentRef.current.set(pair, clone(snapshot));
      rerender();
    }, COMMIT_DELAY);
    return () => window.clearTimeout(timer);
  }, [snapshotKey, currentKey, snapshot, pair, stackFor, rerender]);

  const undo = useCallback(() => {
    const stack = stackFor(pair);
    const prev = stack.past[stack.past.length - 1];
    if (!prev) return;
    stack.past = stack.past.slice(0, -1);
    stack.future = [...stack.future, currentRef.current.get(pair)!];
    currentRef.current.set(pair, prev);
    apply(clone(prev));
    rerender();
  }, [apply, pair, stackFor, rerender]);

  const redo = useCallback(() => {
    const stack = stackFor(pair);
    const next = stack.future[stack.future.length - 1];
    if (!next) return;
    stack.future = stack.future.slice(0, -1);
    stack.past = [...stack.past, currentRef.current.get(pair)!];
    currentRef.current.set(pair, next);
    apply(clone(next));
    rerender();
  }, [apply, pair, stackFor, rerender]);

  /** Drop this pair's history and rebase on a new baseline. */
  const reset = useCallback(
    (base: DrawingSnapshot) => {
      stacksRef.current.set(pair, { past: [], future: [] });
      currentRef.current.set(pair, clone(base));
      rerender();
    },
    [pair, rerender],
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

  const stack = stackFor(pair);
  return {
    undo,
    redo,
    reset,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
  };
}
