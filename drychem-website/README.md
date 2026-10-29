# DRYCHEM — Engineering Excellence. Built to Last.

A premium, motion-led corporate website for DRYCHEM (Drychem India Pvt. Ltd.), a
manufacturer of wall putty, tile adhesives, plasters, structural repair systems and
coatings, and a toll and contract manufacturer for building-material brands.

> **Before launch, read [`docs/BRAND-SLOTS.md`](docs/BRAND-SLOTS.md).**
> The logo is the **IMC (Industrial Minerals Company (SFZ) L.L.C) artwork supplied
> by the client**, and the accent colour is taken from it. The copy, company facts,
> products and contact details are still **DRYCHEM's**: they were verified through
> DRYCHEM's own pages as indexed by search (drychem.com itself could not be reached
> from the build environment), and each one is logged with its source in
> [`docs/CONTENT-SOURCES.md`](docs/CONTENT-SOURCES.md). Typefaces and photography are
> provisional, in clearly marked slots.

## Quick start

Requires Node.js 20.9+.

```bash
npm install
npm run dev        # development server on http://localhost:3000
npm run build      # static export to out/
npm run preview    # serve out/ on http://localhost:4173 (with gzip/brotli)
```

## What's inside

| Route                | Content                                                                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | Opening sequence → hero (real-time raking-light surface with a laser level line) → About → **The build-up** (pinned, exploded 3D stack of the five layer solutions) → complete portfolio index → Research & quality → Manufacturing & reach (export-route map) → Partnerships → closing statement |
| `/solutions/[slug]/` | Seven solution pages (Finishing, Adhesives & Grouts, Leveling, Structural, Coatings, MasterMix, Customized): product families, grades, official product links, position in the build-up, CTA, next solution                                                                                       |
| `/contact/`          | Inquiry form plus verified contact details; `?topic=<slug>` preselects a solution                                                                                                                                                                                                                 |
| `404`                | Branded not-found page                                                                                                                                                                                                                                                                            |

The creative concept, design system and motion choreography are documented in
[`docs/CREATIVE-DIRECTION.md`](docs/CREATIVE-DIRECTION.md).

## Stack

- **Next.js 16** (App Router, `output: "export"`): pre-rendered static HTML that
  can be hosted on any static host or CDN.
- **React 19**, **TypeScript** (strict).
- **GSAP 3.15** (ScrollTrigger, SplitText, CustomEase) through `@gsap/react`, with
  cleanup on unmount.
- **Lenis** for smooth wheel scrolling (touch and reduced motion use native scroll).
- **CSS Modules** on top of a token-based global stylesheet (no CSS framework).
- **Raw WebGL 1** for the hero surface (about 4 KB of shader, no Three.js).
- Self-hosted variable fonts via `next/font/local` (no third-party font requests).

## Project structure

```
src/
  app/                    routes, layout, global tokens (globals.css), fonts, sitemap/robots
  components/
    brand/                BrandLogo (IMC logo artwork)
    layout/               header (theme-aware, hide-on-scroll), mobile menu, footer
    motion/               preloader, page transitions, smooth scroll, cursor,
                          RevealText (SplitText), Reveal, MediaReveal, Counter
    media/                MaterialImage (AVIF/WebP), MaterialSurface + shader (WebGL hero)
    sections/home/        one component per homepage chapter
    sections/solution/    solution page template
    contact/              contact page and inquiry form
    illustrations/        fine-line technical drawings
  config/                 brand (logo files, name), site constants, navigation
  content/                verified company facts, solutions and products (single source of truth)
  generated/              build-time data: image manifest, export-route map, logo sizes
  lib/                    gsap setup, motion tokens, scroll store, page-reveal signal, idle scheduler
brand-source/             the logo files as supplied by the client
scripts/                  asset pipeline (materials, map, logo tracing), preview server, QA
docs/                     brand slots, content sources, creative direction
```

Content lives in `src/content/` only, so editors can update facts and products without
touching components.

## Inquiry form

The form never shows a success message it can't back up:

- **With an endpoint**: set `NEXT_PUBLIC_INQUIRY_ENDPOINT` (Formspree, Basin, Getform,
  your own API…). The form POSTs JSON and reports success only on a 2xx response.
  Errors offer the sales email as a fallback.
- **Without one (default)**: no backend is connected yet. The button reads _Send via
  email_; it opens the visitor's email app with the inquiry pre-filled and addressed
  to `sales.p2p@drychem.com`, and shows the text to copy if no email app opens.

It has client-side validation with accessible error messages, a honeypot field, and
preselection of the solution a visitor came from. Copy `.env.example` to `.env.local`
to configure it.

## Asset pipeline

The generated assets are committed, so a normal build needs neither Python nor network access.

| Command                                       | What it does                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `python3 scripts/render_materials.py [name…]` | Renders the material studies (seamless 2048² height fields lit by raking light) to `assets-src/materials/*.png`. Needs `numpy` and `Pillow`.                                    |
| `node scripts/build-images.mjs`               | Encodes them to AVIF (640/1280/2048) and WebP (640/1280) in `public/media/materials/` and writes `src/generated/media.json` (sizes and placeholder colours).                    |
| `npm run assets:map`                          | Builds the dot-matrix world map and export arcs (`public/media/world-dots.svg`, `src/generated/reach-map.json`) with d3-geo at build time, so no geo code ships to the browser. |
| `python3 scripts/trace_logo.py`               | Vectorises the supplied logo files in `brand-source/` into colour and reversed SVGs plus the favicon in `public/brand/`. Needs `numpy`, `Pillow` and `potracer`.                |

`npm run assets:materials` runs the first two in sequence. To use real photography,
see `docs/BRAND-SLOTS.md` → Photography.

## Motion, accessibility and resilience

- **Reduced motion**: no smooth scrolling, no pinning (the build-up becomes a list),
  no kinetic text. The hero renders a single still frame and the opening is a short fade.
- **Keyboard and screen readers**: skip link, visible focus rings, semantic landmarks
  and headings. The mobile menu traps focus, closes on Esc and returns focus to its
  toggle. Split text stays readable to assistive technology, and the form announces
  errors and status.
- **No-JS / failed scripts**: all content is server-rendered. The opening overlay and
  any motion-hidden text are released by CSS failsafes if the app never becomes
  interactive.
- **WebGL hero**: renders at reduced resolution, adapts quality to frame time, runs
  at about 30 fps on touch devices, pauses off screen or in background tabs, and
  falls back to still frames on software-only WebGL (blocklisted GPUs, VMs).
- **Below-the-fold animation set-up** runs in idle time (`src/lib/idle.ts`), not
  during hydration.

## Quality checks

```bash
npm run check      # TypeScript, ESLint, Prettier
npm run build && npm run qa
```

`npm run qa` crawls `out/` for broken internal links and assets. If Playwright is
installed (`npm i -D playwright && npx playwright install chromium`), it also loads
every route at desktop and mobile sizes, with and without reduced motion, and fails
on console errors or warnings, horizontal overflow, or axe-core accessibility
violations.

Results at hand-off, on a local static server with compression:

|                                     | Performance | Accessibility | Best practices | SEO | Key metrics                       |
| ----------------------------------- | ----------- | ------------- | -------------- | --- | --------------------------------- |
| Lighthouse desktop                  | 93          | 100           | 100            | 100 | LCP 0.8 s · TBT 70 ms · CLS 0.001 |
| Lighthouse mobile (4× CPU, slow 4G) | 70          | 100           | 100            | 100 | FCP 1.0 s · TBT 410 ms · CLS 0    |

axe-core reports 0 violations on all page types, with and without reduced motion.
The homepage ships about 250 KB of JS and 12 KB of CSS (gzipped), plus 130 KB of fonts.

## Deployment

`npm run build` writes a fully static site to `out/`, ready for any static host
(Netlify, Vercel, Cloudflare Pages, S3/CloudFront, GitHub Pages, nginx).

- Set **`NEXT_PUBLIC_SITE_URL`** to the deployment's URL: canonical links, Open
  Graph, `sitemap.xml` and `robots.txt` use it. It defaults to `https://drychem.com`
  (the production target), so set it on preview deployments.
- Set **`SITE_NOINDEX=1`** on preview deployments to keep them out of search results.
- **Netlify:** `netlify.toml` holds the build settings (build command, `out/` as the
  publish directory, long-lived caching for `/_next/static/*`). Set the two variables
  above in the site's environment variables, not in the file.
- URLs use trailing slashes (`/contact/`), and each route is a folder with an `index.html`.
- Serve `/_next/static/*` with long-lived immutable caching, and enable gzip or brotli.

## Known limitations

- **Logo and content belong to different companies.** The logo is IMC's, as
  supplied; the copy, facts, products, legal name and contact details are
  DRYCHEM's. Replace one or the other before launch.
- **Logo files are traced.** The SVGs were vectorised from the supplied JPEGs, and
  the reversed versions for dark backgrounds were derived for this site. Swap in
  official vector files and confirm the reversed treatment (see `docs/BRAND-SLOTS.md`).
- **Typefaces** are provisional (`docs/BRAND-SLOTS.md` → Typefaces).
- **Motion reference video.** `Horyx Studio.mp4` never reached the build environment,
  so the motion follows premium-studio conventions rather than a scene-by-scene
  analysis of that video. Everything is tunable in one place (`docs/CREATIVE-DIRECTION.md`).
- **Imagery** is procedural material studies, honest placeholders sized and slotted
  for real product, plant and lab photography.
- **Product data** includes only what could be verified. There are no technical
  specifications (those belong to DRYCHEM's TDS), and a few items need confirmation
  (`docs/CONTENT-SOURCES.md` → Items to confirm).
- **Inquiry form** has no backend until `NEXT_PUBLIC_INQUIRY_ENDPOINT` is set.
- **Testing** was done in headless Chromium (desktop, tablet and mobile viewports,
  software WebGL). Check on physical iOS/Android devices and in Safari and Firefox
  before launch.
