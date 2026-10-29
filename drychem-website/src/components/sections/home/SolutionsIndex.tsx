"use client";

import { useRef } from "react";
import { solutions, solutionHref } from "@/content/solutions";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Reveal } from "@/components/motion/Reveal";
import { MaterialImage } from "@/components/media/MaterialImage";
import { Icon } from "@/components/ui/Icon";
import styles from "./SolutionsIndex.module.css";

/**
 * The complete portfolio as a typographic index. On fine pointers a material
 * preview follows the cursor and wipes between rows; touch devices get an
 * inline thumbnail per row instead.
 */
export function SolutionsIndex() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      return idleMatchMedia((mm) => {
        mm.add(`${mq.finePointer} and ${mq.motion}`, () => {
          const list = el.querySelector<HTMLElement>("[data-list]");
          const preview = el.querySelector<HTMLElement>("[data-preview]");
          const items = gsap.utils.toArray<HTMLElement>("[data-preview-item]", el);
          if (!list || !preview) return;

          gsap.set(preview, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.85 });
          gsap.set(items, { clipPath: "inset(100% 0% 0% 0%)" });
          const xTo = gsap.quickTo(preview, "x", { duration: 0.7, ease: "power3" });
          const yTo = gsap.quickTo(preview, "y", { duration: 0.7, ease: "power3" });
          const rTo = gsap.quickTo(preview, "rotation", { duration: 0.9, ease: "power3" });
          let current: string | null = null;
          let lastX = 0;

          const show = (key: string) => {
            if (key === current) return;
            const prev = current;
            current = key;
            items.forEach((item) => {
              const k = item.dataset.previewItem;
              if (k === key) {
                gsap.set(item, { zIndex: 2 });
                gsap.fromTo(
                  item,
                  { clipPath: "inset(100% 0% 0% 0%)" },
                  { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "sweep", overwrite: true },
                );
              } else if (k === prev) {
                gsap.set(item, { zIndex: 1 });
                gsap.to(item, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "sweep", overwrite: true });
              } else {
                gsap.set(item, { zIndex: 0 });
              }
            });
          };

          const move = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            xTo(e.clientX - rect.left);
            yTo(e.clientY - rect.top);
            rTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4));
            lastX = e.clientX;
          };
          const over = (e: PointerEvent) => {
            const row = (e.target as Element).closest<HTMLElement>("[data-row]");
            if (row?.dataset.row) show(row.dataset.row);
          };
          const enter = () =>
            gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "settle", overwrite: "auto" });
          const leave = () => {
            gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.5, ease: "power2.out", overwrite: "auto" });
            current = null;
            // Reset the wipes once hidden — unless the pointer came back in the meantime.
            gsap.delayedCall(0.5, () => {
              if (!current) gsap.set(items, { clipPath: "inset(100% 0% 0% 0%)" });
            });
          };

          list.addEventListener("pointermove", move);
          list.addEventListener("pointerover", over);
          list.addEventListener("pointerenter", enter);
          list.addEventListener("pointerleave", leave);
          return () => {
            list.removeEventListener("pointermove", move);
            list.removeEventListener("pointerover", over);
            list.removeEventListener("pointerenter", enter);
            list.removeEventListener("pointerleave", leave);
          };
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={`section ${styles.index}`} data-theme="dark" aria-labelledby="portfolio-title">
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="portfolio-title" className={styles.title}>
            The complete portfolio
          </h2>
          <p className={styles.count}>{String(solutions.length).padStart(2, "0")} solution families</p>
        </header>

        <Reveal items className={styles.list} start="top 90%">
          <ol data-list className={styles.listInner}>
            {solutions.map((s) => (
              <li key={s.slug} data-reveal-item>
                <TransitionLink
                  href={solutionHref(s.slug)}
                  label={s.name}
                  className={styles.row}
                  data-row={s.slug}
                  data-cursor-label="Explore"
                >
                  <span className={styles.no}>{s.index}</span>
                  <span className={styles.name}>
                    <span>{s.name}</span>
                  </span>
                  <span className={styles.meta}>{s.highlights.slice(0, 2).join(" · ")}</span>
                  <span className={styles.thumb} aria-hidden="true">
                    <MaterialImage name={s.material} sizes="96px" />
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    <Icon name="arrow" />
                  </span>
                </TransitionLink>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      <div className={styles.preview} data-preview aria-hidden="true">
        {solutions.map((s) => (
          <div key={s.slug} className={styles.previewItem} data-preview-item={s.slug}>
            <MaterialImage name={s.material} sizes="380px" />
          </div>
        ))}
      </div>
    </section>
  );
}
