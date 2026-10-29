"use client";

import { scrollToTarget } from "@/lib/scroll";
import { Button } from "@/components/ui/Button";

export function BackToTop() {
  return (
    <Button
      variant="ghost"
      icon="arrow-up"
      onClick={() => {
        scrollToTarget(0);
        document.getElementById("main")?.focus({ preventScroll: true });
      }}
    >
      Back to top
    </Button>
  );
}
