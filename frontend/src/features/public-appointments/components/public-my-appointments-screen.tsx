"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppointmentTimeline } from "@/features/public-appointments/components/appointment-timeline";
import { EmptyAppointmentsState } from "@/features/public-appointments/components/empty-appointments-state";
import { LoadingAppointments } from "@/features/public-appointments/components/loading-appointments";
import { PhoneLookupForm } from "@/features/public-appointments/components/phone-lookup-form";
import { usePublicAppointmentsList } from "@/features/public-appointments/hooks/use-public-appointments";
import type { PhoneLookupFormValues } from "@/features/public-appointments/schemas/phone-lookup.schema";

export function PublicMyAppointmentsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lookupPhone, setLookupPhone] = useState("");

  useEffect(() => {
    const p = searchParams.get("phone");
    if (p) setLookupPhone(p.trim());
  }, [searchParams]);

  const listParams = lookupPhone ? { phone: lookupPhone, scope: "all" as const } : null;
  const listQuery = usePublicAppointmentsList(listParams);

  const onLookup = (values: PhoneLookupFormValues) => {
    const trimmed = values.phone.trim();
    setLookupPhone(trimmed);
    const qs = new URLSearchParams();
    qs.set("phone", trimmed);
    router.replace(`/my-appointments?${qs.toString()}`);
  };

  const isEmptyList =
    listQuery.isFetched &&
    !listQuery.isError &&
    !(listQuery.data?.upcoming.length || listQuery.data?.past.length);

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8 sm:max-w-xl sm:px-6 lg:max-w-2xl">
      <header className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Meus agendamentos</h1>
        <p className="text-sm text-muted-foreground">
          Consulte e gerencie seus horários usando apenas o telefone — ideal para lembretes e confirmações futuras
          (WhatsApp, automações).
        </p>
      </header>

      <PhoneLookupForm
        key={lookupPhone || "new"}
        defaultPhone={lookupPhone}
        onSubmit={onLookup}
        isLoading={listQuery.isFetching}
      />

      {lookupPhone ? (
        listQuery.isLoading ? (
          <LoadingAppointments />
        ) : listQuery.isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            Não foi possível carregar seus agendamentos. Verifique o telefone e tente novamente.
          </p>
        ) : isEmptyList ? (
          <EmptyAppointmentsState />
        ) : (
          <AppointmentTimeline
            upcoming={listQuery.data?.upcoming ?? []}
            past={listQuery.data?.past ?? []}
            phone={lookupPhone}
          />
        )
      ) : null}
    </div>
  );
}
