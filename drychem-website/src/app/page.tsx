import type { Metadata } from "next";
import { Hero } from "@/components/sections/home/Hero";
import { Intro } from "@/components/sections/home/Intro";
import { BuildUp } from "@/components/sections/home/BuildUp";
import { SolutionsIndex } from "@/components/sections/home/SolutionsIndex";
import { Research } from "@/components/sections/home/Research";
import { Reach } from "@/components/sections/home/Reach";
import { Partners } from "@/components/sections/home/Partners";
import { Closing } from "@/components/sections/home/Closing";
import styles from "./page.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <div className={styles.stack}>
        <Hero />
        <Intro />
      </div>
      <BuildUp />
      <SolutionsIndex />
      <Research />
      <Reach />
      <Partners />
      <Closing />
    </>
  );
}
