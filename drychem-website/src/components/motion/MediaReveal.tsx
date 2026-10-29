"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import styles from "./MediaReveal.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  /** Parallax travel in % of the frame height (0 disables). */
  parallax?: number;
  /** Direction the clip opens from. */
  from?: "bottom" | "left" | "top";
  /** Seconds to wait after the frame enters the viewport. */
  delay?: number;
  /** Cursor label shown while hovering the frame (fine pointers). */
  label?: string;
  /** Raking-light shade over the image. */
  shade?: "soft" | "strong";
};

const clips = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
};

/**
 * Image frame that opens with a clip-path wipe while the image settles from a
 * slight zoom, then drifts with gentle parallax. Three nested layers keep the
 * clip, parallax and scale transforms independent.
 */
export function MediaReveal({ children, className, parallax = 8, from = "bottom", delay = 0, label, shade }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const drift = el.querySelector<HTMLElement>("[data-drift]");
      const zoom = el.querySelector<HTMLElement>("[data-zoom]");
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true }, delay });
          tl.fromTo(
            el,
            { clipPath: clips[from] },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "sweep" },
          ).fromTo(zoom, { scale: 1.22 }, { scale: 1, duration: 2, ease: "settle" }, 0);
          if (parallax && drift) {
            gsap.fromTo(
              drift,
              { yPercent: -parallax },
              {
                yPercent: parallax,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
              },
            );
          }
        });
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className={[styles.frame, className].filter(Boolean).join(" ")}
      style={{ "--parallax": `${parallax}%` } as CSSProperties}
      data-cursor-label={label}
      data-shade={shade}
    >
      <div className={styles.drift} data-drift>
        <div className={styles.zoom} data-zoom>
          {children}
        </div>
      </div>
    </div>
  );
}
