import type { SVGProps } from "react";

export type IconName = "arrow" | "arrow-up-right" | "arrow-down" | "arrow-up" | "plus" | "phone" | "mail";

const paths: Record<IconName, string> = {
  arrow: "M4 12h15M13 6l6 6-6 6",
  "arrow-up-right": "M7 17 17 7M9 7h8v8",
  "arrow-down": "M12 4v15M6 13l6 6 6-6",
  "arrow-up": "M12 20V5M6 11l6-6 6 6",
  plus: "M12 5v14M5 12h14",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
