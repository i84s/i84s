/**
 * ──────────────────────────────────────────────────────────────────────────
 *  BRAND
 * ──────────────────────────────────────────────────────────────────────────
 *  • Logo: the IMC artwork supplied by the client (`brand-source/`),
 *    vectorised by `scripts/trace_logo.py` into `public/brand/`. Re-run the
 *    script if the source files change, or drop in official vector files
 *    under the same names.
 *  • Colours: `--brand-primary` in `src/app/globals.css` is the teal measured
 *    from the same artwork; every accent derives from it.
 *  • Typefaces: provisional, see `src/app/fonts.ts`.
 *
 * See `docs/BRAND-SLOTS.md` for the full guide.
 */

import logos from "@/generated/logos.json";

/** "mark" is the IMC symbol alone; the lockups add the company name in Arabic and English. */
export type LogoVariant = keyof typeof logos;

export type LogoAsset = {
  /** Path under /public. */
  src: string;
  /** Intrinsic dimensions, from the artwork. */
  width: number;
  height: number;
};

export const brand = {
  /** What the logo reads as, for link labels such as "IMC — home". */
  name: "IMC",
  /** Alt text for the logo artwork. */
  alt: "IMC — Industrial Minerals Company (SFZ) L.L.C",
  /** Full-colour artwork for light surfaces; reversed (light green) for dark ones. */
  logo(variant: LogoVariant, surface: "light" | "dark"): LogoAsset {
    return { src: `/brand/imc-${variant}${surface === "dark" ? "-reversed" : ""}.svg`, ...logos[variant] };
  },
};
