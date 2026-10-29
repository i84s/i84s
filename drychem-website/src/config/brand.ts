/**
 * ──────────────────────────────────────────────────────────────────────────
 *  BRAND SLOTS — replace with official DRYCHEM assets before launch
 * ──────────────────────────────────────────────────────────────────────────
 * drychem.com could not be reached from the build environment, so the official
 * logo, colours and typefaces could NOT be verified. Nothing here is an
 * official DRYCHEM asset:
 *
 *  • Logo: until `logo.src` points at the official file, the header and footer
 *    render the company name as plain text. This is a placeholder, not a logo.
 *  • Colours: `--brand-primary` / `--brand-primary-ink` in `src/app/globals.css`
 *    hold a neutral, provisional accent. Replace them with the official values.
 *  • Typefaces: see `src/app/fonts.ts`.
 *
 * See `docs/BRAND-SLOTS.md` for the step-by-step swap guide.
 */

export type LogoAsset = {
  /** Path under /public, e.g. "/brand/drychem-logo.svg". */
  src: string;
  /** Intrinsic dimensions — keep the official proportions. */
  width: number;
  height: number;
};

export const brand: {
  name: string;
  /** Logo for light backgrounds. */
  logo: LogoAsset | null;
  /** Optional reversed logo for dark backgrounds (falls back to `logo`). */
  logoOnDark: LogoAsset | null;
} = {
  name: "DRYCHEM",
  logo: null,
  logoOnDark: null,
};
