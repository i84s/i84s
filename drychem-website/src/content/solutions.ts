/**
 * DRYCHEM solution families and products.
 *
 * Product names, codes and descriptions come from DRYCHEM's own product pages
 * and navigation (via web search). Where an official product page URL was
 * confirmed it is linked; otherwise the product is listed without a link.
 * No specifications or performance values are invented here — technical data
 * belongs to DRYCHEM's official data sheets.
 */

export type MaterialKey =
  "putty" | "plaster" | "concrete" | "adhesive" | "primer" | "powder" | "texture" | "screed" | "samples";

export type Product = {
  name: string;
  /** Grade or variant codes, e.g. "TA 401 (Grey & White)". */
  codes?: string[];
  note?: string;
  href?: string;
};

export type Family = {
  name: string;
  description?: string;
  products: Product[];
};

export type Solution = {
  slug: string;
  index: string;
  name: string;
  /** Short label used in navigation and the build-up sequence. */
  short: string;
  /** Position in the build-up (structure → surface), when the solution is a physical layer. */
  layer?: { order: number; label: string };
  tagline: string;
  summary: string;
  highlights: string[];
  material: MaterialKey;
  families: Family[];
  officialHref?: string;
  sources: string[];
};

export const solutions: Solution[] = [
  {
    slug: "finishing",
    index: "01",
    name: "Finishing Solutions",
    short: "Finishing",
    layer: { order: 4, label: "Finishing" },
    tagline: "The surface everyone sees.",
    summary:
      "Wall putties and textures that create a smooth, durable base for primer and paint — the final layer, where every imperfection shows.",
    highlights: [
      "White, coloured, grey and gypsum wall putties",
      "Premium waterproof putty",
      "Internal, external and super-fine textures",
    ],
    material: "putty",
    families: [
      {
        name: "Wall Putty",
        description:
          "Smooth, durable bases for primer and paint, from white and coloured putties to grey, gypsum and premium waterproof grades.",
        products: [
          { name: "White Putty", codes: ["LCW", "WP 2001", "WP 3002"] },
          { name: "Coloured Putty" },
          { name: "Coarse Wall Putty" },
          {
            name: "Grey Wall Putty",
            note: "Applied before the final paint to extend the life of the paint.",
            href: "https://drychem.com/products/signature-offerings/finishing-solutions/wall-putty/grey-wall-putty",
          },
          { name: "Gypsum Wall Putty" },
          {
            name: "Premium Waterproof Putty",
            note: "A smooth, durable, moisture-resistant base before primer and paint.",
          },
        ],
      },
      {
        name: "Texture",
        description:
          "Decorative finishes for interior and exterior walls, with resistance to algae and fungal growth and no curing required.",
        products: [
          {
            name: "Internal, External and Super Fine Texture",
            href: "https://drychem.com/products/signature-offerings/finishing-solutions/texture/internal-external-and-super-fine-texture",
          },
        ],
      },
    ],
    sources: [
      "https://drychem.com/products/signature-offerings/finishing-solutions/wall-putty/grey-wall-putty",
      "https://drychem.com/products/signature-offerings/finishing-solutions/texture/internal-external-and-super-fine-texture",
      "https://drychem.com/blog/the-economics-of-water-resistant-putty-how-it-reduces-paint-and-maintenance-costs/",
    ],
  },
  {
    slug: "adhesives-grouts",
    index: "02",
    name: "Adhesives & Grouts",
    short: "Adhesion",
    layer: { order: 3, label: "Adhesion" },
    tagline: "The bond beneath every tile.",
    summary:
      "Tile adhesives from Type 1 to Type 4, cementitious and epoxy grouts, block joining mortars and bonding agents.",
    highlights: ["Tile adhesives, Types 1–4", "Cementitious and 2K epoxy grouts", "Block joining mortars and WalBond"],
    material: "adhesive",
    families: [
      {
        name: "Tile Adhesives",
        description: "A graded range organised by adhesive type, in grey and white variants.",
        products: [
          { name: "Type 1", codes: ["TA 101", "TA 201"] },
          {
            name: "Type 2",
            codes: [
              "TA 301",
              "TA 401 (Grey & White)",
              "TA 501 (Grey & White)",
              "TA 4404",
              "TA 5505",
              "TA 6605 (White)",
            ],
          },
          { name: "Type 3", codes: ["TA 6606"] },
          { name: "Type 4", codes: ["TA 6608"] },
        ],
      },
      {
        name: "Grouts",
        products: [
          {
            name: "Unsanded Cementitious Grout",
            note: "Polymer-modified, cement-based grout for joints up to 3 mm.",
            href: "https://drychem.com/products/signature-offerings/adhesives-grouts/grouts/unsanded-cementitious-grout/",
          },
          { name: "2K Epoxy Grout" },
        ],
      },
      {
        name: "Other Adhesives",
        products: [
          {
            name: "Block Joining Mortar",
            codes: ["51510", "LC-51510", "7708"],
            href: "https://drychem.com/products/signature-offerings/adhesives/other-adhesives/block-joining-mortar/51510",
          },
          {
            name: "WalBond",
            note: "Bonding adhesive for gypsum, POP and cement-based plasters.",
            href: "https://drychem.com/products/signature-offerings/adhesives/other-adhesives/walbond",
          },
        ],
      },
    ],
    sources: [
      "https://drychem.com/blog/category/grouts/",
      "https://drychem.com/products/signature-offerings/adhesives-grouts/grouts/unsanded-cementitious-grout/",
      "https://drychem.com/products/signature-offerings/adhesives/other-adhesives/block-joining-mortar/51510",
      "https://drychem.com/products/signature-offerings/adhesives/other-adhesives/walbond",
    ],
  },
  {
    slug: "leveling",
    index: "03",
    name: "Leveling Solutions",
    short: "Leveling",
    layer: { order: 2, label: "Leveling" },
    tagline: "True, even substrates.",
    summary:
      "Ready-mix plasters, mortars and gypsum systems that turn raw masonry into true, even surfaces — hand-applied or machine-sprayed.",
    highlights: [
      "Ready-mix plaster and mortar",
      "Super-fine machine spray plaster",
      "Gypsum and jointing & skimming plasters",
    ],
    material: "plaster",
    families: [
      {
        name: "Plastering Solutions",
        products: [
          { name: "Ready Mix Plaster" },
          { name: "Ready Mix Super Fine Machine Spray Plaster" },
          { name: "Ready Mix Mortar" },
          { name: "Lewel Well Plast" },
        ],
      },
      {
        name: "Gypsum Solutions",
        products: [{ name: "Gypsum Plaster" }, { name: "Jointing & Skimming Plaster" }],
      },
    ],
    sources: ["https://drychem.com/"],
  },
  {
    slug: "structural",
    index: "04",
    name: "Structural Solutions",
    short: "Structure",
    layer: { order: 1, label: "Structure" },
    tagline: "Strength where it matters most.",
    summary:
      "Repair mortars, micro concrete, non-shrink grouts and floor hardeners for crack and damage repair, structural rehabilitation, precision grouting and wear-resistant floors.",
    highlights: ["Repair mortars RM 40–70", "Micro concrete MC 40–70", "Non-shrink grouts and floor hardener"],
    material: "concrete",
    families: [
      {
        name: "Repair & rehabilitation",
        description: "Graded systems for restoring damaged concrete and grouting with precision.",
        products: [
          {
            name: "Repair Mortar",
            note: "For seamless crack and damage repairs.",
            codes: ["RM 40", "RM 50", "RM 60", "RM 70"],
          },
          {
            name: "Micro Concrete",
            note: "For high-strength structural rehabilitation.",
            codes: ["MC 40", "MC 45", "MC 50", "MC 60", "MC 70"],
            href: "https://drychem.com/products/signature-offerings/structural-solutions/micro-concrete/mc-40",
          },
          { name: "Non Shrinkage Grout", note: "For precision grouting.", codes: ["NSG 50", "NSG 65", "NSG 73"] },
        ],
      },
      {
        name: "Flooring",
        products: [{ name: "Floor Hardener", note: "For durable, wear-resistant surfaces." }],
      },
    ],
    officialHref: "https://drychem.com/products/structural-solutions",
    sources: [
      "https://drychem.com/products/structural-solutions",
      "https://drychem.com/blog/common-structural-problems-and-their-solutions",
    ],
  },
  {
    slug: "coatings",
    index: "05",
    name: "Coatings",
    short: "Coating",
    layer: { order: 5, label: "Coating" },
    tagline: "Prepared, sealed, ready for colour.",
    summary:
      "Crack fillers and primers that repair and prepare the surface — from filling cracks and holes to reducing the absorbency of porous exterior walls before the finish coat.",
    highlights: ["Crack filler and gypsum-based crack filler", "Powder primer for exterior cementitious surfaces"],
    material: "primer",
    families: [
      {
        name: "Crack Fillers",
        products: [
          {
            name: "Crack Filler",
            note: "Fills cracks and holes and evens out uneven surfaces, with no water curing.",
          },
          {
            name: "Gypsum Based Crack Filler",
            note: "For filling cracks and holes and levelling uneven interior surfaces.",
            href: "https://drychem.com/products/coatings/coating/gypsum-based-crack-filler",
          },
        ],
      },
      {
        name: "Primers",
        products: [
          {
            name: "Powder Primer",
            note: "An undercoat for exterior cementitious surfaces that makes porous surfaces less absorbent.",
            href: "https://drychem.com/products/coatings/coating/powder-primer",
          },
        ],
      },
    ],
    sources: [
      "https://drychem.com/products/coatings/coating/gypsum-based-crack-filler",
      "https://drychem.com/products/coatings/coating/powder-primer",
    ],
  },
  {
    slug: "mastermix",
    index: "06",
    name: "MasterMix",
    short: "MasterMix",
    tagline: "Your plant. Our chemistry.",
    summary:
      "Concentrated premixes that let manufacturers produce finished building materials in their own plants. One 25 kg bag of MasterMix for Wall Putty is recommended for a one-tonne batch of finished goods.",
    highlights: [
      "One 25 kg bag → one-tonne batch",
      "Ten MasterMix products",
      "Blended with filler and white cement on site",
    ],
    material: "powder",
    families: [
      {
        name: "MasterMix range",
        description:
          "A white powder of polymers, cellulose ethers, retarder and filler, blended in layers with filler and white cement at the client’s plant.",
        products: [
          { name: "Wall Putty", href: "https://drychem.com/products/mastermix/wall-putty" },
          {
            name: "Coloured Wall Putty",
            note: "Shades of pink, yellow, green and off-white.",
            href: "https://drychem.com/products/mastermix/colored-wall-putty",
          },
          { name: "Coarse Wall Putty", href: "https://drychem.com/products/mastermix/coarse-wall-putty" },
          { name: "Premium Wall Putty" },
          { name: "Cement Based Texture" },
          { name: "Block Jointing Mortar" },
          { name: "Ready Mix Plaster", href: "https://drychem.com/products/mastermix/ready-mix-plaster" },
          { name: "Tile Adhesives" },
          { name: "Cement Based Primer" },
          { name: "Crack Filler" },
        ],
      },
    ],
    sources: [
      "https://drychem.com/products/mastermix/wall-putty",
      "https://drychem.com/products/signature-offerings/mastermix/wall-putty",
      "https://drychem.com/products/mastermix/colored-wall-putty",
    ],
  },
  {
    slug: "customized",
    index: "07",
    name: "Customized Solutions",
    short: "Custom",
    tagline: "Your formulation. Our plants.",
    summary:
      "Toll and contract manufacturing tailored to each client — from formulation and manufacturing to packaging and on-time delivery — so brands can launch products under their own name without building plants or R&D teams.",
    highlights: ["Toll and contract manufacturing", "Formulation through on-time delivery", "Your brand, your IP"],
    material: "samples",
    families: [
      {
        name: "What we take on",
        products: [
          { name: "Formula development & R&D" },
          { name: "Raw material sourcing" },
          { name: "Manufacturing", note: "Toll and contract manufacturing models." },
          { name: "Packaging & warehousing" },
          { name: "Distribution & after-sales support" },
        ],
      },
    ],
    officialHref: "https://drychem.com/blog/what-is-toll-manufacturing/",
    sources: [
      "https://drychem.com/",
      "https://drychem.com/blog/what-is-toll-manufacturing/",
      "https://drychem.com/blog/ways-toll-manufacturing-can-save-your-construction-business-from-high-capex",
    ],
  },
];

export const solutionBySlug = (slug: string) => solutions.find((s) => s.slug === slug);

/** Physical layers ordered from structure to surface, for the build-up sequence. */
export const layers = solutions
  .filter((s): s is Solution & { layer: NonNullable<Solution["layer"]> } => Boolean(s.layer))
  .sort((a, b) => a.layer.order - b.layer.order);

export const solutionHref = (slug: string) => `/solutions/${slug}/`;
