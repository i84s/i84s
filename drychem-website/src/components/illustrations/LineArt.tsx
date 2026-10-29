import type { ReactNode } from "react";
import styles from "./LineArt.module.css";

/**
 * Fine-line technical drawings (decorative). Every stroke uses pathLength=1 so
 * a single dash animation draws any shape. Illustrative only: they show
 * generic lab and process concepts, never data.
 */

type Drawing = "specimen" | "process" | "cycle";

const drawings: Record<Drawing, { viewBox: string; body: ReactNode }> = {
  // A test specimen under a compression platen, in isometric projection.
  specimen: {
    viewBox: "0 0 240 210",
    body: (
      <>
        <g data-draw>
          <path pathLength={1} d="M120 176 L167 149 L167 95 L120 122 Z" />
          <path pathLength={1} d="M120 176 L73 149 L73 95 L120 122 Z" />
          <path pathLength={1} d="M73 95 L120 68 L167 95 L120 122 Z" />
        </g>
        <g data-draw>
          <path pathLength={1} d="M58 58 L120 22 L182 58 L120 94 Z" className={styles.faint} />
          <path pathLength={1} d="M120 0 L120 34" />
          <path pathLength={1} d="M113 26 L120 36 L127 26" />
        </g>
        <g data-draw className={styles.dim}>
          <path pathLength={1} d="M126 190 L176 161" />
          <path pathLength={1} d="M124 186 L128 194 M174 157 L178 165" />
          <path pathLength={1} d="M58 149 L58 95" />
          <path pathLength={1} d="M54 149 L62 149 M54 95 L62 95" />
        </g>
        <text x="186" y="182" className={styles.label}>
          SPECIMEN
        </text>
        <text x="132" y="14" className={styles.label}>
          LOAD
        </text>
      </>
    ),
  },
  // Dry-mix process: silo → dosing → mixer → packing.
  process: {
    viewBox: "0 0 260 170",
    body: (
      <>
        <g data-draw>
          <path pathLength={1} d="M14 20 H50 V86 L38 104 H26 L14 86 Z" />
          <path pathLength={1} d="M32 104 V120 H74" />
          <path pathLength={1} d="M74 108 H104 V132 H74 Z" />
          <path pathLength={1} d="M104 120 H122" />
          <circle pathLength={1} cx="150" cy="120" r="28" />
          <path pathLength={1} d="M130 100 L170 140 M130 140 L170 100" className={styles.faint} />
          <path pathLength={1} d="M178 120 H198" />
          <path pathLength={1} d="M204 104 Q202 96 210 96 H232 Q240 96 238 104 L242 150 H200 Z" />
        </g>
        <g data-draw className={styles.dim}>
          <path pathLength={1} d="M14 150 H246" />
          <path pathLength={1} d="M32 146 V154 M89 146 V154 M150 146 V154 M221 146 V154" />
        </g>
        <text x="14" y="166" className={styles.label}>
          RAW
        </text>
        <text x="74" y="166" className={styles.label}>
          DOSE
        </text>
        <text x="136" y="166" className={styles.label}>
          MIX
        </text>
        <text x="206" y="166" className={styles.label}>
          PACK
        </text>
      </>
    ),
  },
  // Plan–do–check–act: the cycle ISO 9001 is built on.
  cycle: {
    viewBox: "0 0 220 210",
    body: (
      <>
        <g data-draw>
          <path pathLength={1} d="M110 25 A80 80 0 0 1 190 105" />
          <path pathLength={1} d="M190 105 A80 80 0 0 1 110 185" />
          <path pathLength={1} d="M110 185 A80 80 0 0 1 30 105" />
          <path pathLength={1} d="M30 105 A80 80 0 0 1 110 25" />
          <path pathLength={1} d="M183 92 L190 105 L197 92" />
          <path pathLength={1} d="M123 178 L110 185 L123 192" />
          <path pathLength={1} d="M23 118 L30 105 L37 118" />
          <path pathLength={1} d="M97 18 L110 25 L97 32" />
        </g>
        <g data-draw className={styles.dim}>
          <circle pathLength={1} cx="110" cy="105" r="46" />
          <path pathLength={1} d="M110 59 V151 M64 105 H156" />
        </g>
        <text x="146" y="58" className={styles.big}>
          P
        </text>
        <text x="146" y="166" className={styles.big}>
          D
        </text>
        <text x="62" y="166" className={styles.big}>
          C
        </text>
        <text x="62" y="58" className={styles.big}>
          A
        </text>
      </>
    ),
  },
};

export function LineArt({ name, className }: { name: Drawing; className?: string }) {
  const d = drawings[name];
  return (
    <svg
      viewBox={d.viewBox}
      className={[styles.art, className].filter(Boolean).join(" ")}
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-line-art
    >
      {d.body}
    </svg>
  );
}
