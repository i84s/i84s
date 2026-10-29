"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { primaryNav, homeSections } from "@/config/site";
import { brand } from "@/config/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";

const routeSection = (pathname: string) =>
  pathname.startsWith("/solutions") ? "solutions" : pathname.startsWith("/contact") ? "contact" : null;

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [homeActive, setHomeActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = isHome ? homeActive : routeSection(pathname);

  // Theme follows the section under the bar; hide on scroll down, show on scroll up.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const probe = document
        .elementsFromPoint(window.innerWidth / 2, header.offsetHeight / 2)
        .find((el) => !header.contains(el) && el.closest("[data-theme]"));
      header.dataset.theme = probe?.closest<HTMLElement>("[data-theme]")?.dataset.theme ?? "dark";

      const delta = y - lastY;
      if (y < 120 || delta < -4) header.dataset.hidden = "false";
      else if (delta > 4 && !header.matches(":focus-within")) header.dataset.hidden = "true";
      header.dataset.scrolled = String(y > 24);
      lastY = y;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  // Active home section (drives the sliding indicator).
  useEffect(() => {
    if (!isHome) return;
    const targets = homeSections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setHomeActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    const top = () => {
      if (window.scrollY < window.innerHeight * 0.5) setHomeActive(null);
    };
    window.addEventListener("scroll", top, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", top);
    };
  }, [isHome]);

  // Position the indicator under the active link.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const place = () => {
      const link = active ? nav.querySelector<HTMLElement>(`[data-section="${active}"]`) : null;
      nav.style.setProperty("--ind-x", `${link ? link.offsetLeft : 0}px`);
      nav.style.setProperty("--ind-w", `${link ? link.offsetWidth : 0}px`);
      nav.dataset.indicator = link ? "on" : "off";
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [active]);

  const closeMenu = (restoreFocus: boolean) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  };

  return (
    <header
      ref={headerRef}
      className={styles.header}
      data-theme="dark"
      data-hidden="false"
      data-menu={menuOpen ? "open" : "closed"}
    >
      <div className={styles.progress} aria-hidden="true" />
      <div className={`wrap ${styles.bar}`}>
        <TransitionLink href="/" label="Home" className={styles.logo} aria-label={`${brand.name} — home`}>
          <BrandLogo surface="dark" className={styles.logoDark} />
          <BrandLogo surface="light" className={styles.logoLight} />
        </TransitionLink>

        <nav aria-label="Primary" className={styles.nav}>
          <div ref={navRef} className={styles.links}>
            <ul>
              {primaryNav.map((item) => (
                <li key={item.section}>
                  <TransitionLink
                    href={item.href}
                    label={item.label}
                    data-section={item.section}
                    aria-current={active === item.section ? "true" : undefined}
                    className={styles.link}
                  >
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
            <span className={styles.indicator} aria-hidden="true" />
          </div>
        </nav>

        <div className={styles.actions}>
          <span className={styles.cta}>
            <Button href="/contact/" label="Contact" variant="outline" icon="arrow">
              Contact
            </Button>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className={styles.menuBtn}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.menuLabel}>{menuOpen ? "Close" : "Menu"}</span>
            <span className={styles.burger} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
      <MobileMenu id="site-menu" open={menuOpen} onClose={closeMenu} toggleRef={toggleRef} />
    </header>
  );
}
