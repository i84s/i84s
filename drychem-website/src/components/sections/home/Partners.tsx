"use client";

import { useRef } from "react";
import { contact } from "@/content/company";
import type { MaterialKey } from "@/content/solutions";
import { idleMatchMedia } from "@/lib/idle";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { MaterialImage } from "@/components/media/MaterialImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import styles from "./Partners.module.css";

const process = [
  { name: "Formulation", text: "Develop or adapt a formulation with our R&D team." },
  { name: "Manufacturing", text: "Toll or contract manufacturing across our plant network." },
  { name: "Packaging", text: "Packed to your specification, under your brand." },
  { name: "On-time delivery", text: "Warehousing and dispatch planned around your schedule." },
];

type Audience = { title: string; text: string; cta: string; href: string; material: MaterialKey };

const audiences: Audience[] = [
  {
    title: "Building-material brands",
    text: "Launch products under your own name without building plants or an R&D team.",
    cta: "Toll & contract manufacturing",
    href: "/solutions/customized/",
    material: "samples",
  },
  {
    title: "Manufacturers",
    text: "MasterMix premixes: one 25 kg bag is recommended for a one-tonne batch of finished wall putty.",
    cta: "Explore MasterMix",
    href: "/solutions/mastermix/",
    material: "powder",
  },
  {
    title: "Distributors & export partners",
    text: "DRYCHEM products reach 23 countries. Talk to our exports team about your market.",
    cta: contact.exportsEmail.display,
    href: contact.exportsEmail.href,
    material: "texture",
  },
  {
    title: "Contractors & projects",
    text: "Structural, leveling, adhesive and finishing systems from a single manufacturer.",
    cta: "Discuss a project",
    href: "/contact/",
    material: "concrete",
  },
];

export function Partners() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      return idleMatchMedia((mm) => {
        mm.add(mq.motion, () => {
          const line = el.querySelector("[data-process-line]");
          gsap.fromTo(
            line,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el.querySelector("[data-process]"),
                start: "top 80%",
                end: "top 35%",
                scrub: 0.6,
              },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="partners"
      className={`section ${styles.partners}`}
      data-theme="light"
      aria-labelledby="partners-title"
    >
      <div className="wrap">
        <header className={styles.head}>
          <p className="eyebrow">05 — Partner with us</p>
          <RevealText as="h2" id="partners-title" className={`headline ${styles.title}`}>
            Your formulation. Our plants, labs and logistics.
          </RevealText>
          <Reveal as="p" className={`lede ${styles.lede}`} delay={0.15}>
            As a toll and contract manufacturer, DRYCHEM takes building-material brands from formulation and
            manufacturing to packaging and on-time delivery — tailored to each client’s requirements.
          </Reveal>
        </header>

        <div className={styles.process} data-process>
          <div className={styles.processTrack} aria-hidden="true">
            <span data-process-line />
          </div>
          <Reveal as="ol" items className={styles.steps}>
            {process.map((step, i) => (
              <li key={step.name} className={styles.step} data-reveal-item>
                <span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={styles.stepName}>{step.name}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal items className={styles.cards}>
          {audiences.map((a) => {
            const internal = a.href.startsWith("/");
            const inner = (
              <>
                <span className={styles.cardMedia} aria-hidden="true">
                  <MaterialImage name={a.material} sizes="(min-width: 1000px) 24vw, (min-width: 600px) 46vw, 92vw" />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{a.title}</span>
                  <span className={styles.cardText}>{a.text}</span>
                  <span className={styles.cardCta}>
                    {a.cta}
                    <Icon name={internal ? "arrow" : "mail"} />
                  </span>
                </span>
              </>
            );
            return (
              <div key={a.title} data-reveal-item className={styles.cardWrap}>
                {internal ? (
                  <TransitionLink href={a.href} label={a.title} className={styles.card} data-cursor-label="Open">
                    {inner}
                  </TransitionLink>
                ) : (
                  <a href={a.href} className={styles.card} data-cursor-label="Email">
                    {inner}
                  </a>
                )}
              </div>
            );
          })}
        </Reveal>

        <Reveal className={styles.band}>
          <p className={styles.bandText}>Have a requirement in mind? Tell us about it.</p>
          <Button href="/contact/" label="Start a project" magnetic>
            Start a project
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
