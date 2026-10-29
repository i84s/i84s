import { solutions, solutionHref } from "@/content/solutions";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Reveal } from "@/components/motion/Reveal";
import { MaterialImage } from "@/components/media/MaterialImage";
import { Icon } from "@/components/ui/Icon";
import styles from "./SolutionsIndex.module.css";

/**
 * The complete portfolio as a typographic index. Hovering a row brings its name
 * forward and fills its arrow; small screens add a thumbnail per row.
 */
export function SolutionsIndex() {
  return (
    <section className={`section ${styles.index}`} data-theme="dark" aria-labelledby="portfolio-title">
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="portfolio-title" className={styles.title}>
            The complete portfolio
          </h2>
          <p className={styles.count}>{String(solutions.length).padStart(2, "0")} solution families</p>
        </header>

        <Reveal items start="top 90%">
          <ol className={styles.listInner}>
            {solutions.map((s) => (
              <li key={s.slug} data-reveal-item>
                <TransitionLink href={solutionHref(s.slug)} label={s.name} className={styles.row}>
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
    </section>
  );
}
