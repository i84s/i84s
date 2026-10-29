/**
 * Verified company facts.
 *
 * Every statement below was taken from DRYCHEM's own published pages (as indexed
 * by web search — drychem.com itself was not reachable from the build
 * environment). The `source` URLs let an editor re-check each claim before
 * publication. Do not add figures, certifications or achievements here without
 * a source.
 */

export const company = {
  name: "DRYCHEM",
  legalName: "Drychem India Pvt. Ltd.",
  officialSite: "https://drychem.com/",
  founder: "Ashok Mehta",
  /** Short positioning line, paraphrased from the homepage. */
  positioning: "Toll manufacturer and supplier of building and construction materials.",
} as const;

export type Fact = {
  value: string;
  /** Numeric part for count-up animations (rendered as `value` when absent). */
  count?: number;
  suffix?: string;
  label: string;
  source: string;
};

export const keyFacts: Fact[] = [
  {
    value: "1980s",
    label: "Roots in India’s building and construction industry",
    source: "https://drychem.com/about-us/",
  },
  {
    value: "25",
    count: 25,
    label: "Manufacturing facilities across India",
    source: "https://drychem.com/about-us/",
  },
  {
    value: "23",
    count: 23,
    label: "Countries served worldwide",
    source: "https://drychem.com/about-us/",
  },
  {
    value: "ISO 9001:2015",
    label: "Certified quality management",
    source: "https://drychem.com/about-us/",
  },
];

export const quality = {
  credentials: [
    {
      id: "nabl",
      title: "NABL-accredited laboratories",
      body: "Formulations are developed and product performance is checked in NABL-accredited R&D labs.",
      source: "https://drychem.com/",
    },
    {
      id: "bis",
      title: "BIS-standard facilities",
      body: "Manufacturing runs in BIS-standard facilities across a pan-India plant network.",
      source: "https://drychem.com/",
    },
    {
      id: "iso",
      title: "ISO 9001:2015",
      body: "A certified quality management system built on the plan–do–check–act cycle.",
      source: "https://drychem.com/about-us/",
    },
  ],
  /** Value chain wording from the About page. */
  valueChain: ["Formula development", "Manufacturing", "Distribution", "Commercialisation"],
} as const;

export const reach = {
  facilities: 25,
  countries: 23,
  firstExport: { year: "2010", market: "Nepal" },
  /**
   * Markets named on DRYCHEM's own pages ("…and others"). The site does not name
   * all 23 countries, so the list is presented as a selection.
   */
  namedMarkets: [
    "Nepal",
    "United Arab Emirates",
    "Bahrain",
    "Oman",
    "Yemen",
    "Kenya",
    "Tanzania",
    "Mozambique",
    "South Africa",
    "Nigeria",
    "Jamaica",
    "Fiji",
  ],
  /** Manufacturing units named on the contact page. */
  namedUnits: ["Alwar (Rajasthan)", "Vadodara (Gujarat)", "Katni (Madhya Pradesh)"],
  sources: ["https://drychem.com/about-us/", "https://drychem.com/contact-us"],
} as const;

export const contact = {
  office: {
    label: "Registered & Corporate Office",
    lines: [
      "Drychem India Pvt. Ltd.",
      "Plot No. A-246, TTC Industrial Area",
      "M.I.D.C., Mahape",
      "Navi Mumbai – 400 701",
      "Maharashtra, India",
    ],
  },
  tollFree: { label: "Sales toll-free (India)", display: "022-46134613", href: "tel:+912246134613" },
  salesEmail: { label: "Sales & partnerships", display: "sales.p2p@drychem.com", href: "mailto:sales.p2p@drychem.com" },
  exportsEmail: { label: "Exports", display: "exports@drychem.com", href: "mailto:exports@drychem.com" },
  source: "https://drychem.com/contact-us",
} as const;

/** Official pages used as external destinations. */
export const officialLinks = [
  { label: "drychem.com", href: "https://drychem.com/" },
  { label: "About us", href: "https://drychem.com/about-us/" },
  { label: "Blog", href: "https://drychem.com/blog" },
  { label: "Contact us", href: "https://drychem.com/contact-us" },
] as const;
