"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { mq } from "@/lib/motion";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

type Props = {
  children: string;
  href?: string;
  variant?: "solid" | "outline" | "ghost";
  icon?: IconName | null;
  /** Name for the page-transition curtain (internal links). */
  label?: string;
  magnetic?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");

/** Direction the icon rolls on hover. */
const axis = (icon: IconName) => (icon === "arrow-down" ? "down" : icon === "arrow-up" ? "up" : "x");

/**
 * Call-to-action with a rolling label, fill wipe and (optionally) a magnetic
 * pull towards the pointer on fine-pointer devices.
 */
export function Button({
  children,
  href,
  variant = "solid",
  icon = "arrow",
  label,
  magnetic = false,
  className,
  type = "button",
  disabled,
  onClick,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!magnetic) return;
      const mm = gsap.matchMedia();
      mm.add(`${mq.finePointer} and ${mq.motion}`, () => {
        const el = ref.current;
        if (!el) return;
        const inner = el.firstElementChild as HTMLElement;
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
        const ixTo = gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" });
        const iyTo = gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          xTo(dx * 0.22);
          yTo(dy * 0.3);
          ixTo(dx * 0.08);
          iyTo(dy * 0.1);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
          ixTo(0);
          iyTo(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
      return () => mm.revert();
    },
    { dependencies: [magnetic], scope: ref },
  );

  const cls = [styles.btn, styles[variant], className].filter(Boolean).join(" ");
  const content = (
    <span className={styles.inner}>
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.text}>
        <span className={styles.roll} data-text={children}>
          {children}
        </span>
      </span>
      {icon && (
        <span className={styles.icon} data-axis={axis(icon)} aria-hidden="true">
          <Icon name={icon} />
          <Icon name={icon} />
        </span>
      )}
    </span>
  );

  let control: ReactNode;
  if (href && isInternal(href)) {
    control = (
      <TransitionLink href={href} label={label} className={cls} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </TransitionLink>
    );
  } else if (href) {
    const external = /^https?:/.test(href);
    control = (
      <a
        href={href}
        className={cls}
        aria-label={ariaLabel}
        onClick={onClick}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
        {external && <span className="visually-hidden"> (opens in a new tab)</span>}
      </a>
    );
  } else {
    control = (
      <button type={type} className={cls} disabled={disabled} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  return (
    <span ref={ref} className={styles.magnet}>
      {control}
    </span>
  );
}
