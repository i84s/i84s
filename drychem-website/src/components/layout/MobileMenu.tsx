"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { primaryNav, solutionNav } from "@/config/site";
import { contact } from "@/content/company";
import { lockScroll } from "@/lib/scroll";
import { TransitionLink } from "@/components/motion/TransitionLink";
import styles from "./MobileMenu.module.css";

type Props = {
  id: string;
  open: boolean;
  onClose: (restoreFocus: boolean) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Full-screen navigation for small screens: focus-trapped, Esc to close, page inert behind it. */
export function MobileMenu({ id, open, onClose, toggleRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const page = [document.getElementById("main"), document.querySelector("footer")].filter((el): el is HTMLElement =>
      Boolean(el),
    );
    page.forEach((el) => (el.inert = true));
    lockScroll(true);
    const focusTimer = window.setTimeout(() => panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus(), 80);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current(true);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [toggleRef.current, ...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el): el is HTMLElement => Boolean(el),
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Close if the viewport grows past the mobile breakpoint.
    const wide = window.matchMedia("(min-width: 901px)");
    const onWide = () => wide.matches && onCloseRef.current(false);
    wide.addEventListener("change", onWide);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      page.forEach((el) => (el.inert = false));
      lockScroll(false);
    };
  }, [open, toggleRef]);

  const close = () => onClose(false);

  return (
    <div
      ref={panelRef}
      id={id}
      className={styles.menu}
      data-open={open}
      data-theme="dark"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      inert={!open}
    >
      <div className={`wrap ${styles.inner}`}>
        <nav aria-label="Menu">
          <ol className={styles.primary}>
            {[...primaryNav, { label: "Contact", href: "/contact/", section: "contact" }].map((item, i) => (
              <li key={item.href} style={{ "--i": i } as CSSProperties}>
                <TransitionLink href={item.href} label={item.label} className={styles.primaryLink} onClick={close}>
                  <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.mask}>
                    <span>{item.label}</span>
                  </span>
                </TransitionLink>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.secondary}>
          <p className={styles.heading}>Solutions</p>
          <ul>
            {solutionNav.map((item) => (
              <li key={item.href}>
                <TransitionLink href={item.href} label={item.label} className={styles.small} onClick={close}>
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.contact}>
          <a href={contact.tollFree.href} className={styles.small}>
            {contact.tollFree.label}: {contact.tollFree.display}
          </a>
          <a href={contact.salesEmail.href} className={styles.small}>
            {contact.salesEmail.display}
          </a>
        </div>
      </div>
    </div>
  );
}
