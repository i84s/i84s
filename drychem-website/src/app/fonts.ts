import localFont from "next/font/local";

/**
 * Typeface slots. DRYCHEM's official typefaces could not be verified (the
 * official site was unreachable during the build), so the site uses two open
 * licence families chosen for an engineered, industrial voice:
 *
 *  • Archivo — a grotesque with a width axis (62–125 %) used for kinetic display type.
 *  • JetBrains Mono — technical labels, indices and data.
 *
 * To switch to the official fonts, replace the `src` files below and keep the
 * CSS variable names (`--font-archivo`, `--font-jetbrains`).
 * Fonts are self-hosted (no runtime requests to third-party font services).
 */
export const archivo = localFont({
  src: "../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const jetbrains = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  style: "normal",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "monospace"],
  adjustFontFallback: false,
});
