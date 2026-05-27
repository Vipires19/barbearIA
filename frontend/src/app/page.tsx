import type { Metadata } from "next";

import { PublicHomePage } from "@/features/public-home/components/public-home-page";
import { publicBranding } from "@/config/public-branding";

export const metadata: Metadata = {
  title: `${publicBranding.companyName} | Agende online`,
  description: publicBranding.tagline,
};

export default function HomePage() {
  return <PublicHomePage />;
}
