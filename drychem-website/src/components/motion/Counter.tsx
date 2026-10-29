"use client";

import { useRef } from "react";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";

/**
 * Counts up to `value` when it scrolls into view. The final value is what the
 * server renders (no-JS, crawlers and reduced motion all see the real figure);
 * digits are zero-padded during the count so the width never jumps.
 */
export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const digits = String(value).length;
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          const state = { n: 0 };
          const render = () => {
            el.textContent = String(Math.round(state.n)).padStart(digits, "0");
          };
          render();
          gsap.to(state, {
            n: value,
            duration: 1.8,
            ease: "power3.out",
            onUpdate: render,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
          return () => {
            el.textContent = String(value);
          };
        });
      });
    },
    { scope: ref, dependencies: [value] },
  );

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {value}
    </span>
  );
}
