import type { Metadata } from "next";
import { solutionNav } from "@/config/site";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="nf-page" data-theme="dark" aria-labelledby="nf-title">
      <div className="wrap">
        <p className="eyebrow">Error 404</p>
        <h1 id="nf-title" className="nf-title">
          This surface isn’t finished yet.
        </h1>
        <p className="nf-text">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="nf-actions">
          <Button href="/" label="Home">
            Back to home
          </Button>
          <Button href="/contact/" label="Contact" variant="outline">
            Contact us
          </Button>
        </div>
        <nav aria-label="Solution pages" className="nf-links">
          <ul>
            {solutionNav.map((item) => (
              <li key={item.href}>
                <TransitionLink href={item.href} label={item.label} className="link">
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
