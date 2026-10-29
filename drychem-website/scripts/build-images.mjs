/**
 * Encodes the material studies (assets-src/materials/*.png) into responsive
 * AVIF + WebP variants under public/media/materials, and writes a manifest
 * (src/generated/media.json) with intrinsic sizes and a dominant colour used
 * as the placeholder background — so images never cause layout shift.
 *
 * Usage: node scripts/build-images.mjs
 */
import { mkdir, readdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(root, "assets-src", "materials");
const outDir = path.join(root, "public", "media", "materials");
const manifestPath = path.join(root, "src", "generated", "media.json");

// AVIF carries every size; WebP is only a fallback for older browsers, so it stops at 1280.
const AVIF_WIDTHS = [640, 1280, 2048];
const WEBP_WIDTHS = [640, 1280];
const AVIF = { quality: 36, effort: 4, chromaSubsampling: "4:2:0" };
const WEBP = { quality: 72, effort: 5, smartSubsample: true };

const toHex = ({ r, g, b }) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

async function main() {
  const files = (await readdir(srcDir)).filter((f) => f.endsWith(".png")).sort();
  if (!files.length) throw new Error(`No masters in ${srcDir}. Run: python3 scripts/render_materials.py`);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });

  const manifest = {};
  let total = 0;
  for (const file of files) {
    const name = path.basename(file, ".png");
    const input = sharp(path.join(srcDir, file));
    const meta = await input.metadata();
    const { dominant } = await input.stats();
    const avifWidths = AVIF_WIDTHS.filter((w) => w <= meta.width);
    const webpWidths = WEBP_WIDTHS.filter((w) => w <= meta.width);

    for (const [format, widths, options] of [
      ["avif", avifWidths, AVIF],
      ["webp", webpWidths, WEBP],
    ]) {
      for (const w of widths) {
        const buf = await sharp(path.join(srcDir, file))
          .resize({ width: w, kernel: "lanczos3" })
          [format](options)
          .toBuffer();
        await writeFile(path.join(outDir, `${name}-${w}.${format}`), buf);
        total += buf.length;
        console.log(`  ${name}-${w}.${format}  ${(buf.length / 1024).toFixed(0)} KB`);
      }
    }

    manifest[name] = {
      width: meta.width,
      height: meta.height,
      avif: avifWidths,
      webp: webpWidths,
      color: toHex(dominant),
    };
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n${files.length} materials → ${(total / 1024 / 1024).toFixed(1)} MB in public/media/materials`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
