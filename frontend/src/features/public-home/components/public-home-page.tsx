"use client";

import { PublicBrandingShell } from "@/features/public-home/components/public-branding-shell";
import { BookingCta } from "@/features/public-home/components/booking-cta";
import { FeaturedServices } from "@/features/public-home/components/featured-services";
import { HeroSection } from "@/features/public-home/components/hero-section";
import { HowItWorks } from "@/features/public-home/components/how-it-works";
import { ProfessionalsShowcase } from "@/features/public-home/components/professionals-showcase";
import { PublicFooter } from "@/features/public-home/components/public-footer";
import { PublicNavbar } from "@/features/public-home/components/public-navbar";
import { WhatsAppCta } from "@/features/public-home/components/whatsapp-cta";

export function PublicHomePage() {
  return (
    <PublicBrandingShell>
      <PublicNavbar />
      <main>
        <HeroSection />
        <FeaturedServices />
        <ProfessionalsShowcase />
        <HowItWorks />
        <WhatsAppCta />
        <BookingCta />
      </main>
      <PublicFooter />
    </PublicBrandingShell>
  );
}
