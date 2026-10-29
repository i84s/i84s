"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { markPageRevealed } from "@/lib/reveal";
import { lockScroll } from "@/lib/scroll";
import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "./Preloader.module.css";

const SEEN_KEY = "drychem:intro-seen";

const session = {
  get(key: string) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* storage unavailable (private mode) — the intro simply plays again */
    }
  },
};

/** Resolves when fonts are ready, or after `ms` — never blocks for long. */
const fontsReady = (ms: number) =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, ms))]);

/**
 * Opening sequence. First visit: a line of light draws across the screen, the
 * name rises above it and the two halves part to reveal the hero (~2.2 s).
 * Repeat hard loads, and slow loads (the visitor has already waited): a short
 * split that only covers hydration. Reduced motion: a simple fade. The overlay is server-rendered so it covers the first paint.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      let released = false;
      let alive = true;
      lockScroll(true);

      const release = () => {
        if (released) return;
        released = true;
        lockScroll(false);
      };
      const finish = () => {
        release();
        el.style.display = "none";
        session.set(SEEN_KEY, "1");
      };

      const cleanup = () => {
        alive = false;
        release();
      };

      if (prefersReducedMotion()) {
        fontsReady(1200).then(() => {
          if (alive)
            gsap.to(el, { autoAlpha: 0, duration: 0.4, ease: "none", onStart: markPageRevealed, onComplete: finish });
        });
        return cleanup;
      }

      const open = gsap.timeline({ paused: true, onComplete: finish });
      open
        .to(q("[data-pl-content]"), { autoAlpha: 0, duration: 0.35, ease: "power1.out" }, 0)
        .to(q("[data-pl-top]"), { yPercent: -101, duration: 1, ease: "sweep" }, 0.05)
        .to(q("[data-pl-bottom]"), { yPercent: 101, duration: 1, ease: "sweep" }, 0.05)
        .call(markPageRevealed, [], 0.25)
        .call(release, [], 0.5);

      // Repeat visit — or a slow load where the visitor has already waited: skip straight to the split.
      const late = performance.now() > 1800;
      if (session.get(SEEN_KEY) || late) {
        gsap.set(q("[data-pl-content]"), { autoAlpha: 0 });
        fontsReady(600).then(() => {
          if (alive) open.play();
        });
        return cleanup;
      }

      const counter = q("[data-pl-count]")[0];
      const progress = { value: 0 };
      const intro = gsap.timeline();
      intro
        .fromTo(q("[data-pl-line]"), { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "sweep" }, 0.05)
        // y: 0 cancels the CSS start offset GSAP reads into its pixel cache.
        .fromTo(q("[data-pl-rise]"), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 0.9, stagger: 0.07 }, 0.3)
        .fromTo(
          q("[data-pl-meta]"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: "none" },
          0.45,
        )
        .to(
          progress,
          {
            value: 100,
            duration: 1.15,
            ease: "power2.inOut",
            onUpdate: () => {
              if (counter) counter.textContent = String(Math.round(progress.value)).padStart(3, "0");
            },
          },
          0.05,
        );

      // Open once the intro has played and fonts are in (about 2.2 s in total).
      Promise.all([new Promise((r) => intro.eventCallback("onComplete", r)), fontsReady(2000)]).then(() => {
        if (alive) open.play();
      });

      return cleanup;
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`${styles.preloader} preloader`} aria-hidden="true" data-theme="dark">
      <div className={styles.half} data-pl-top />
      <div className={`${styles.half} ${styles.bottom}`} data-pl-bottom />
      <div className={styles.content} data-pl-content>
        <div className={styles.mark}>
          <span className={styles.mask}>
            <span data-pl-rise className={styles.rise}>
              <BrandLogo surface="dark" />
            </span>
          </span>
        </div>
        <span className={styles.line} data-pl-line />
        <div className={styles.meta}>
          <span className={styles.mask}>
            <span data-pl-rise className={styles.rise}>
              Engineering excellence
            </span>
          </span>
          <span className={styles.mask}>
            <span data-pl-rise className={styles.rise}>
              Built to last
            </span>
          </span>
        </div>
        <span className={styles.count} data-pl-meta>
          <span data-pl-count>000</span>
        </span>
        <span className={styles.origin} data-pl-meta>
          Navi Mumbai — India
        </span>
      </div>
    </div>
  );
}
