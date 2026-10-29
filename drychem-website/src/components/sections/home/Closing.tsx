"use client";

import { useRef } from "react";
import { contact } from "@/content/company";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import styles from "./Closing.module.css";

/** Closing statement: a band of light rakes across the final words as you arrive. */
export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          const words = el.querySelector("[data-sweep]");
          gsap.from(words, {
            yPercent: 105,
            duration: 1.4,
            scrollTrigger: { trigger: el, start: "top 75%", once: true },
          });
          gsap.fromTo(
            words,
            { backgroundPosition: "100% 0%" },
            {
              backgroundPosition: "0% 0%",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 80%", scrub: 0.8 },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={`section ${styles.closing}`} data-theme="dark" aria-labelledby="closing-title">
      <div className="wrap">
        <p className="eyebrow">Engineering excellence</p>
        <h2 id="closing-title" className={styles.title}>
          <span className={styles.mask}>
            <span className={styles.sweep} data-sweep>
              Built to last.
            </span>
          </span>
        </h2>
        <Reveal className={styles.row}>
          <p className={styles.text}>
            Tell us what you’re building — a new product line, a project specification or a distribution partnership.
          </p>
          <div className={styles.actions}>
            <Button href="/contact/" label="Start a project" magnetic>
              Start a project
            </Button>
            <Button href={contact.tollFree.href} variant="outline" icon="phone">
              {`Call ${contact.tollFree.display}`}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
