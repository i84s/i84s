import { solutionNav } from "@/config/site";
import { company, contact, officialLinks } from "@/content/company";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { BackToTop } from "./BackToTop";
import styles from "./SiteFooter.module.css";

const companyNav = [
  { label: "About", href: "/#about" },
  { label: "Research & quality", href: "/#research" },
  { label: "Manufacturing & reach", href: "/#reach" },
  { label: "Partnerships", href: "/#partners" },
  { label: "Contact", href: "/contact/" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} data-theme="dark">
      <div className="wrap">
        <div className={styles.top}>
          <TransitionLink href="/" label="Home" className={styles.logo} aria-label={`${company.name} — home`}>
            <BrandLogo surface="dark" />
          </TransitionLink>
          <p className={styles.tagline}>Engineering excellence. Built to last.</p>
        </div>

        <div className={styles.cols}>
          <nav aria-labelledby="footer-solutions">
            <h2 id="footer-solutions" className={styles.heading}>
              Solutions
            </h2>
            <ul className={styles.list}>
              {solutionNav.map((item) => (
                <li key={item.href}>
                  <TransitionLink href={item.href} label={item.label} className="link">
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className={styles.heading}>
              Company
            </h2>
            <ul className={styles.list}>
              {companyNav.map((item) => (
                <li key={item.href}>
                  <TransitionLink href={item.href} label={item.label} className="link">
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={styles.heading}>Contact</h2>
            <address className={styles.address}>
              <span className={styles.addressLabel}>{contact.office.label}</span>
              {contact.office.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            <ul className={styles.list}>
              <li>
                <a href={contact.tollFree.href} className="link">
                  {contact.tollFree.display}
                </a>
                <span className={styles.note}> — {contact.tollFree.label}</span>
              </li>
              <li>
                <a href={contact.salesEmail.href} className="link">
                  {contact.salesEmail.display}
                </a>
              </li>
              <li>
                <a href={contact.exportsEmail.href} className="link">
                  {contact.exportsEmail.display}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-labelledby="footer-official">
            <h2 id="footer-official" className={styles.heading}>
              Official site
            </h2>
            <ul className={styles.list}>
              {officialLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={`link ${styles.external}`} target="_blank" rel="noopener noreferrer">
                    {item.label}
                    <Icon name="arrow-up-right" className={styles.extIcon} />
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>
            © {year} {company.legalName}
          </p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
