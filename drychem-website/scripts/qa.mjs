/**
 * Quality checks for the static export (run `npm run build` first).
 *
 *  1. Internal link + asset crawl over out/ (no browser needed).
 *  2. In a real browser (Playwright, if installed): every route at desktop and
 *     mobile sizes — console errors/warnings, horizontal overflow — plus an
 *     axe-core accessibility audit with and without reduced motion.
 *
 * Usage: node scripts/qa.mjs [route …]   (e.g. `node scripts/qa.mjs / /contact/` to check only those)
 * Browser checks need Playwright: `npm i -D playwright && npx playwright install chromium`.
 */
import { spawn } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "out");
const PORT = 4321;
const BASE = `http://localhost:${PORT}`;
const MISSING = "/missing-page/"; // deliberately unknown route: must render the 404 page cleanly
const only = process.argv.slice(2);
let failures = 0;

const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return files.flat();
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

async function crawl() {
  console.log("1. Link and asset crawl");
  const pages = (await walk(out)).filter((f) => f.endsWith(".html"));
  const routes = new Set();
  let checked = 0;
  for (const page of pages) {
    const html = await readFile(page, "utf8");
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g), ...html.matchAll(/srcSet="([^"]+)"/gi)].flatMap((m) =>
      m[1].split(",").map((part) => part.trim().split(" ")[0]),
    );
    for (const ref of refs) {
      if (!ref.startsWith("/") || ref.startsWith("//")) continue;
      const clean = ref.split("#")[0].split("?")[0].replaceAll("&amp;", "&");
      if (!clean) continue;
      checked++;
      const target = path.join(out, clean);
      if (!(await exists(target)) && !(await exists(path.join(target, "index.html"))))
        fail(`${path.relative(out, page)} → ${ref}`);
      if (clean.endsWith("/")) routes.add(clean);
    }
  }
  console.log(`  ${pages.length} pages, ${checked} internal references checked`);
  return [...routes].filter((r) => !r.startsWith("/_next"));
}

async function browserChecks(routes) {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.log("\n2. Browser checks skipped — Playwright is not installed (npm i -D playwright).");
    return;
  }
  let axeSource = null;
  try {
    axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
  } catch {
    console.log("  (axe-core not installed — accessibility audit skipped)");
  }

  console.log("\n2. Browser checks");
  const server = spawn(process.execPath, [path.join(root, "scripts", "serve.mjs"), String(PORT)], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  ];
  try {
    const targets = [...routes, MISSING].filter((r) => !only.length || only.includes(r));
    for (const route of targets) {
      for (const vp of viewports) {
        for (const reducedMotion of ["no-preference", "reduce"]) {
          const ctx = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            isMobile: vp.isMobile,
            hasTouch: vp.hasTouch,
            reducedMotion,
          });
          const page = await ctx.newPage();
          const logs = [];
          page.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.text()));
          page.on("pageerror", (e) => logs.push(e.message));
          await page.goto(BASE + route, { waitUntil: "networkidle" });
          await page.waitForTimeout(reducedMotion === "reduce" ? 1200 : 3500);
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0; y < height; y += 700) {
            await page.evaluate((yy) => window.scrollTo(0, yy), y);
            await page.waitForTimeout(120);
          }
          await page.waitForTimeout(1200);
          const label = `${route} [${vp.name}${reducedMotion === "reduce" ? ", reduced motion" : ""}]`;
          const { sw, cw } = await page.evaluate(() => ({
            sw: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
          }));
          if (sw > cw) fail(`${label}: horizontal overflow (${sw}px > ${cw}px)`);
          // The browser logs the 404 status of the missing page's own document — that one is expected.
          const expected = (l) => route === MISSING && /status of 404/.test(l);
          logs.filter((l) => !expected(l)).forEach((l) => fail(`${label}: console — ${l}`));
          if (axeSource && vp.name === "desktop") {
            await page.addScriptTag({ content: axeSource });
            const violations = await page.evaluate(async () =>
              (await window.axe.run(document, { resultTypes: ["violations"] })).violations.map(
                (v) => `${v.id} (${v.nodes.length})`,
              ),
            );
            violations.forEach((v) => fail(`${label}: axe — ${v}`));
          }
          console.log(`  · ${label}`);
          await ctx.close();
        }
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

const routes = await crawl();
await browserChecks(routes.length ? routes : ["/"]);
console.log(failures ? `\n${failures} problem(s) found.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
