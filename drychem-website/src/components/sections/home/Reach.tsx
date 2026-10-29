"use client";

import { useRef, type CSSProperties } from "react";
import map from "@/generated/reach-map.json";
import { reach } from "@/content/company";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import styles from "./Reach.module.css";

export function Reach() {
  const root = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const svg = svgRef.current;
      if (!el || !svg) return;
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          const arcs = svg.querySelectorAll("[data-arc-line]");
          const points = svg.querySelectorAll("[data-arc-point]");
          const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 75%", once: true } });
          tl.from(svg.querySelector("[data-india]"), { autoAlpha: 0, duration: 1.2, ease: "power2.out" })
            .from(svg.querySelector("[data-origin]"), { scale: 0, transformOrigin: "center", duration: 0.8 }, 0.2)
            .fromTo(
              arcs,
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.09 },
              0.4,
            )
            .from(points, { scale: 0, transformOrigin: "center", duration: 0.6, stagger: 0.09 }, 1.1)
            .add(() => svg.setAttribute("data-flowing", ""), "-=0.4");
        });
      });
    },
    { scope: root },
  );

  const focus = (name: string | null) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.toggleAttribute("data-focus", Boolean(name));
    svg
      .querySelectorAll<SVGGElement>("[data-arc]")
      .forEach((g) => g.toggleAttribute("data-lit", g.dataset.arc === name));
  };

  return (
    <section
      ref={root}
      id="reach"
      className={`section ${styles.reach}`}
      data-theme="dark"
      aria-labelledby="reach-title"
    >
      <div className="wrap">
        <header className={styles.head}>
          <p className="eyebrow">04 — Manufacturing &amp; reach</p>
          <RevealText as="h2" id="reach-title" className={`headline ${styles.title}`}>
            Made across India. Supplied to 23 countries.
          </RevealText>
        </header>

        <div className={styles.layout}>
          <div className={styles.copy}>
            <Reveal as="p" className="lede">
              With {reach.facilities} manufacturing facilities nationwide, DRYCHEM is the third-largest producer of wall
              putty in India — and one of the country’s largest exporters of it. The export journey began in{" "}
              {reach.firstExport.market} in {reach.firstExport.year}.
            </Reveal>

            <Reveal as="dl" items className={styles.facts}>
              <div className={styles.fact} data-reveal-item>
                <dt>Manufacturing facilities across India</dt>
                <dd>
                  <Counter value={reach.facilities} />
                </dd>
              </div>
              <div className={styles.fact} data-reveal-item>
                <dt>Countries served worldwide</dt>
                <dd>
                  <Counter value={reach.countries} />
                </dd>
              </div>
              <div className={styles.fact} data-reveal-item>
                <dt>First exports, to {reach.firstExport.market}</dt>
                <dd>{reach.firstExport.year}</dd>
              </div>
            </Reveal>

            <Reveal as="p" className={styles.units}>
              Manufacturing units include {reach.namedUnits.slice(0, -1).join(", ")} and{" "}
              {reach.namedUnits[reach.namedUnits.length - 1]}.
            </Reveal>
          </div>

          <figure className={styles.figure}>
            <div className={styles.map}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset */}
              <img
                src="/media/world-dots.svg"
                alt=""
                width={map.width}
                height={map.height}
                className={styles.land}
                loading="lazy"
                decoding="async"
              />
              <svg
                ref={svgRef}
                viewBox={`0 0 ${map.width} ${map.height}`}
                className={styles.overlay}
                role="img"
                aria-label={`Map showing export routes from Navi Mumbai to ${map.markets.map((m) => m.name).join(", ")}.`}
              >
                <path d={map.india} className={styles.india} data-india />
                {map.markets.map((m, i) => (
                  <g key={m.name} data-arc={m.name} className={styles.arcGroup}>
                    <path d={m.d} pathLength={1} className={styles.arc} data-arc-line />
                    <circle
                      r={3.2}
                      className={styles.pulse}
                      style={{ offsetPath: `path("${m.d}")`, animationDelay: `${(i * 0.37) % 3.2}s` } as CSSProperties}
                    />
                    <circle cx={m.x} cy={m.y} r={4.5} className={styles.point} data-arc-point />
                  </g>
                ))}
                <g data-origin className={styles.origin}>
                  <circle cx={map.origin.x} cy={map.origin.y} r={16} className={styles.ring} />
                  <circle cx={map.origin.x} cy={map.origin.y} r={5.5} className={styles.hub} />
                </g>
              </svg>
              <span
                className={styles.originLabel}
                style={{ left: `${(map.origin.x / map.width) * 100}%`, top: `${(map.origin.y / map.height) * 100}%` }}
              >
                Navi Mumbai — HQ
              </span>
            </div>
            <figcaption className={styles.caption}>
              Export markets named by DRYCHEM. Products reach {reach.countries} countries in total.
            </figcaption>
          </figure>
        </div>

        <ul className={styles.markets} onPointerLeave={() => focus(null)}>
          {reach.namedMarkets.map((name) => (
            <li key={name} onPointerEnter={() => focus(name)}>
              {name}
            </li>
          ))}
          <li className={styles.more}>and more</li>
        </ul>
      </div>
    </section>
  );
}
