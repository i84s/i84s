import manifest from "@/generated/media.json";
import type { MaterialKey } from "@/content/solutions";

type Entry = { width: number; height: number; avif: number[]; webp: number[]; color: string };

const media = manifest as Record<string, Entry>;

export type ImageSource = {
  avif: string;
  webp: string;
  fallback: string;
  width: number;
  height: number;
  color: string;
};

const srcset = (key: string, ext: string, widths: number[]) =>
  widths.map((w) => `/media/materials/${key}-${w}.${ext} ${w}w`).join(", ");

export function material(key: MaterialKey): ImageSource {
  const entry = media[key];
  if (!entry) throw new Error(`Unknown material "${key}" — run npm run assets:materials`);
  const largestWebp = entry.webp[entry.webp.length - 1];
  return {
    avif: srcset(key, "avif", entry.avif),
    webp: srcset(key, "webp", entry.webp),
    fallback: `/media/materials/${key}-${largestWebp}.webp`,
    width: entry.width,
    height: entry.height,
    color: entry.color,
  };
}

/** Smallest variant — for CSS backgrounds such as the 3D slab faces. */
export function materialThumb(key: MaterialKey, ext: "avif" | "webp" = "webp") {
  const entry = media[key];
  if (!entry) return "";
  const widths = ext === "avif" ? entry.avif : entry.webp;
  return `/media/materials/${key}-${widths[0]}.${ext}`;
}

/** Placeholder colour for a material (shown before the image decodes). */
export const materialColor = (key: MaterialKey) => media[key]?.color ?? "#2b2f2f";
