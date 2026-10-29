import { brand } from "@/config/brand";
import styles from "./BrandLogo.module.css";

type Props = {
  /** Background the logo sits on — selects the reversed artwork when provided. */
  surface?: "light" | "dark";
  className?: string;
};

/**
 * Logo slot. Renders the official artwork from `src/config/brand.ts` once it is
 * provided; until then it shows the company name as plain text (a placeholder,
 * deliberately not a designed mark).
 */
export function BrandLogo({ surface = "dark", className }: Props) {
  const asset = (surface === "dark" && brand.logoOnDark) || brand.logo;
  const cls = [styles.logo, className].filter(Boolean).join(" ");

  if (asset) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export, SVG logo
      <img className={cls} src={asset.src} width={asset.width} height={asset.height} alt={brand.name} />
    );
  }

  return (
    <span className={`${cls} ${styles.placeholder}`} data-logo-placeholder="">
      {brand.name}
    </span>
  );
}
