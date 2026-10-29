"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { markPageRevealed, resetPageRevealed } from "@/lib/reveal";
import { lockScroll, scrollToTarget } from "@/lib/scroll";
import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "./TransitionProvider.module.css";

type TransitionApi = {
  /** Navigate with the curtain transition. Same-page targets just scroll. */
  navigate: (href: string, label?: string) => void;
};

const TransitionContext = createContext<TransitionApi>({ navigate: () => {} });

export const usePageTransition = () => useContext(TransitionContext);

const normalize = (path: string) => (path.endsWith("/") ? path : `${path}/`);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const flight = useRef<{ active: boolean; hash: string | null; locked: boolean }>({
    active: false,
    hash: null,
    locked: false,
  });

  const navigate = useCallback(
    (href: string, label?: string) => {
      const url = new URL(href, window.location.href);
      if (normalize(url.pathname) === normalize(window.location.pathname)) {
        if (url.hash) {
          scrollToTarget(url.hash);
          window.history.replaceState(window.history.state, "", url.hash);
        } else {
          scrollToTarget(0);
        }
        return;
      }
      if (flight.current.active) return;

      const destination = url.pathname + url.search + url.hash;
      router.prefetch(url.pathname + url.search); // fetch while the curtain closes
      flight.current = { active: true, hash: url.hash || null, locked: false };
      resetPageRevealed();

      const curtain = curtainRef.current;
      if (!curtain || prefersReducedMotion()) {
        router.push(destination, { scroll: false });
        return;
      }

      if (labelRef.current) labelRef.current.textContent = label ?? "";
      lockScroll(true);
      flight.current.locked = true;
      gsap
        .timeline({ onComplete: () => router.push(destination, { scroll: false }) })
        .set(curtain, { visibility: "visible" })
        .fromTo(
          curtain,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "sweep" },
        )
        .fromTo(
          curtain.querySelectorAll("[data-curtain-rise]"),
          { yPercent: 105 },
          { yPercent: 0, duration: 0.8, stagger: 0.07, ease: "settle" },
          0.32,
        )
        .fromTo(
          curtain.querySelector("[data-curtain-line]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: "sweep" },
          0.2,
        );
    },
    [router],
  );

  // Once the new route has rendered underneath the curtain, reset scroll and lift it.
  useEffect(() => {
    const state = flight.current;
    if (!state.active) return;
    const curtain = curtainRef.current;

    const raf = requestAnimationFrame(() => {
      if (state.locked) {
        lockScroll(false);
        state.locked = false;
      }
      scrollToTarget(0, { immediate: true });
      ScrollTrigger.refresh();
      if (state.hash) scrollToTarget(state.hash, { immediate: true });

      if (!curtain || prefersReducedMotion()) {
        state.active = false;
        markPageRevealed();
        return;
      }

      gsap
        .timeline({
          onComplete: () => {
            gsap.set(curtain, { visibility: "hidden" });
            state.active = false;
          },
        })
        .to(curtain.querySelectorAll("[data-curtain-rise]"), { yPercent: -105, duration: 0.6, ease: "sweep" }, 0)
        .to(curtain, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "sweep" }, 0.12)
        .call(markPageRevealed, [], 0.3);
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  const api = useMemo(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div ref={curtainRef} className={styles.curtain} aria-hidden="true" data-theme="dark">
        <div className={styles.inner}>
          <span className={styles.brand}>
            <span data-curtain-rise>
              <BrandLogo surface="dark" />
            </span>
          </span>
          <span className={styles.label}>
            <span data-curtain-rise ref={labelRef} />
          </span>
          <span className={styles.line} data-curtain-line />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
