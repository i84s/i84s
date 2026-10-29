import type { Metadata } from "next";
import { ContactView } from "@/components/contact/ContactView";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project with DRYCHEM — toll and contract manufacturing, MasterMix premixes, and wall putty, tile adhesives, plasters, structural and coating solutions.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return <ContactView />;
}
