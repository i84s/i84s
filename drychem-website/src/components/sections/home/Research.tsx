"use client";

import { useRef } from "react";
import { quality } from "@/content/company";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";
import { MediaReveal } from "@/components/motion/MediaReveal";
import { MaterialImage } from "@/components/media/MaterialImage";
import { LineArt } from "@/components/illustrations/LineArt";
import styles from "./Research.module.css";

const art = { nabl: "specimen", bis: "process", iso: "cycle" } as const;

const studies = [
  { material: "powder", caption: "MasterMix powder, spatula pass" },
  { material: "adhesive", caption: "Notched tile-adhesive bed" },
  { material: "plaster", caption: "Float-finished ready-mix plaster" },
] as const;

export function Research() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          // Technical drawings draw themselves as each card enters.
          gsap.utils.toArray<SVGSVGElement>("[data-line-art]", el).forEach((svg) => {
            gsap.from(svg.querySelectorAll("[data-draw] path, [data-draw] circle"), {
              strokeDashoffset: 1,
              duration: 1.6,
              ease: "power2.inOut",
              stagger: 0.06,
              scrollTrigger: { trigger: svg, start: "top 85%", once: true },
            });
            gsap.from(svg.querySelectorAll("text"), {
              autoAlpha: 0,
              duration: 0.8,
              delay: 0.9,
              stagger: 0.05,
              scrollTrigger: { trigger: svg, start: "top 85%", once: true },
            });
          });

          // Value chain: the line is scrubbed by scroll; nodes switch on as it reaches them.
          const chain = el.querySelector<HTMLElement>("[data-chain]");
          const fill = el.querySelector<HTMLElement>("[data-chain-fill]");
          const nodes = gsap.utils.toArray<HTMLElement>("[data-chain-node]", el);
          if (chain && fill) {
            gsap.fromTo(
              fill,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: chain,
                  start: "top 80%",
                  end: "bottom 45%",
                  scrub: 0.6,
                  onUpdate: (self) => {
                    nodes.forEach((node, i) => {
                      node.toggleAttribute("data-on", self.progress >= i / Math.max(1, nodes.length - 1) - 0.02);
                    });
                  },
                },
              },
            );
          }

          // Material studies drift at different rates for depth.
          gsap.utils.toArray<HTMLElement>("[data-depth]", el).forEach((item) => {
            const depth = Number(item.dataset.depth) || 0;
            gsap.to(item, {
              yPercent: -depth,
              ease: "none",
              scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
            });
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="research"
      className={`section ${styles.research}`}
      data-theme="light"
      aria-labelledby="research-title"
    >
      <div className="wrap">
        <header className={styles.head}>
          <p className="eyebrow">03 — Research &amp; quality</p>
          <RevealText as="h2" id="research-title" className={`headline ${styles.title}`}>
            Formulated with precision. Tested to standard.
          </RevealText>
          <Reveal as="p" className={`lede ${styles.lede}`} delay={0.15}>
            DRYCHEM develops its formulations in NABL-accredited R&amp;D labs, checks product performance in
            BIS-standard facilities and works under an ISO 9001:2015 certified quality management system.
          </Reveal>
        </header>

        <Reveal items className={styles.cards}>
          {quality.credentials.map((c, i) => (
            <article key={c.id} className={styles.card} data-reveal-item>
              <div className={styles.art}>
                <LineArt name={art[c.id]} />
              </div>
              <p className={styles.cardIndex}>Q.{String(i + 1).padStart(2, "0")}</p>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardBody}>{c.body}</p>
            </article>
          ))}
        </Reveal>

        <div className={styles.chain} data-chain>
          <p className={styles.chainLabel}>From formula to market</p>
          <div className={styles.track} aria-hidden="true">
            <span className={styles.trackFill} data-chain-fill />
          </div>
          <ol className={styles.nodes}>
            {quality.valueChain.map((step, i) => (
              <li key={step} className={styles.node} data-chain-node>
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.nodeIndex}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.nodeName}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.studies}>
          {studies.map((s, i) => (
            <figure key={s.material} className={styles.study} data-depth={[0, 14, 6][i]}>
              <MediaReveal className={styles.studyFrame} parallax={7} from={i === 1 ? "top" : "bottom"} shade="soft">
                <MaterialImage
                  name={s.material}
                  sizes="(min-width: 900px) 30vw, 90vw"
                  alt={`Material study: ${s.caption.toLowerCase()}.`}
                />
              </MediaReveal>
              <figcaption className={styles.studyCaption}>
                <span>Study {String(i + 2).padStart(2, "0")}</span>
                <span>{s.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
