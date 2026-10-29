"use client";

import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq, stagger as staggers } from "@/lib/motion";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Animate direct children marked with data-reveal-item (staggered) instead of the element. */
  items?: boolean;
  y?: number;
  delay?: number;
  start?: string;
};

/** Fades and lifts content into place as it enters the viewport (once). */
export function Reveal({
  as: Tag = "div",
  children,
  className,
  style,
  id,
  items = false,
  y = 36,
  delay = 0,
  start = "top 86%",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          const targets = items ? el.querySelectorAll("[data-reveal-item]") : el;
          gsap.from(targets, {
            autoAlpha: 0,
            y,
            duration: 1.1,
            delay,
            stagger: items ? staggers.items : 0,
            scrollTrigger: { trigger: el, start, once: true },
          });
        });
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} style={style} id={id}>
      {children}
    </Tag>
  );
}
