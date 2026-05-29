"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPicker } from "@/features/appointments/components/calendar-picker";
import { TimeSlotPicker } from "@/features/appointments/components/time-slot-picker";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/features/appointments/schemas/appointment.schema";
import { useAvailableSlots } from "@/features/appointments/hooks/use-appointments";
import { useCreatePublicAppointment } from "@/features/public-appointments/hooks/use-public-appointments";
import { toISODate } from "@/features/appointments/utils/format";
import { ProfessionalCard } from "@/features/professionals/components/professional-card";
import { useProfessionalsList } from "@/features/professionals/hooks/use-professionals";
import { useServicesList } from "@/features/services/hooks/use-services";
import { formatDuration, formatPrice } from "@/features/services/utils/format";
import { cn } from "@/lib/utils";

const today = toISODate(new Date());

export function AppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createMutation = useCreatePublicAppointment();

  const initialService = searchParams.get("service") ?? searchParams.get("servico") ?? "";
  const initialProfessional =
    searchParams.get("professional") ?? searchParams.get("profissional") ?? "";

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      client_name: "",
      client_phone: "",
      client_email: "",
      service_ids: initialService ? [initialService] : [],
      professional_id: initialProfessional,
      appointment_date: today,
      start_time: "",
      notes: "",
    },
  });

  const serviceIds = form.watch("service_ids");
  const professionalId = form.watch("professional_id");
  const appointmentDate = form.watch("appointment_date");
  const startTime = form.watch("start_time");

  const servicesQuery = useServicesList({ page: 1, page_size: 50 });
  const professionalsQuery = useProfessionalsList({
    page: 1,
    page_size: 50,
  });
  const slotsQuery = useAvailableSlots(professionalId, serviceIds, appointmentDate);

  const selectedServices = useMemo(
    () => (servicesQuery.data?.items ?? []).filter((service) => serviceIds.includes(service.id)),
    [servicesQuery.data?.items, serviceIds],
  );
  const selectedServiceIdsSet = useMemo(() => new Set(serviceIds), [serviceIds]);
  const totalDuration = useMemo(
    () => selectedServices.reduce((acc, service) => acc + service.duration_minutes, 0),
    [selectedServices],
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((acc, service) => acc + Number(service.price), 0),
    [selectedServices],
  );
  const compatibleProfessionals = useMemo(() => {
    if (!serviceIds.length) return [];
    return (professionalsQuery.data?.items ?? []).filter((professional) =>
      serviceIds.every((id) => professional.services.some((service) => service.id === id)),
    );
  }, [professionalsQuery.data?.items, serviceIds]);
  const selectedProfessional = useMemo(
    () => compatibleProfessionals.find((professional) => professional.id === professionalId),
    [compatibleProfessionals, professionalId],
  );

  useEffect(() => {
    if (initialService) form.setValue("service_ids", [initialService]);
    if (initialProfessional) form.setValue("professional_id", initialProfessional);
  }, [form, initialProfessional, initialService]);

  function toggleService(id: string) {
    const current = form.getValues("service_ids");
    const exists = current.includes(id);
    const next = exists ? current.filter((item) => item !== id) : [...current, id];
    form.setValue("service_ids", next, { shouldValidate: true });
    form.setValue("professional_id", "");
    form.setValue("start_time", "");
  }

  function chooseProfessional(id: string) {
    form.setValue("professional_id", id, { shouldValidate: true });
    form.setValue("start_time", "");
  }

  function chooseDate(value: string) {
    form.setValue("appointment_date", value, { shouldValidate: true });
    form.setValue("start_time", "");
  }

  function onSubmit(values: AppointmentFormValues) {
    createMutation.mutate(
      {
        client_name: values.client_name,
        client_phone: values.client_phone,
        client_email: values.client_email || null,
        service_ids: values.service_ids,
        professional_id: values.professional_id,
        appointment_date: values.appointment_date,
        start_time: values.start_time,
        notes: values.notes || null,
      },
      {
        onSuccess: (appointment) => {
          router.push(`/booking/confirmation?appointment=${appointment.id}`);
        },
      },
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <BookingStep
        number="1"
        title="Escolha os serviços"
        complete={selectedServices.length > 0}
        description="Você pode combinar múltiplos serviços no mesmo horário."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servicesQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))
            : servicesQuery.data?.items.map((service) => {
                const selected = selectedServiceIdsSet.has(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition hover:border-primary/50",
                      selected ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "bg-card",
                    )}
                  >
                    <p className="font-semibold">{service.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {service.description ?? "Serviço profissional"}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-bold text-primary">{formatPrice(service.price)}</span>
                      <span className="text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>
                  </button>
                );
              })}
        </div>
        {selectedServices.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium"
              >
                {service.name}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </BookingStep>

      {serviceIds.length ? (
        <BookingStep
          number="2"
          title="Escolha o profissional"
          complete={Boolean(selectedProfessional)}
          description="Mostramos apenas profissionais que atendem todos os serviços selecionados."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {professionalsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-40 animate-pulse rounded-xl bg-muted" />
                ))
              : compatibleProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    selected={professional.id === professionalId}
                    onSelect={() => chooseProfessional(professional.id)}
                  />
                ))}
            {!professionalsQuery.isLoading && compatibleProfessionals.length === 0 ? (
              <p className="sm:col-span-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum profissional atende a combinacao selecionada.
              </p>
            ) : null}
          </div>
        </BookingStep>
      ) : null}

      {serviceIds.length && professionalId ? (
        <BookingStep
          number="3"
          title="Data e horário"
          complete={Boolean(startTime)}
          description="Escolha uma data próxima e um horário disponível."
        >
          <CalendarPicker value={appointmentDate} onChange={chooseDate} />
          <TimeSlotPicker
            slots={slotsQuery.data?.slots ?? []}
            value={startTime}
            isLoading={slotsQuery.isLoading || slotsQuery.isFetching}
            onChange={(value) => form.setValue("start_time", value, { shouldValidate: true })}
          />
        </BookingStep>
      ) : null}

      {serviceIds.length && professionalId && startTime ? (
        <BookingStep number="4" title="Seus dados" complete={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome</Label>
              <Input id="client_name" placeholder="Seu nome" {...form.register("client_name")} />
              <FormError message={form.formState.errors.client_name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_phone">Telefone</Label>
              <Input
                id="client_phone"
                placeholder="(00) 00000-0000"
                {...form.register("client_phone")}
              />
              <FormError message={form.formState.errors.client_phone?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client_email">E-mail opcional</Label>
              <Input id="client_email" placeholder="voce@email.com" {...form.register("client_email")} />
              <FormError message={form.formState.errors.client_email?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Alguma preferência para o atendimento?"
                {...form.register("notes")}
              />
            </div>
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-semibold">Resumo</p>
              <p>{selectedServices.map((service) => service.name).join(" + ")}</p>
              <p>{selectedProfessional?.name}</p>
              <p>
                {selectedServices.length} serviço(s) • {formatDuration(totalDuration)} •{" "}
                {formatPrice(totalPrice)}
              </p>
              <p>
                {appointmentDate} às {startTime}
              </p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="h-12 w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Confirmando..." : "Confirmar agendamento"}
            <Sparkles className="h-4 w-4" />
          </Button>
        </BookingStep>
      ) : null}

      {selectedServices.length ? (
        <Card className="sticky bottom-4 z-20 border-primary/30 bg-background/95 shadow-lg backdrop-blur">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <p className="font-semibold">{selectedServices.length} serviço(s) selecionado(s)</p>
              <p className="text-muted-foreground">
                {formatDuration(totalDuration)} • {formatPrice(totalPrice)}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                const target = document.getElementById("booking-step-2");
                target?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              disabled={!serviceIds.length}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}

function BookingStep({
  number,
  title,
  description,
  complete,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  complete: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={`booking-step-${number}`}
      className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {complete ? <CheckCircle2 className="h-5 w-5" /> : number}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {complete ? <ArrowRight className="mt-1 hidden h-4 w-4 text-muted-foreground sm:block" /> : null}
      </div>
      {children}
    </section>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
