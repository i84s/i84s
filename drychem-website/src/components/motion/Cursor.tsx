"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import styles from "./Cursor.module.css";

const INTERACTIVE = "a, button, [role='button'], label, select, summary";
const TEXT = "input, textarea";

/**
 * Cursor follower (fine pointers only). The native cursor stays visible; the
 * ring trails it, grows over interactive elements and shows a label over
 * elements that declare `data-cursor-label`.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${mq.finePointer} and ${mq.motion}`, () => {
      const el = ref.current;
      const label = el?.querySelector<HTMLElement>("[data-label]");
      if (!el || !label) return;
      gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      let shown = false;

      const move = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        if (!shown) {
          gsap.set(el, { x: e.clientX, y: e.clientY });
          gsap.to(el, { autoAlpha: 1, duration: 0.3, overwrite: "auto" });
          shown = true;
        }
        xTo(e.clientX);
        yTo(e.clientY);
      };

      const over = (e: PointerEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        const labelled = target?.closest<HTMLElement>("[data-cursor-label]");
        if (labelled) {
          el.dataset.mode = "label";
          label.textContent = labelled.dataset.cursorLabel ?? "";
        } else if (target?.closest(TEXT)) {
          el.dataset.mode = "hidden";
        } else {
          el.dataset.mode = target?.closest(INTERACTIVE) ? "link" : "";
        }
      };

      const leave = () => {
        gsap.to(el, { autoAlpha: 0, duration: 0.3, overwrite: "auto" });
        shown = false;
      };

      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerover", over, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      return () => {
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerover", over);
        document.documentElement.removeEventListener("pointerleave", leave);
      };
    });
    return () => mm.revert();
  });

  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true">
      <span className={styles.ring} />
      <span className={styles.label} data-label />
    </div>
  );
}
