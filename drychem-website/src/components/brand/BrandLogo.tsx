import { brand, type LogoVariant } from "@/config/brand";
import styles from "./BrandLogo.module.css";

type Props = {
  /** The symbol alone, or a lockup with the company name. */
  variant?: LogoVariant;
  /** Background the logo sits on — "dark" selects the reversed artwork. */
  surface?: "light" | "dark";
  loading?: "eager" | "lazy";
  className?: string;
};

/** The IMC logo, from the artwork configured in `src/config/brand.ts`. Size it with `className`. */
export function BrandLogo({ variant = "mark", surface = "dark", loading, className }: Props) {
  const { src, width, height } = brand.logo(variant, surface);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; vector artwork needs no optimisation
    <img
      className={[styles.logo, className].filter(Boolean).join(" ")}
      src={src}
      width={width}
      height={height}
      alt={brand.alt}
      loading={loading}
      decoding="async"
    />
  );
}
