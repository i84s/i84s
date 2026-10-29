"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { setLenis } from "@/lib/scroll";

/**
 * Smooth wheel scrolling (Lenis) synced to GSAP's ticker and ScrollTrigger.
 * Native scrolling is kept for touch input and whenever the visitor prefers
 * reduced motion; the scrollbar, keyboard and find-in-page keep working.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia(mq.reduce);
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    const start = () => {
      lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);
    };

    const stop = () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };

    const sync = () => {
      stop();
      if (!reduce.matches) start();
    };

    sync();
    reduce.addEventListener("change", sync);

    // Layout can shift once fonts and images arrive; keep triggers accurate.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    document.documentElement.classList.add("motion-ready");

    return () => {
      reduce.removeEventListener("change", sync);
      window.removeEventListener("load", refresh);
      stop();
    };
  }, []);

  return null;
}
