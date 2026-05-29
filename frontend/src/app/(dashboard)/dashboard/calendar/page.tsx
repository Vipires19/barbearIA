import { Suspense } from "react";

import { LoadingSkeleton } from "@/features/appointments/components/loading-skeleton";
import { CalendarDashboard } from "@/features/appointments/components/calendar-dashboard";

export default function DashboardCalendarPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CalendarDashboard />
    </Suspense>
  );
}
