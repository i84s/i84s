# Brand slots — the logo, colours and other identity assets

The official website (drychem.com) could not be reached from the environment
this site was built in, so every brand-specific decision sits in a few clearly
marked slots. The logo is now the **IMC artwork supplied by the client**. The
site's copy, company facts, products and contact details are still DRYCHEM's
(see `docs/CONTENT-SOURCES.md`); nothing here changes them.

| Slot                 | Current state                                                              | Where                                                        |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Logo                 | IMC artwork supplied by the client, vectorised: symbol and two lockups     | `src/config/brand.ts`, `public/brand/`                       |
| Logo on dark         | Reversed versions derived from the same artwork (green → off-white)        | `public/brand/*-reversed.svg`                                |
| Primary brand colour | IMC teal `#158e87`, measured from the logo                                 | `src/app/globals.css` → `--brand-primary`                    |
| Text on brand colour | `#111313`                                                                  | `src/app/globals.css` → `--brand-primary-ink`                |
| Typefaces            | Provisional: Archivo (display/body) + JetBrains Mono (labels), self-hosted | `src/app/fonts.ts`                                           |
| Favicon              | The IMC symbol on a white tile, generated from the logo                    | `public/brand/favicon.svg`                                   |
| Photography          | Procedural material studies                                                | `src/lib/media.ts`, `src/components/media/MaterialImage.tsx` |

## 1. Logo

The client supplied the logo as two flat-colour JPEGs, kept in `brand-source/`:
a horizontal lockup (symbol, then the company name in Arabic and English,
"Industrial Minerals Company (SFZ) L.L.C") and a stacked one ("INDUSTRIAL
MINERALS COMPANY"). `scripts/trace_logo.py` turns them into transparent SVGs in
`public/brand/`: it separates the logo's two colours, upsamples, and traces each
colour with potrace. It writes

- `imc-mark.svg`: the symbol alone, cropped from the stacked artwork;
- `imc-horizontal.svg` and `imc-stacked.svg`: the two lockups;
- a `-reversed` version of each for dark surfaces;
- `favicon.svg`; and the artwork sizes in `src/generated/logos.json`.

To re-run it after changing the source files:

```bash
pip install potracer numpy pillow
python3 scripts/trace_logo.py
```

Where each version is used, and where its display size is set:

| Place                 | Artwork                     | Size set in                                             |
| --------------------- | --------------------------- | ------------------------------------------------------- |
| Header                | Symbol, colour or reversed  | `SiteHeader.module.css` → `.logo img`                   |
| Opening sequence      | Symbol, reversed            | `Preloader.module.css` → `.mark img`                    |
| Page-transition panel | Symbol, reversed            | `TransitionProvider.module.css` → `.brand img`          |
| Footer                | Horizontal lockup, reversed | `SiteFooter.module.css` → `.logo` (width, up to 460 px) |

The header switches between the colour and reversed artwork automatically as
it passes over light and dark sections. The lockups' lettering is small, so they
are only used where they can be shown large enough to read; the header uses the
symbol alone.

Two things to confirm with the brand owner:

- **Reversed treatment.** The `-reversed` files swap the green for off-white
  (`#f2f0eb`) and keep the teal. That was derived for this site, not supplied.
  If the brand guidelines specify a different version for dark backgrounds
  (all-white, for example), replace those files.
- **Master files.** The traces follow the supplied artwork closely, but they
  are traced from raster images. If official vector files (SVG, AI, EPS or PDF)
  exist, export them under the same names into `public/brand/` and update the
  sizes in `src/generated/logos.json`.

## 2. Colours

In `src/app/globals.css`:

```css
:root {
  --brand-primary: #158e87; /* the teal of the IMC logo */
  --brand-primary-ink: #111313; /* text/icon colour used on top of it */
}
```

The teal was measured from the supplied artwork (the logo's green is
`#1e572c`). If the brand guidelines give exact values, use those. Everything
else derives from these two: the level line in the hero, preloader and curtain,
button fills, focus rings, the progress rule, the map, active states and text
selection. The WebGL hero reads `--brand-primary` at runtime as well.

**Contrast.** The teal is a mid-tone, so accent text is adjusted per surface:

| Use                                 | Colour                          | Contrast                        |
| ----------------------------------- | ------------------------------- | ------------------------------- |
| Accent text on dark sections        | Teal mixed 80/20 with off-white | 5.8–6.4:1                       |
| Accent text on light sections       | Teal mixed 62/38 with graphite  | 5.9–7.2:1                       |
| Text on teal fills (buttons, hover) | `#111313`                       | 4.7:1                           |
| Focus rings                         | Teal                            | ≥ 3.2:1 (light), ≥ 4.4:1 (dark) |

White text on the teal is only 4.0:1, too low for small text, which is why the
ink is dark. Re-check these after changing either colour; `npm run qa` runs the
axe-core audit on every page.

The logo green is not used as an interface colour, so the site keeps a single
accent. If you want it, add it beside `--brand-primary` and use it deliberately.

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
reads `src/generated/media.json`. To use real photography:

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

- `public/brand/favicon.svg`: the IMC symbol on a white rounded tile, written
  by `scripts/trace_logo.py`. Replace it if the brand has an official favicon.
- `public/media/og.jpg` (1200 × 630): the hero with the header logo, rendered
  from the site. Re-render it after changing the hero or the logo, or replace
  it with an approved design.
