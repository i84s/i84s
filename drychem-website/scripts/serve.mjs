/**
 * Minimal static server for the exported site in out/ (no dependencies).
 * Mirrors typical static-host behaviour: /path/ → /path/index.html, 404.html
 * for misses, and brotli/gzip for text assets (so performance audits are realistic).
 *
 * Usage: node scripts/serve.mjs [port]
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { createBrotliCompress, createGzip } from "node:zlib";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "out");
const port = Number(process.argv[2] || process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

async function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const candidates = [path.join(root, clean)];
  if (clean.endsWith("/") || clean.endsWith(path.sep)) candidates.unshift(path.join(root, clean, "index.html"));
  else candidates.push(path.join(root, clean, "index.html"), path.join(root, `${clean}.html`));
  for (const file of candidates) {
    if (!file.startsWith(root)) continue;
    try {
      const info = await stat(file);
      if (info.isFile()) return file;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const pathname = (req.url || "/").split("?")[0];
  // Redirect /path → /path/ (trailingSlash export), like most static hosts.
  if (!pathname.endsWith("/") && !path.extname(pathname)) {
    const dir = await resolve(`${pathname}/`);
    if (dir) {
      res.writeHead(308, { Location: `${pathname}/` });
      res.end();
      return;
    }
  }
  const file = await resolve(pathname);
  const status = file ? 200 : 404;
  const target = file || path.join(root, "404.html");
  const headers = {
    "Content-Type": types[path.extname(target)] || "application/octet-stream",
    "Cache-Control": target.includes(`${path.sep}_next${path.sep}static${path.sep}`)
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    Vary: "Accept-Encoding",
  };
  const accepts = String(req.headers["accept-encoding"] || "");
  const compressible = /\.(html|js|css|json|txt|xml|svg)$/.test(target);
  const stream = createReadStream(target).on("error", () => res.end());
  if (compressible && /\bbr\b/.test(accepts)) {
    res.writeHead(status, { ...headers, "Content-Encoding": "br" });
    stream.pipe(createBrotliCompress()).pipe(res);
  } else if (compressible && /\bgzip\b/.test(accepts)) {
    res.writeHead(status, { ...headers, "Content-Encoding": "gzip" });
    stream.pipe(createGzip()).pipe(res);
  } else {
    res.writeHead(status, headers);
    stream.pipe(res);
  }
}).listen(port, () => console.log(`Serving out/ at http://localhost:${port}`));
