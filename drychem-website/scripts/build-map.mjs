/**
 * Builds the "global presence" dot map at build time, so the browser ships
 * no geo libraries:
 *   • public/media/world-dots.svg  — land as a dot matrix (static, cacheable)
 *   • src/generated/reach-map.json — India's dots, the Navi Mumbai origin, and
 *     the projected position + arc path for each export market DRYCHEM names.
 *
 * Usage: node scripts/build-map.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { geoEqualEarth, geoContains } from "d3-geo";
import { feature, merge } from "topojson-client";

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const WIDTH = 1600;
const HEIGHT = 780;
const SPACING = 11; // px between dot centres
const RADIUS = 2.1;

// Head office (Mahape, Navi Mumbai) and the export markets named on drychem.com.
const ORIGIN = { name: "Navi Mumbai", coords: [73.0297, 19.033] };
const MARKETS = [
  { name: "Nepal", city: "Kathmandu", coords: [85.324, 27.7172] },
  { name: "United Arab Emirates", city: "Dubai", coords: [55.2708, 25.2048] },
  { name: "Bahrain", city: "Manama", coords: [50.586, 26.2285] },
  { name: "Oman", city: "Muscat", coords: [58.4059, 23.588] },
  { name: "Yemen", city: "Sana'a", coords: [44.2066, 15.3694] },
  { name: "Kenya", city: "Nairobi", coords: [36.8219, -1.2921] },
  { name: "Tanzania", city: "Dar es Salaam", coords: [39.2083, -6.7924] },
  { name: "Mozambique", city: "Maputo", coords: [32.5732, -25.9692] },
  { name: "South Africa", city: "Johannesburg", coords: [28.0473, -26.2041] },
  { name: "Nigeria", city: "Lagos", coords: [3.3792, 6.5244] },
  { name: "Jamaica", city: "Kingston", coords: [-76.792, 17.9712] },
  { name: "Fiji", city: "Suva", coords: [178.4419, -18.1416] },
];

const r1 = (n) => Math.round(n * 10) / 10;

function dotPath(points) {
  const r = RADIUS;
  return points
    .map(([x, y]) => `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`)
    .join("");
}

/** Quadratic arc lifted perpendicular to the chord, proportional to its length. */
function arc([x0, y0], [x1, y1]) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const lift = Math.min(260, len * 0.32);
  // Lift "upwards" on screen regardless of direction.
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const cx = (x0 + x1) / 2 + nx * lift;
  const cy = (y0 + y1) / 2 + ny * lift;
  // Approximate length of the quadratic curve for stroke-dash animation.
  let length = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const qx = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const qy = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    length += Math.hypot(qx - px, qy - py);
    px = qx;
    py = qy;
  }
  return { d: `M${r1(x0)} ${r1(y0)}Q${r1(cx)} ${r1(cy)} ${r1(x1)} ${r1(y1)}`, length: Math.ceil(length) };
}

async function main() {
  const topo = JSON.parse(await readFile(require.resolve("world-atlas/countries-110m.json"), "utf8"));
  const countries = topo.objects.countries;
  const habitable = countries.geometries.filter((g) => g.id !== "010"); // drop Antarctica
  const land = merge(topo, habitable);
  const india = feature(topo, {
    type: "GeometryCollection",
    geometries: countries.geometries.filter((g) => g.id === "356"),
  });

  const projection = geoEqualEarth()
    .rotate([-50, 0])
    .fitExtent(
      [
        [8, 8],
        [WIDTH - 8, HEIGHT - 8],
      ],
      { type: "Feature", geometry: land },
    );

  const landDots = [];
  const indiaDots = [];
  for (let y = SPACING / 2; y < HEIGHT; y += SPACING) {
    for (let x = SPACING / 2; x < WIDTH; x += SPACING) {
      const ll = projection.invert([x, y]);
      if (!ll || Number.isNaN(ll[0])) continue;
      // Reject points that invert outside the projection's outline.
      const back = projection(ll);
      if (!back || Math.hypot(back[0] - x, back[1] - y) > 0.5) continue;
      if (geoContains(india, ll)) indiaDots.push([x, y]);
      else if (geoContains(land, ll)) landDots.push([x, y]);
    }
  }

  const origin = projection(ORIGIN.coords);
  const markets = MARKETS.map((m) => {
    const p = projection(m.coords);
    return { name: m.name, city: m.city, x: r1(p[0]), y: r1(p[1]), ...arc(origin, p) };
  });

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">` +
    `<path fill="#f2f0eb" fill-opacity="0.3" d="${dotPath(landDots)}"/></svg>\n`;

  await mkdir(path.join(root, "public", "media"), { recursive: true });
  await mkdir(path.join(root, "src", "generated"), { recursive: true });
  await writeFile(path.join(root, "public", "media", "world-dots.svg"), svg);
  await writeFile(
    path.join(root, "src", "generated", "reach-map.json"),
    JSON.stringify(
      {
        width: WIDTH,
        height: HEIGHT,
        india: dotPath(indiaDots),
        origin: { name: ORIGIN.name, x: r1(origin[0]), y: r1(origin[1]) },
        markets,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`land dots ${landDots.length}, India dots ${indiaDots.length}, svg ${(svg.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
