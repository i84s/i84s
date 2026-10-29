"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, Ref } from "react";
import { usePageTransition } from "./TransitionProvider";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** Destination name shown on the transition curtain. */
  label?: string;
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * Internal link that plays the page transition (and scrolls for same-page
 * anchors). Routes are prefetched on intent — hover, focus or touch — rather
 * than whenever a link scrolls into view; the curtain covers any remaining fetch.
 */
export function TransitionLink({ href, label, onClick, onPointerEnter, onFocus, onTouchStart, ref, ...rest }: Props) {
  const router = useRouter();
  const { navigate } = usePageTransition();
  const warm = () => router.prefetch(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === "_blank"
    ) {
      return;
    }
    event.preventDefault();
    navigate(href, label);
  };

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={false}
      onClick={handleClick}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        warm();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        warm();
      }}
      onTouchStart={(e) => {
        onTouchStart?.(e);
        warm();
      }}
      {...rest}
    />
  );
}
