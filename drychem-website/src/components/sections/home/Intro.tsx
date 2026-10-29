import { keyFacts } from "@/content/company";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { MediaReveal } from "@/components/motion/MediaReveal";
import { MaterialImage } from "@/components/media/MaterialImage";
import { Icon } from "@/components/ui/Icon";
import styles from "./Intro.module.css";

export function Intro() {
  return (
    <section id="about" className={`section ${styles.intro}`} data-theme="light" aria-labelledby="about-title">
      <div className="wrap">
        <header className={styles.head}>
          <p className="eyebrow">01 — About</p>
          <h2 id="about-title" className="visually-hidden">
            About DRYCHEM
          </h2>
        </header>

        <RevealText as="p" mode="scrub" className={styles.statement}>
          Since the 1980s, DRYCHEM has turned mineral chemistry into the materials buildings depend on — the putty
          behind a flawless wall, the adhesive beneath the tile, the mortar that restores a structure.
        </RevealText>

        <div className={styles.body}>
          <figure className={styles.figure}>
            <MediaReveal className={styles.frame} parallax={9} shade="strong">
              <MaterialImage
                name="putty"
                sizes="(min-width: 900px) 36vw, 92vw"
                alt="Material study: a smooth skim coat of wall putty under low raking light, showing faint trowel arcs."
              />
            </MediaReveal>
            <figcaption className={styles.caption}>
              <span>Fig. 01</span>
              <span>Material study — finishing coat under raking light</span>
            </figcaption>
          </figure>

          <div className={styles.text}>
            <RevealText as="h3" className={styles.subhead}>
              From a first-generation venture to one of India’s leading construction-products manufacturers.
            </RevealText>
            <Reveal items className={styles.copy}>
              <p data-reveal-item>
                Founded by first-generation entrepreneur Ashok Mehta, DRYCHEM is today the third-largest producer of
                wall putty in India.
              </p>
              <p data-reveal-item>
                Our expertise spans the entire value chain — formula development, manufacturing, distribution and
                commercialisation — for our own range and for the brands we manufacture for.
              </p>
              <p data-reveal-item>
                <a
                  className={`link link--static ${styles.more}`}
                  href="https://drychem.com/about-us/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Our story on drychem.com
                  <Icon name="arrow-up-right" />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal as="dl" items className={styles.facts}>
          {keyFacts.map((fact) => (
            <div key={fact.label} className={styles.fact} data-reveal-item>
              <dt>{fact.label}</dt>
              <dd>{fact.count ? <Counter value={fact.count} /> : fact.value}</dd>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
