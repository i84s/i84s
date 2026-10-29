import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { solutions, solutionBySlug, solutionHref } from "@/content/solutions";
import { SolutionView } from "@/components/sections/solution/SolutionView";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const solution = solutionBySlug(slug);
  if (!solution) return {};
  return {
    title: solution.name,
    description: solution.summary,
    alternates: { canonical: solutionHref(solution.slug) },
    openGraph: { title: `${solution.name} — DRYCHEM`, description: solution.summary, url: solutionHref(solution.slug) },
  };
}

export default async function SolutionPage({ params }: Params) {
  const { slug } = await params;
  const solution = solutionBySlug(slug);
  if (!solution) notFound();

  const index = solutions.indexOf(solution);
  const next = solutions[(index + 1) % solutions.length] ?? solutions[0]!;

  return <SolutionView solution={solution} next={next} />;
}
