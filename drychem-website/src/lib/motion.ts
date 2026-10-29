/** Motion tokens shared by GSAP timelines (CSS mirrors these in globals.css). */
export const dur = {
  micro: 0.35,
  fast: 0.6,
  base: 0.9,
  slow: 1.2,
  hero: 1.5,
} as const;

export const stagger = {
  lines: 0.09,
  words: 0.025,
  items: 0.08,
} as const;

/** Media queries used with gsap.matchMedia(). */
export const mq = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 900px)",
  pinnable: "(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(mq.reduce).matches;
