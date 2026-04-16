"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_PREFIX = "techspace-scroll:";
const SCROLL_AREA_ID = "main-scroll-area";

function getKey(pathname: string) {
  return `${STORAGE_PREFIX}${pathname}`;
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const saveRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollArea = document.getElementById(SCROLL_AREA_ID) as HTMLElement | null;
    if (!scrollArea) return;

    const saveScroll = () => {
      const prevPath = prevPathRef.current;
      if (prevPath) {
        sessionStorage.setItem(getKey(prevPath), String(scrollArea.scrollTop || 0));
      }
    };

    const restoreScroll = () => {
      const raw = sessionStorage.getItem(getKey(pathname));
      const y = raw ? Number(raw) : 0;
      if (Number.isFinite(y) && y > 0) {
        scrollArea.scrollTo({ top: y, behavior: "auto" });
      }
    };

    if (prevPathRef.current && prevPathRef.current !== pathname) {
      saveScroll();
    }

    prevPathRef.current = pathname;

    if (saveRafRef.current) cancelAnimationFrame(saveRafRef.current);
    saveRafRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(restoreScroll);
    });

    const onScroll = () => {
      if (saveRafRef.current) return;
      saveRafRef.current = requestAnimationFrame(() => {
        const currentPath = prevPathRef.current || pathname;
        sessionStorage.setItem(getKey(currentPath), String(scrollArea.scrollTop || 0));
        saveRafRef.current = null;
      });
    };

    scrollArea.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scrollArea.removeEventListener("scroll", onScroll);
      if (saveRafRef.current) cancelAnimationFrame(saveRafRef.current);
      saveScroll();
    };
  }, [pathname]);

  return null;
}
