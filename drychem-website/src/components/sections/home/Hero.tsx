"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { onPageReveal } from "@/lib/reveal";
import { materialThumb } from "@/lib/media";
import { MaterialSurface, type SurfaceState } from "@/components/media/MaterialSurface";
import { Button } from "@/components/ui/Button";
import styles from "./Hero.module.css";

/**
 * Hero: a raking-light wall surface with a laser level line. The headline sits
 * beneath the line. On entry the surface settles from raw plaster towards a
 * finish; scrolling on (as the next chapter slides over) completes the finish.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  // Mutable per-frame state for the WebGL surface (tweened by GSAP, read by the render loop).
  const surfaceRef = useRef<SurfaceState>({ rough: 1, finish: 0, exposure: 0, line: 0, lineY: 0.64, active: true });

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const surface = surfaceRef.current;
      const q = gsap.utils.selector(el);
      const kicker = q("[data-hero-kicker]")[0] as HTMLElement | undefined;

      // Seat the laser line just above the kicker, whatever the layout.
      const placeLine = () => {
        if (!kicker) return;
        const y = kicker.offsetTop - Math.min(40, el.clientHeight * 0.04);
        surface.lineY = Math.min(0.92, Math.max(0.3, 1 - y / el.clientHeight));
      };
      placeLine();
      const ro = new ResizeObserver(placeLine);
      ro.observe(el);

      const mm = gsap.matchMedia();
      mm.add({ motion: mq.motion, reduce: mq.reduce }, (ctx) => {
        if (ctx.conditions?.reduce) {
          Object.assign(surface, { rough: 0.5, exposure: 1, line: 1 });
          return;
        }

        // No CSS pre-hide is needed: the preloader (or page curtain) covers the first paint,
        // and these from-states are applied before it opens. Without JS the content just shows.
        const intro = gsap.timeline({ paused: true });
        intro
          .to(surface, { exposure: 1, duration: 2.4, ease: "power2.out" }, 0)
          .to(surface, { line: 1, duration: 1.7, ease: "sweep" }, 0.2)
          .to(surface, { rough: 0.6, duration: 3.2, ease: "settle" }, 0.4)
          .from(q("[data-hero-line] > span"), { yPercent: 112, duration: 1.35, stagger: 0.1 }, 0.3)
          .from(q("[data-hero-fade]"), { autoAlpha: 0, y: 20, duration: 1.1, stagger: 0.08 }, 0.75)
          .from(q("[data-hero-mark]"), { scale: 0, duration: 1, stagger: 0.06 }, 0.6);
        const unsubscribe = onPageReveal(() => intro.play());

        // The About chapter slides over the (sticky) hero; the stack wrapper is the trigger.
        const stack = el.parentElement;
        if (stack) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: stack,
                start: "top top",
                end: () => `+=${window.innerHeight}`,
                scrub: true,
                // Stop rendering once the hero is fully covered.
                onToggle: (self) => {
                  surface.active = self.isActive || self.progress < 1;
                },
              },
            })
            .to(surface, { finish: 1, ease: "none" }, 0)
            // Opacity only: visibility:hidden would drop the h1 from the accessibility tree.
            .to(q("[data-hero-content]"), { yPercent: -16, opacity: 0, ease: "none" }, 0);
        }

        return unsubscribe;
      });

      return () => {
        ro.disconnect();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.hero} data-theme="dark" aria-labelledby="hero-title">
      <div className={styles.media} aria-hidden="true">
        <div className={styles.poster} style={{ backgroundImage: `url(${materialThumb("plaster")})` }} />
        <MaterialSurface stateRef={surfaceRef} className={styles.canvas} />
        <div className={styles.shade} />
      </div>

      <div className={styles.marks} aria-hidden="true">
        <span data-hero-mark />
        <span data-hero-mark />
        <span data-hero-mark />
        <span data-hero-mark />
      </div>

      <div className={`wrap ${styles.content}`} data-hero-content>
        <p className={styles.kicker} data-hero-fade data-hero-kicker>
          <span>Building &amp; construction materials</span>
          <span>Since the 1980s</span>
        </p>

        <h1 id="hero-title" className={styles.title}>
          <span className={styles.line} data-hero-line>
            <span>Engineering</span>
          </span>{" "}
          <span className={styles.line} data-hero-line>
            <span>excellence.</span>
          </span>{" "}
          <span className={`${styles.line} ${styles.soft}`} data-hero-line>
            <span>Built to last.</span>
          </span>
        </h1>

        <div className={styles.aside}>
          <p className={styles.lede} data-hero-fade>
            Wall putty, tile adhesives, plasters, structural repair systems and coatings — formulated in NABL-accredited
            labs, made in 25 facilities across India and supplied to 23&nbsp;countries.
          </p>
          <div className={styles.actions} data-hero-fade>
            <Button href="/contact/" label="Start a project" magnetic>
              Start a project
            </Button>
            <Button href="/#solutions" variant="ghost" icon="arrow-down">
              Explore solutions
            </Button>
          </div>
        </div>

        <div className={styles.meta} data-hero-fade>
          <span className={styles.scroll} aria-hidden="true">
            <span className={styles.scrollTrack}>
              <span />
            </span>
            Scroll
          </span>
          <span>Navi Mumbai, India</span>
          <span>ISO 9001:2015</span>
        </div>
      </div>
    </section>
  );
}
