"use client";

import { useRef, type CSSProperties } from "react";
import { layers, solutionHref } from "@/content/solutions";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { materialColor } from "@/lib/media";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";
import { MediaReveal } from "@/components/motion/MediaReveal";
import { MaterialImage } from "@/components/media/MaterialImage";
import { Button } from "@/components/ui/Button";
import styles from "./BuildUp.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "The build-up": the five physical solution families as an exploded stack of
 * material slabs, from structure to surface. On large screens the stage sticks
 * to the viewport while a tall track scrolls past, and scroll drives a camera
 * orbit, the explode and a layer-by-layer focus; on small screens (or with
 * reduced motion) it becomes a simple vertical list.
 *
 * The stage is held with CSS `position: sticky` rather than a ScrollTrigger pin:
 * it can't end up off screen if scroll positions are measured before the layout
 * settles, and it needs no pin spacer.
 */
export function BuildUp() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(mq.pinnable, () => {
        const track = q("[data-track]")[0] as HTMLElement;
        const tilt = q("[data-tilt]")[0] as HTMLElement;
        const spin = q("[data-spin]")[0] as HTMLElement;
        const slabs = q("[data-slab]") as HTMLElement[];
        const panels = q("[data-panel]") as HTMLElement[];
        const ticks = q("[data-tick]") as HTMLElement[];
        const n = slabs.length;
        let active = -1;

        // Geometry from the rendered size, so it survives resizes (invalidateOnRefresh).
        const size = () => spin.offsetWidth;
        const thick = () => size() * 0.075;
        const gap = () => size() * 0.17;

        const setActive = (index: number) => {
          if (index === active) return;
          active = index;
          panels.forEach((p, i) => {
            p.inert = i !== index;
            p.setAttribute("aria-hidden", String(i !== index));
          });
          slabs.forEach((s, i) => s.toggleAttribute("data-active", i === index));
          ticks.forEach((t, i) => t.toggleAttribute("data-active", i === index));
        };

        gsap.set(slabs, { z: (i) => i * thick() });
        gsap.set(panels, { autoAlpha: 0, y: 48 });
        gsap.set(panels.slice(0, 1), { autoAlpha: 1, y: 0 });
        setActive(0);

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut", duration: 0.5 },
          scrollTrigger: {
            // The track is one screen taller than the scroll distance (see .track in the CSS).
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.9,
            invalidateOnRefresh: true,
            // Layer i takes focus at timeline time i. Use the scroll position (not the
            // scrub-smoothed playhead, which lags) so ticks and focus stay in step.
            onUpdate: (self) => {
              const time = self.progress * (self.animation?.duration() ?? n);
              setActive(Math.min(n - 1, Math.max(0, Math.floor(time - 0.15))));
            },
          },
        });

        // Camera: a slow orbit across the whole sequence.
        tl.fromTo(tilt, { rotationX: 62 }, { rotationX: 52, duration: n, ease: "none" }, 0).fromTo(
          spin,
          { rotation: -44 },
          { rotation: -22, duration: n, ease: "none" },
          0,
        );

        // Explode the assembled stack, then focus each layer in turn.
        // (Slab 0 stays at z = 0, so it is left out to avoid overlapping its focus tween.)
        tl.to(slabs.slice(1), { z: (i) => (i + 1) * (thick() + gap()), duration: 0.7, ease: "power3.inOut" }, 0);
        slabs.forEach((slab, i) => {
          const at = i === 0 ? 0.25 : i;
          const z = () => i * (thick() + gap());
          tl.to(slabs, { "--dim": (j: number) => (j === i ? 0 : 0.58), duration: 0.45 }, at);
          tl.to(slab, { z: () => z() + gap() * 0.38, duration: 0.5 }, at);
          const prevSlab = slabs[i - 1];
          const prevPanel = panels[i - 1];
          const panel = panels[i];
          if (prevSlab && prevPanel && panel) {
            tl.to(prevSlab, { z: () => (i - 1) * (thick() + gap()), duration: 0.5 }, at);
            tl.to(prevPanel, { autoAlpha: 0, y: -48, duration: 0.3, ease: "power2.in" }, at);
            tl.fromTo(
              panel,
              { autoAlpha: 0, y: 48 },
              { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
              at + 0.18,
            );
          }
        });
        tl.to({}, { duration: 0.35 }); // hold on the last layer before unpinning

        return () => {
          panels.forEach((p) => {
            p.inert = false;
            p.removeAttribute("aria-hidden");
          });
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="solutions"
      className={`section ${styles.buildup}`}
      data-theme="dark"
      aria-labelledby="solutions-title"
    >
      <header className={`wrap ${styles.head}`}>
        <p className="eyebrow">02 — Solutions</p>
        <RevealText as="h2" id="solutions-title" className={`headline ${styles.title}`}>
          Every layer of a building, engineered.
        </RevealText>
        <Reveal as="p" className={`lede ${styles.lede}`} delay={0.2}>
          From structural repair to the final coat, five solution families cover the build-up of a wall or floor — from
          structure to surface.
        </Reveal>
      </header>

      <div className={styles.track} data-track style={{ "--layers": layers.length } as CSSProperties}>
        <div className={styles.stage}>
          <div className={`wrap ${styles.grid}`}>
            <div className={styles.visual} aria-hidden="true">
              <div className={styles.scene}>
                <div className={styles.tilt} data-tilt>
                  <div className={styles.spin} data-spin>
                    {layers.map((layer) => (
                      <div
                        key={layer.slug}
                        className={styles.slab}
                        data-slab
                        style={
                          {
                            "--tone": materialColor(layer.material),
                          } as CSSProperties
                        }
                      >
                        <div className={`${styles.face} ${styles.top}`}>
                          <MaterialImage name={layer.material} sizes="420px" className={styles.faceImage} />
                        </div>
                        <div className={`${styles.face} ${styles.front}`}>
                          <span>{pad(layer.layer.order)}</span>
                        </div>
                        <div className={`${styles.face} ${styles.side}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.panels}>
              {layers.map((layer) => (
                <article key={layer.slug} className={styles.panel} data-panel aria-labelledby={`layer-${layer.slug}`}>
                  <div className={styles.panelVisual}>
                    <MediaReveal className={styles.panelFrame} parallax={6}>
                      <MaterialImage name={layer.material} sizes="(min-width: 600px) 60vw, 92vw" alt="" />
                    </MediaReveal>
                  </div>
                  <p className={styles.index}>
                    <span>Layer {pad(layer.layer.order)}</span>
                    <span>/ {pad(layers.length)}</span>
                    <span className={styles.layerName}>{layer.layer.label}</span>
                  </p>
                  <h3 id={`layer-${layer.slug}`} className={styles.panelTitle}>
                    {layer.name}
                  </h3>
                  <p className={styles.tagline}>{layer.tagline}</p>
                  <p className={styles.summary}>{layer.summary}</p>
                  <ul className={styles.highlights}>
                    {layer.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <Button href={solutionHref(layer.slug)} label={layer.name} variant="outline">
                    {`Explore ${layer.short.toLowerCase()}`}
                  </Button>
                </article>
              ))}
            </div>
          </div>

          <ol className={`wrap ${styles.ticks}`} aria-hidden="true">
            {layers.map((layer) => (
              <li key={layer.slug} data-tick>
                <span>{pad(layer.layer.order)}</span> {layer.layer.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
