"use client";

import { useRef } from "react";
import { layers, solutions, solutionHref, type Solution } from "@/content/solutions";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { onPageReveal } from "@/lib/reveal";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { MaterialImage } from "@/components/media/MaterialImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import styles from "./SolutionView.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

/** One word per line, keeping "&" with the word before it ("Adhesives &" / "Grouts"). */
const titleLines = (name: string) =>
  name.split(" ").reduce<string[]>((lines, word) => {
    if (word === "&" && lines.length) lines[lines.length - 1] += " &";
    else lines.push(word);
    return lines;
  }, []);

export function SolutionView({ solution, next }: { solution: Solution; next: Solution }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        const intro = gsap.timeline({ paused: true });
        intro
          .fromTo(q("[data-hero-media]"), { scale: 1.18 }, { scale: 1, duration: 2.4, ease: "settle" }, 0)
          .from(q("[data-hero-line] > span"), { yPercent: 112, duration: 1.3, stagger: 0.09 }, 0.15)
          .from(q("[data-hero-fade]"), { autoAlpha: 0, y: 18, duration: 1, stagger: 0.07 }, 0.55);
        const unsubscribe = onPageReveal(() => intro.play());

        gsap.to(q("[data-hero-parallax]"), {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: q("[data-hero]")[0], start: "top top", end: "bottom top", scrub: true },
        });
        return unsubscribe;
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [solution.slug] },
  );

  return (
    <div ref={root}>
      <section className={styles.hero} data-theme="dark" data-hero aria-labelledby="solution-title">
        <div className={styles.media} aria-hidden="true" data-hero-parallax>
          <div className={styles.mediaInner} data-hero-media>
            <MaterialImage name={solution.material} sizes="100vw" priority />
          </div>
        </div>
        <div className={styles.shade} aria-hidden="true" />

        <div className={`wrap ${styles.heroContent}`}>
          <nav aria-label="Breadcrumb" className={styles.crumbs} data-hero-fade>
            <ol>
              <li>
                <TransitionLink href="/" label="Home" className="link">
                  Home
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/#solutions" label="Solutions" className="link">
                  Solutions
                </TransitionLink>
              </li>
              <li aria-current="page">{solution.name}</li>
            </ol>
          </nav>

          <p className={styles.meta} data-hero-fade>
            <span>
              {solution.index} / {pad(solutions.length)}
            </span>
            {solution.layer && (
              <span className={styles.layer}>
                Layer {pad(solution.layer.order)} — {solution.layer.label}
              </span>
            )}
          </p>

          <h1 id="solution-title" className={styles.title}>
            {titleLines(solution.name).map((line) => (
              <span key={line} className={styles.line} data-hero-line>
                <span>{line}</span>
              </span>
            ))}
          </h1>

          <div className={styles.heroFoot}>
            <p className={styles.tagline} data-hero-fade>
              {solution.tagline}
            </p>
            <p className={styles.summary} data-hero-fade>
              {solution.summary}
            </p>
            <div className={styles.actions} data-hero-fade>
              <Button href={`/contact/?topic=${solution.slug}`} label="Contact" magnetic>
                Discuss your requirement
              </Button>
              {solution.officialHref && (
                <Button href={solution.officialHref} variant="ghost" icon="arrow-up-right">
                  More on drychem.com
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={`section ${styles.families}`} data-theme="light" aria-labelledby="range-title">
        <div className="wrap">
          <Reveal as="ul" items className={styles.highlights}>
            {solution.highlights.map((h, i) => (
              <li key={h} data-reveal-item>
                <span className={styles.hIndex}>{pad(i + 1)}</span>
                <span>{h}</span>
              </li>
            ))}
          </Reveal>

          <header className={styles.rangeHead}>
            <p className="eyebrow">The range</p>
            <RevealText as="h2" id="range-title" className={`headline ${styles.rangeTitle}`}>
              {solution.slug === "customized" ? "What we take on for you." : `Inside ${solution.name}.`}
            </RevealText>
          </header>

          <div className={styles.familyList}>
            {solution.families.map((family) => (
              <Reveal key={family.name} className={styles.family} y={28}>
                <div className={styles.familyHead}>
                  <h3 className={styles.familyName}>{family.name}</h3>
                  {family.description && <p className={styles.familyText}>{family.description}</p>}
                </div>
                <ul className={styles.products}>
                  {family.products.map((product) => (
                    <li key={product.name} className={styles.product}>
                      <div className={styles.productMain}>
                        <span className={styles.productName}>{product.name}</span>
                        {product.note && <span className={styles.productNote}>{product.note}</span>}
                      </div>
                      {product.codes && (
                        <ul className={styles.codes} aria-label={`${product.name} grades`}>
                          {product.codes.map((code) => (
                            <li key={code}>{code}</li>
                          ))}
                        </ul>
                      )}
                      {product.href ? (
                        <a className={styles.productLink} href={product.href} target="_blank" rel="noopener noreferrer">
                          Product page
                          <Icon name="arrow-up-right" />
                          <span className="visually-hidden">
                            {" "}
                            for {product.name} on drychem.com (opens in a new tab)
                          </span>
                        </a>
                      ) : (
                        <span className={styles.productLink} aria-hidden="true" />
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <p className={styles.note}>
            Technical data — grades, coverage and application details — is published in DRYCHEM’s official data sheets.
            Ask our team for the latest TDS.
          </p>
        </div>
      </section>

      {solution.layer && <BuildUpPosition current={solution.slug} />}

      <section className={`section ${styles.cta}`} data-theme="dark" aria-labelledby="cta-title">
        <div className="wrap">
          <RevealText as="h2" id="cta-title" className={`headline ${styles.ctaTitle}`}>
            Need a data sheet, a custom grade or a project quote?
          </RevealText>
          <Reveal className={styles.ctaRow}>
            <p className="lede">
              Tell us about your application and volumes — our sales and partnerships team will take it from there.
            </p>
            <Button href={`/contact/?topic=${solution.slug}`} label="Contact" magnetic>
              Start a project
            </Button>
          </Reveal>
        </div>
      </section>

      <TransitionLink
        href={solutionHref(next.slug)}
        label={next.name}
        className={styles.next}
        data-theme="dark"
        data-cursor-label="Next"
      >
        <span className={styles.nextMedia} aria-hidden="true">
          <MaterialImage name={next.material} sizes="100vw" />
        </span>
        <span className={`wrap ${styles.nextInner}`}>
          <span className={styles.nextLabel}>Next solution — {next.index}</span>
          <span className={styles.nextName}>
            {next.name}
            <Icon name="arrow" />
          </span>
        </span>
      </TransitionLink>
    </div>
  );
}

/** Where this family sits in the build-up of a wall or floor. */
function BuildUpPosition({ current }: { current: string }) {
  const ordered = [...layers].reverse();
  return (
    <section className={`section ${styles.position}`} data-theme="light" aria-labelledby="position-title">
      <div className={`wrap ${styles.positionGrid}`}>
        <div>
          <p className="eyebrow">In the build-up</p>
          <h2 id="position-title" className={styles.positionTitle}>
            Where it sits, from structure to surface.
          </h2>
        </div>
        <Reveal as="ol" items className={styles.stack}>
          {ordered.map((layer) => {
            const isCurrent = layer.slug === current;
            return (
              <li key={layer.slug} data-reveal-item className={styles.stackRow} data-current={isCurrent || undefined}>
                <span className={styles.stackBar} aria-hidden="true" />
                <span className={styles.stackNo}>{pad(layer.layer.order)}</span>
                {isCurrent ? (
                  <span className={styles.stackName}>
                    {layer.name} <span className="visually-hidden">(this page)</span>
                  </span>
                ) : (
                  <TransitionLink
                    href={solutionHref(layer.slug)}
                    label={layer.name}
                    className={`link ${styles.stackName}`}
                  >
                    {layer.name}
                  </TransitionLink>
                )}
                <span className={styles.stackLabel}>{layer.layer.label}</span>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
