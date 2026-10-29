# Official brand assets go here

The official DRYCHEM logo, favicon and brand files could not be retrieved while
this site was built (drychem.com was unreachable from the build environment).

1. Drop the official files in this folder, e.g. `drychem-logo.svg` and
   `drychem-logo-reversed.svg` (for dark backgrounds), plus `favicon.svg`.
2. Point `src/config/brand.ts` at them, with their intrinsic `width`/`height`.
3. Set the official colours in `src/app/globals.css` (`--brand-primary`,
   `--brand-primary-ink`).

`favicon.svg` currently holds a neutral placeholder (the site's level-line
motif), not an official mark. See `docs/BRAND-SLOTS.md` for the full guide.
