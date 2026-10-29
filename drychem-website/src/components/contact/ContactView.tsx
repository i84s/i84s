"use client";

import { useRef } from "react";
import { contact, reach } from "@/content/company";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { onPageReveal } from "@/lib/reveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { InquiryForm } from "./InquiryForm";
import styles from "./ContactView.module.css";

export function ContactView() {
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
          .fromTo(q("[data-line]"), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "sweep" }, 0)
          .from(q("[data-hero-line] > span"), { yPercent: 112, duration: 1.25, stagger: 0.09 }, 0.15)
          .from(q("[data-hero-fade]"), { autoAlpha: 0, y: 16, duration: 1, stagger: 0.07 }, 0.5);
        return onPageReveal(() => intro.play());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <section className={styles.hero} data-theme="dark" aria-labelledby="contact-title">
        <div className="wrap">
          <nav aria-label="Breadcrumb" className={styles.crumbs} data-hero-fade>
            <ol>
              <li>
                <TransitionLink href="/" label="Home" className="link">
                  Home
                </TransitionLink>
              </li>
              <li aria-current="page">Contact</li>
            </ol>
          </nav>
          <h1 id="contact-title" className={styles.title}>
            <span className={styles.line} data-hero-line>
              <span>Start a</span>
            </span>
            <span className={styles.line} data-hero-line>
              <span>project.</span>
            </span>
          </h1>
          <span className={styles.rule} data-line aria-hidden="true" />
          <p className={styles.lede} data-hero-fade>
            A new product line, a toll-manufacturing partnership, MasterMix supply or a project specification — tell us
            what you’re building and our sales and partnerships team will respond.
          </p>
        </div>
      </section>

      <section className={`section ${styles.body}`} data-theme="light" aria-label="Inquiry form and contact details">
        <div className={`wrap ${styles.grid}`}>
          <div className={styles.formCol}>
            <h2 className={styles.formTitle}>Your inquiry</h2>
            <InquiryForm />
          </div>

          <Reveal as="aside" items className={styles.aside}>
            <div className={styles.block} data-reveal-item>
              <h2 className={styles.blockLabel}>{contact.office.label}</h2>
              <address className={styles.address}>
                {contact.office.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            </div>
            <div className={styles.block} data-reveal-item>
              <h2 className={styles.blockLabel}>{contact.tollFree.label}</h2>
              <a className={styles.big} href={contact.tollFree.href}>
                {contact.tollFree.display}
              </a>
            </div>
            <div className={styles.block} data-reveal-item>
              <h2 className={styles.blockLabel}>{contact.salesEmail.label}</h2>
              <a className={`link ${styles.mail}`} href={contact.salesEmail.href}>
                {contact.salesEmail.display}
              </a>
            </div>
            <div className={styles.block} data-reveal-item>
              <h2 className={styles.blockLabel}>{contact.exportsEmail.label}</h2>
              <a className={`link ${styles.mail}`} href={contact.exportsEmail.href}>
                {contact.exportsEmail.display}
              </a>
              <p className={styles.small}>
                For distributors and partners in the {reach.countries} countries we supply.
              </p>
            </div>
            <div className={styles.block} data-reveal-item>
              <a
                className={`link link--static ${styles.external}`}
                href="https://drychem.com/contact-us"
                target="_blank"
                rel="noopener noreferrer"
              >
                Plant addresses on drychem.com
                <Icon name="arrow-up-right" />
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
