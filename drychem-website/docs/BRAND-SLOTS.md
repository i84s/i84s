# Brand slots — swapping in the official DRYCHEM identity

The official website (drychem.com) could not be reached from the environment
this site was built in. Brand facts were researched through web search, but
**the logo, brand colours, typefaces and photography could not be verified**.
Instead of guessing, the site isolates every brand-specific decision in a few
clearly marked slots. Nothing in them is presented as an official asset.

| Slot                     | Current state                                                 | Where                                                        |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Logo                     | Company name as plain text (placeholder, not a designed mark) | `src/config/brand.ts`                                        |
| Logo on dark backgrounds | Falls back to the main logo                                   | `src/config/brand.ts`                                        |
| Primary brand colour     | Provisional neutral mineral accent `#c8b38b`                  | `src/app/globals.css` → `--brand-primary`                    |
| Text on brand colour     | `#111313`                                                     | `src/app/globals.css` → `--brand-primary-ink`                |
| Typefaces                | Archivo (display/body) + JetBrains Mono (labels), self-hosted | `src/app/fonts.ts`                                           |
| Favicon                  | Neutral "level line" glyph                                    | `public/brand/favicon.svg`                                   |
| Photography              | Procedural material studies                                   | `src/lib/media.ts`, `src/components/media/MaterialImage.tsx` |

## 1. Logo

1. Put the official files in `public/brand/`. SVG is best: `drychem-logo.svg`
   for light backgrounds and `drychem-logo-reversed.svg` for dark ones.
2. Edit `src/config/brand.ts`:

   ```ts
   export const brand = {
     name: "DRYCHEM",
     logo: { src: "/brand/drychem-logo.svg", width: 180, height: 32 },
     logoOnDark: { src: "/brand/drychem-logo-reversed.svg", width: 180, height: 32 },
   };
   ```

   Use the artwork's intrinsic `width`/`height` so its proportions are kept.
   The header switches between the two versions automatically as it passes
   over light and dark sections. Display height is set in
   `src/components/brand/BrandLogo.module.css` (`.logo { height: 22px }`).

## 2. Colours

In `src/app/globals.css`:

```css
:root {
  --brand-primary: #……; /* official primary colour */
  --brand-primary-ink: #……; /* text/icon colour used on top of it */
}
```

Everything else derives from these: the level line in the hero, preloader and
curtain, button fills, focus rings, the progress rule, the map, active states
and text selection. The WebGL hero reads `--brand-primary` at runtime as well.

**Check contrast after changing it.** On light sections the accent is mixed
with graphite (`--accent: color-mix(… 46% …)`) so small accent text keeps a
4.5:1 ratio. A darker or more saturated brand colour may need a different mix.
`npm run qa` re-runs the automated accessibility audit if you wire it to axe
(see README → Quality checks).

If the brand uses a second colour, add it beside `--brand-primary` and use it
deliberately. The neutral palette was designed to carry the interface on its
own.

## 3. Typefaces

`src/app/fonts.ts` loads two self-hosted variable fonts through
`next/font/local`. To use the official typefaces, replace the `src` paths with
the licensed WOFF2 files (for example under `src/fonts/`). Keep the variable
names `--font-archivo` and `--font-jetbrains`, or rename them in `globals.css`
(`--font-sans`, `--font-mono`).

Display sizes are tuned for a slightly condensed grotesque (`font-stretch:
86–94%`). A non-variable official face will simply ignore `font-stretch`, so
re-check the large headlines for line length.

## 4. Photography

Every image goes through `MaterialImage` and the `material()` helper, which
reads `src/generated/media.json`. To use real DRYCHEM photography:

- **Replace a study**: drop a PNG/JPEG master named after the study (for
  example `putty.png`) into `assets-src/materials/` and run
  `node scripts/build-images.mjs`. The responsive AVIF/WebP variants and the
  manifest are regenerated.
- **Add new photography**: put the master in the same folder under a new name,
  run the script, add the key to the `MaterialKey` type in
  `src/content/solutions.ts`, then reference it from a solution (`material`) or
  section.

Good candidates: product packshots on the solution pages, plant and lab
photography for Research & quality and Manufacturing & reach, and application
shots for the build-up panels.

## 5. Favicon and social image

- `public/brand/favicon.svg`: replace with the official favicon.
- `public/media/og.jpg` (1200 × 630): currently rendered from the hero. Once
  the logo is in, regenerate it (see `scripts/` in the README) or replace it
  with an approved design.
