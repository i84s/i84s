"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { mq, stagger } from "@/lib/motion";
import { onPageReveal } from "@/lib/reveal";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  /** "lines" rise through masks; "scrub" lights words up as you scroll through them. */
  mode?: "lines" | "scrub";
  /** "scroll" plays when the element enters the viewport; "page" when the page is revealed. */
  trigger?: "scroll" | "page";
  delay?: number;
};

/**
 * Kinetic typography. Lines are re-split automatically when the layout or
 * fonts change, so breaks are always correct; screen readers get the
 * original text via aria-label.
 */
export function RevealText({
  as: Tag = "div",
  children,
  className,
  id,
  mode = "lines",
  trigger = "scroll",
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      return idleMatchMedia(
        (mm) => {
          mm.add(mq.motion, () => {
            let unsubscribe = () => {};
            // Headings may carry aria-label, so SplitText can label them and hide the pieces.
            // Other elements (p, span…) can't: leave their split text readable as-is.
            const isHeading = /^H[1-6]$/.test(el.tagName);
            const split = SplitText.create(el, {
              aria: isHeading ? "auto" : "none",
              type: mode === "scrub" ? "words,lines" : "lines",
              mask: mode === "lines" ? "lines" : undefined,
              linesClass: "split-line",
              wordsClass: "split-word",
              autoSplit: true,
              onSplit(self) {
                gsap.set(el, { autoAlpha: 1 });
                if (mode === "scrub") {
                  // Unlit words stay at 50% so they keep large-text AA contrast (3:1) on either theme.
                  return gsap.fromTo(
                    self.words,
                    { opacity: 0.5 },
                    {
                      opacity: 1,
                      ease: "none",
                      stagger: 0.1,
                      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 45%", scrub: 0.6 },
                    },
                  );
                }
                const tween = gsap.from(self.lines, {
                  yPercent: 118,
                  duration: 1.2,
                  stagger: stagger.lines,
                  delay,
                  paused: trigger === "page",
                  scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%", once: true } : undefined,
                });
                if (trigger === "page") {
                  unsubscribe();
                  unsubscribe = onPageReveal(() => tween.play());
                }
                return tween;
              },
            });
            return () => {
              unsubscribe();
              split.revert();
            };
          });
        },
        { defer: trigger === "scroll" },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} id={id} data-anim="">
      {children}
    </Tag>
  );
}
