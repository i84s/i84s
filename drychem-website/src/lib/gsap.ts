"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // House curves. "settle" decelerates like a heavy material coming to rest;
  // "sweep" is the symmetrical curve used for curtains and camera moves.
  CustomEase.create("settle", "0.16, 1, 0.3, 1");
  CustomEase.create("sweep", "0.76, 0, 0.24, 1");
  gsap.defaults({ ease: "settle", duration: 1 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
