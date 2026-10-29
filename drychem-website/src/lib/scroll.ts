"use client";

import type Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Tiny store around the Lenis instance so any component can scroll, lock or
 * read scroll without React context re-renders. When Lenis is not running
 * (reduced motion), the helpers fall back to native scrolling.
 */

let lenis: Lenis | null = null;
let lockCount = 0;
let afterUnlock: Array<() => void> = [];

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

type ScrollTarget = number | string | HTMLElement;

export function scrollToTarget(target: ScrollTarget, opts: { immediate?: boolean; offset?: number } = {}) {
  const { immediate = false, offset = 0 } = opts;
  const el =
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target.startsWith("#") ? `#${CSS.escape(target.slice(1))}` : target)
      : target;
  if (typeof target === "string" && !el) return;

  if (lenis) {
    // Lenis caps targets at its cached page height, which lags behind a route change
    // (it re-measures on a debounce). Measure now so a fresh page scrolls all the way.
    lenis.resize();
    lenis.scrollTo(typeof target === "number" ? target : (el as HTMLElement), {
      offset,
      immediate,
      force: true,
      duration: 1.5,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    });
    return;
  }

  const behavior: ScrollBehavior = immediate || prefersReducedMotion() ? "auto" : "smooth";
  const top =
    typeof target === "number" ? target : (el as HTMLElement).getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior });
}

/** Reference-counted scroll lock (menu, preloader, transitions). */
export function lockScroll(locked: boolean) {
  lockCount = Math.max(0, lockCount + (locked ? 1 : -1));
  const isLocked = lockCount > 0;
  document.documentElement.classList.toggle("is-locked", isLocked);
  if (lenis) {
    if (isLocked) lenis.stop();
    else lenis.start();
  }
  if (!isLocked) {
    const queued = afterUnlock;
    afterUnlock = [];
    queued.forEach((fn) => fn());
  }
}

/**
 * Runs `fn` now, or once every scroll lock is released. Restarting Lenis cancels
 * a scroll in flight, so a scroll started while locked (say, from a link in the
 * open mobile menu) has to wait for the unlock.
 */
export function whenUnlocked(fn: () => void) {
  if (lockCount === 0) fn();
  else afterUnlock.push(fn);
}
