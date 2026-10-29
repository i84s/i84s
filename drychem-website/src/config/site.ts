import { solutions, solutionHref } from "@/content/solutions";

export const site = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://drychem.com").replace(/\/$/, ""),
  title: "DRYCHEM — Engineering Excellence. Built to Last.",
  description:
    "DRYCHEM formulates and manufactures wall putty, tile adhesives, plasters, structural repair systems and coatings — with NABL-accredited labs, 25 manufacturing facilities and customers in 23 countries.",
  inquiryEndpoint: process.env.NEXT_PUBLIC_INQUIRY_ENDPOINT || "",
};

/** Sections of the home page, used by the header's active indicator. */
export const homeSections = [
  { id: "about", label: "About" },
  { id: "solutions", label: "Solutions" },
  { id: "research", label: "Research" },
  { id: "reach", label: "Reach" },
  { id: "partners", label: "Partners" },
] as const;

export const primaryNav = homeSections.map((s) => ({ label: s.label, href: `/#${s.id}`, section: s.id }));

export const solutionNav = solutions.map((s) => ({ label: s.name, href: solutionHref(s.slug) }));
