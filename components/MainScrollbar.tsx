"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

const SCROLL_AREA_ID = "main-scroll-area";
const FADE_MS = 2000;

type Metrics = {
  trackHeight: number;
  thumbHeight: number;
  thumbTop: number;
};

export default function MainScrollbar() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  const showActive = () => {
    setActive(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (!draggingRef.current && !hovered) setActive(false);
    }, FADE_MS);
  };

  const update = () => {
    const el = document.getElementById(SCROLL_AREA_ID) as HTMLElement | null;
    if (!el) return;

    const viewport = el.clientHeight || 0;
    const content = el.scrollHeight || 0;
    const scrollTop = el.scrollTop || 0;
    const trackHeight = viewport;
    const minThumb = 96;
    const thumbHeight = content > 0 ? Math.max(minThumb, Math.round((viewport / content) * trackHeight)) : trackHeight;
    const maxScroll = Math.max(1, content - viewport);
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const thumbTop = Math.round((scrollTop / maxScroll) * maxThumbTop);
    setMetrics({ trackHeight, thumbHeight, thumbTop });
  };

  useEffect(() => {
    const el = document.getElementById(SCROLL_AREA_ID) as HTMLElement | null;
    if (!el) return;

    const onScroll = () => {
      update();
      showActive();
    };

    const onResize = () => update();
    const ro = new ResizeObserver(() => update());

    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    update();

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const positionToScrollTop = (clientY: number) => {
    const el = document.getElementById(SCROLL_AREA_ID) as HTMLElement | null;
    if (!el || !metrics) return;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, y / metrics.trackHeight));
    const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
    const target = ratio * maxScroll - dragOffsetRef.current;
    el.scrollTo({ top: Math.max(0, target), behavior: "auto" });
  };

  const beginDrag = (clientY: number, pointerId: number, offset: number, target: EventTarget | null) => {
    const el = document.getElementById(SCROLL_AREA_ID) as HTMLElement | null;
    if (!el || !metrics) return;
    const canCapture = target && "setPointerCapture" in target && typeof (target as { setPointerCapture?: (id: number) => void }).setPointerCapture === "function";
    if (canCapture) {
      (target as { setPointerCapture: (id: number) => void }).setPointerCapture(pointerId);
    }
    draggingRef.current = true;
    setActive(true);
    dragOffsetRef.current = offset;

    const onMove = (ev: PointerEvent) => {
      positionToScrollTop(ev.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      showActive();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    positionToScrollTop(clientY);
  };

  const onThumbPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const thumbRect = e.currentTarget.getBoundingClientRect();
    e.preventDefault();
    e.stopPropagation();
    beginDrag(e.clientY, e.pointerId, e.clientY - thumbRect.top, e.currentTarget);
  };

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    beginDrag(e.clientY, e.pointerId, Math.max(0, (metrics?.thumbHeight ?? 0) / 2), e.currentTarget);
    showActive();
  };

  const opacityClass = active || hovered ? "opacity-100" : "opacity-0";
  const hidden = !metrics;

  if (hidden) return null;

  return (
    <div
      className={`fixed right-3 lg:right-[344px] top-16 bottom-0 z-50 w-[5rem] pointer-events-none select-none transition-opacity duration-300 ${opacityClass}`}
    >
      <div
        className="relative h-full w-[5rem] pointer-events-auto"
        onPointerDown={onTrackPointerDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ touchAction: "none" }}
      >
        <div className="absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 opacity-0" />
        <button
          type="button"
          aria-label="Main scroll handle"
          className="absolute left-1/2 -translate-x-1/2 rounded-full border border-cyan-200/18 bg-gradient-to-b from-cyan-100/75 via-cyan-300/35 to-cyan-400/18 shadow-[0_0_24px_rgba(0,207,255,0.22)] backdrop-blur-md cursor-grab active:cursor-grabbing appearance-none"
          style={{
            top: `${metrics.thumbTop}px`,
            width: "3.25rem",
            height: `${Math.max(metrics.thumbHeight, 196)}px`,
            minHeight: "196px",
          }}
          onPointerDown={onThumbPointerDown}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
      </div>
    </div>
  );
}
