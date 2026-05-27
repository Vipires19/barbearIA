import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ServiceBookingDetail } from "@/features/appointments/components/service-booking-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicServiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/services" className="text-lg font-semibold tracking-tight">
            Barbearia<span className="text-primary">.</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/booking">Agendar</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <ServiceBookingDetail serviceId={id} />
      </main>
    </div>
  );
}
