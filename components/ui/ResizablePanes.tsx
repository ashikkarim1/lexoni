"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Three-pane resizable layout used by the Matter Workspace. Each side pane
 * has a drag handle; the centre pane fills the remainder. Pane widths persist
 * in `localStorage` keyed by `id`.
 *
 *   <ResizablePanes id="matter-workspace"
 *     left={<ProcessTimeline …/>}
 *     center={<MatterCanvas …/>}
 *     right={<ContextRail …/>} />
 */
type Bounds = { default: number; min: number; max: number };

export function ResizablePanes({
  id,
  left,
  center,
  right,
  leftBounds  = { default: 300, min: 220, max: 420 },
  rightBounds = { default: 360, min: 280, max: 520 },
  className,
}: {
  id: string;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftBounds?: Bounds;
  rightBounds?: Bounds;
  className?: string;
}) {
  const [leftW,  setLeftW]  = useState(leftBounds.default);
  const [rightW, setRightW] = useState(rightBounds.default);

  // Hydrate from localStorage on first paint.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`lexoni.pane.${id}`);
      if (!raw) return;
      const saved = JSON.parse(raw) as { left?: number; right?: number };
      if (typeof saved.left === "number") {
        setLeftW(clamp(saved.left, leftBounds.min, leftBounds.max));
      }
      if (typeof saved.right === "number") {
        setRightW(clamp(saved.right, rightBounds.min, rightBounds.max));
      }
    } catch { /* ignore */ }
  }, [id, leftBounds.min, leftBounds.max, rightBounds.min, rightBounds.max]);

  const persist = useCallback((l: number, r: number) => {
    try { localStorage.setItem(`lexoni.pane.${id}`, JSON.stringify({ left: l, right: r })); } catch {}
  }, [id]);

  return (
    <div className={cn("flex h-full min-h-0", className)}>
      <div style={{ width: leftW }} className="shrink-0 overflow-y-auto min-w-0">{left}</div>
      <DragHandle
        ariaLabel="Resize left pane"
        onDrag={(dx, start) => {
          const next = clamp(start + dx, leftBounds.min, leftBounds.max);
          setLeftW(next);
          return next;
        }}
        getStart={() => leftW}
        onCommit={(next) => persist(next, rightW)}
      />
      <div className="flex-1 overflow-y-auto min-w-0">{center}</div>
      <DragHandle
        ariaLabel="Resize right pane"
        onDrag={(dx, start) => {
          const next = clamp(start - dx, rightBounds.min, rightBounds.max);
          setRightW(next);
          return next;
        }}
        getStart={() => rightW}
        onCommit={(next) => persist(leftW, next)}
      />
      <div style={{ width: rightW }} className="shrink-0 overflow-y-auto min-w-0">{right}</div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function DragHandle({
  ariaLabel,
  onDrag,
  getStart,
  onCommit,
}: {
  ariaLabel: string;
  onDrag: (dx: number, start: number) => number;
  getStart: () => number;
  onCommit: (next: number) => void;
}) {
  const dragging = useRef(false);
  const lastValue = useRef<number>(0);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    const start = getStart();
    lastValue.current = start;
    const startX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
      lastValue.current = onDrag(ev.clientX - startX, start);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onCommit(lastValue.current);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      className="group relative w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-primary-100 transition-colors"
    >
      <div className="absolute inset-y-0 start-1/2 -translate-x-1/2 w-px bg-line group-hover:bg-primary-300" aria-hidden />
    </div>
  );
}
