import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { solutions, solutionHref } from "@/content/solutions";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/contact/", ...solutions.map((s) => solutionHref(s.slug))];
  return pages.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
