import type { CSSProperties } from "react";
import type { MaterialKey } from "@/content/solutions";
import { material } from "@/lib/media";

type Props = {
  name: MaterialKey;
  /** Describes the image; omit (empty alt) when it is decorative. */
  alt?: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
};

/**
 * Responsive AVIF/WebP picture for a material study. Intrinsic dimensions and
 * a dominant-colour background prevent layout shift and flashes while loading.
 */
export function MaterialImage({ name, alt = "", sizes = "100vw", className, priority = false, style }: Props) {
  const img = material(name);
  return (
    <picture className={className} style={{ backgroundColor: img.color, ...style }}>
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={img.fallback}
        width={img.width}
        height={img.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
