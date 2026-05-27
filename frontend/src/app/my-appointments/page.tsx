import { Suspense } from "react";

import { LoadingAppointments } from "@/features/public-appointments/components/loading-appointments";
import { PublicMyAppointmentsScreen } from "@/features/public-appointments/components/public-my-appointments-screen";

export default function MyAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-10 sm:max-w-xl">
          <LoadingAppointments />
        </div>
      }
    >
      <PublicMyAppointmentsScreen />
    </Suspense>
  );
}
