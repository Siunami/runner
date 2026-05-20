/*
 * Sprite Positioning — stripped-down demo of the four placement rules.
 *
 * One mock macOS desktop, one draggable window, one sprite. No panel, no
 * chat, no integrations. The sprite anchors to:
 *   - Tier 1: top-right outside the window (default when room on right)
 *   - Tier 2: top-left outside (when no room right but room left)
 *   - Tier 3: bottom corner inside (fullscreen, or no outside room)
 *     - bottom-right by default; double-click sprite to flip to bottom-left
 *
 * Demo arc: drag the window to see Tier 1 ↔ Tier 2; click green to maximize
 * and watch the sprite land in the bottom-right corner; double-click to flip
 * corners; unmaximize and watch it return to the outside anchor.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./SpritePositioning.css";

const BUNNY_W = 56;
const BUNNY_H = 56;
const PAD = 12;
const PAD_FULLSCREEN = 20;
const MENU_BAR_H = 28;
// Inset around the window when "fullscreen" so the OS background is still
// visible on every side — the demo needs to read as a window-in-a-desktop
// rather than a chromeless takeover.
const FULLSCREEN_INSET = 32;
// Minimum free width on a side for the sprite to dock outside (Tier 1 / 2).
// When neither side has at least this much room, we fall to Tier 3.
const OUTSIDE_NEEDED = 96;

type Side = "tr-out" | "tl-out" | "br-in" | "bl-in";
type CornerPref = "bottom-right" | "bottom-left";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowState extends Rect {
  isFullScreen: boolean;
  prevRect: Rect | null;
}

function initialWindow(viewport: { w: number; h: number }): WindowState {
  const width = Math.min(560, viewport.w - 360);
  const height = Math.min(420, viewport.h - 200);
  return {
    x: Math.max(80, Math.round(viewport.w * 0.18)),
    y: Math.max(MENU_BAR_H + 40, Math.round(viewport.h * 0.16)),
    width,
    height,
    isFullScreen: false,
    prevRect: null,
  };
}

export default function SpritePositioning() {
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  const [win, setWin] = useState<WindowState>(() => initialWindow(viewport));
  const [winInit, setWinInit] = useState(false);
  const [cornerPref, setCornerPref] = useState<CornerPref>("bottom-right");
  const [bunnyFrame, setBunnyFrame] = useState<"idle_1" | "idle_2">("idle_1");

  useEffect(() => {
    if (winInit) return;
    setWin(initialWindow(viewport));
    setWinInit(true);
  }, [viewport, winInit]);

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setBunnyFrame((f) => (f === "idle_1" ? "idle_2" : "idle_1")),
      4000,
    );
    return () => window.clearInterval(id);
  }, []);

  /* ───── window drag ───── */
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const onTitleBarDown = useCallback(
    (event: React.PointerEvent) => {
      if (win.isFullScreen) return;
      dragRef.current = {
        offsetX: event.clientX - win.x,
        offsetY: event.clientY - win.y,
      };
      setIsDragging(true);
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    [win.isFullScreen, win.x, win.y],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setWin((current) => {
        if (current.isFullScreen) return current;
        const nextX = Math.min(
          Math.max(event.clientX - d.offsetX, -current.width + 120),
          viewport.w - 120,
        );
        const nextY = Math.min(
          Math.max(event.clientY - d.offsetY, MENU_BAR_H + 4),
          viewport.h - 60,
        );
        return { ...current, x: nextX, y: nextY };
      });
    };
    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [viewport.w, viewport.h]);

  const toggleFullScreen = useCallback(() => {
    setWin((current) => {
      if (current.isFullScreen && current.prevRect) {
        return {
          ...current,
          isFullScreen: false,
          x: current.prevRect.x,
          y: current.prevRect.y,
          width: current.prevRect.width,
          height: current.prevRect.height,
          prevRect: null,
        };
      }
      return {
        ...current,
        isFullScreen: true,
        prevRect: {
          x: current.x,
          y: current.y,
          width: current.width,
          height: current.height,
        },
      };
    });
  }, []);

  const displayRect = useMemo<Rect>(() => {
    if (win.isFullScreen) {
      return {
        x: FULLSCREEN_INSET,
        y: MENU_BAR_H + FULLSCREEN_INSET,
        width: Math.max(120, viewport.w - FULLSCREEN_INSET * 2),
        height: Math.max(
          120,
          viewport.h - MENU_BAR_H - FULLSCREEN_INSET * 2,
        ),
      };
    }
    return { x: win.x, y: win.y, width: win.width, height: win.height };
  }, [win, viewport]);

  /* ───── placement: the four-rule core ───── */
  const placement = useMemo<{ side: Side; x: number; y: number }>(() => {
    const r = displayRect;

    const popup = (innerPad: number) => {
      const preferLeft = cornerPref === "bottom-left";
      const spriteX = preferLeft
        ? r.x + innerPad
        : r.x + r.width - BUNNY_W - innerPad;
      const spriteY = r.y + r.height - BUNNY_H - innerPad;
      return {
        side: (preferLeft ? "bl-in" : "br-in") as Side,
        x: spriteX,
        y: spriteY,
      };
    };

    if (win.isFullScreen) return popup(PAD_FULLSCREEN);

    const rightSpace = viewport.w - (r.x + r.width);
    const leftSpace = r.x;

    if (rightSpace >= OUTSIDE_NEEDED) {
      return { side: "tr-out", x: r.x + r.width + PAD, y: r.y };
    }
    if (leftSpace >= OUTSIDE_NEEDED) {
      return { side: "tl-out", x: r.x - BUNNY_W - PAD, y: r.y };
    }
    return popup(PAD);
  }, [displayRect, viewport.w, win.isFullScreen, cornerPref]);

  const isInsideCorner =
    placement.side === "br-in" || placement.side === "bl-in";

  const onSpriteDoubleClick = useCallback(() => {
    if (!isInsideCorner) return;
    setCornerPref((p) =>
      p === "bottom-right" ? "bottom-left" : "bottom-right",
    );
  }, [isInsideCorner]);

  return (
    <div className="sp-desktop">
      <MenuBar />

      <div className="sp-window-layer">
        <div
          className={`sp-window${win.isFullScreen ? " is-fullscreen" : ""}${isDragging ? " is-dragging" : ""}`}
          style={{
            transform: `translate(${displayRect.x}px, ${displayRect.y}px)`,
            width: displayRect.width,
            height: displayRect.height,
          }}
        >
          <div className="sp-titlebar" onPointerDown={onTitleBarDown}>
            <div className="sp-traffic">
              <button
                type="button"
                className="sp-light red"
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Close"
              />
              <button
                type="button"
                className="sp-light yellow"
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Minimize"
              />
              <button
                type="button"
                className="sp-light green"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullScreen();
                }}
                aria-label={
                  win.isFullScreen ? "Exit full screen" : "Enter full screen"
                }
              />
            </div>
            <div className="sp-title">Window</div>
          </div>
          <div className="sp-window-body" />
        </div>
      </div>

      <button
        type="button"
        className="sp-bunny"
        style={{
          transform: `translate(${placement.x}px, ${placement.y}px)`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onSpriteDoubleClick();
        }}
        aria-label="Sprite"
      >
        <img src={`/bunny/${bunnyFrame}.gif`} alt="" draggable={false} />
      </button>
    </div>
  );
}

/* ───────────────────────── Menu bar ───────────────────────── */

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="sp-menubar">
      <div className="sp-menubar-left">
        <span className="sp-menubar-apple" aria-hidden="true" />
        <span className="sp-menubar-app">Runner</span>
        <span className="sp-menubar-item">File</span>
        <span className="sp-menubar-item">Edit</span>
        <span className="sp-menubar-item">View</span>
        <span className="sp-menubar-item">Window</span>
        <span className="sp-menubar-item">Help</span>
      </div>
      <div className="sp-menubar-right">
        <span className="sp-menubar-time">{formatClock(now)}</span>
      </div>
    </div>
  );
}

function formatClock(date: Date): string {
  const hour = ((date.getHours() + 11) % 12) + 1;
  const min = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${hour}:${min} ${ampm}`;
}
