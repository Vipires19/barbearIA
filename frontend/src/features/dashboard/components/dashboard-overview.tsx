"use client";

import { Calendar, CheckCircle2, Clock, Package, ShoppingCart, Smartphone, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/features/appointments/components/appointment-card";
import { useAppointmentsList } from "@/features/appointments/hooks/use-appointments";
import { toISODate } from "@/features/appointments/utils/format";
import { formatCurrency } from "@/features/financial/utils/format";
import { LowStockWidget } from "@/features/inventory/components/low-stock-widget";
import { useInventoryDashboard } from "@/features/inventory/hooks/use-inventory";
import { useCurrentUser } from "@/hooks/use-current-user";

export function DashboardOverview() {
  const { data: user, isLoading } = useCurrentUser();
  const today = toISODate(new Date());
  const appointmentsToday = useAppointmentsList({
    page: 1,
    page_size: 5,
    date_from: today,
    date_to: today,
  });
  const upcoming = useAppointmentsList({
    page: 1,
    page_size: 5,
    status: "scheduled",
  });
  const inventoryDashboard = useInventoryDashboard();
  const showInventory = user?.role === "admin" || user?.role === "barber";

  return (
    <div className="space-y-8">
      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {user?.name?.split(" ")[0] ?? "usuário"}
          </h1>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe a agenda do dia e os próximos atendimentos.
        </p>
      </div>

      {!isLoading && (user?.role === "admin" || user?.role === "barber") ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Smartphone className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Consulta pública</CardTitle>
                <CardDescription>
                  Mesma experiência em <span className="font-medium">/my-appointments</span> — só
                  telefone, sem conta.
                </CardDescription>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
                <Link href="/my-appointments" target="_blank" rel="noopener noreferrer">
                  Abrir preview
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const url = `${window.location.origin}/my-appointments`;
                  void navigator.clipboard.writeText(url);
                  toast.success("Link copiado");
                }}
              >
                Copiar link
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Agenda de hoje"
          value={appointmentsToday.data?.total ?? 0}
          description="Atendimentos para hoje"
          icon={Calendar}
        />
        <MetricCard
          title="A confirmar"
          value={
            appointmentsToday.data?.items.filter((item) => item.status === "scheduled").length ?? 0
          }
          description="Solicitações aguardando confirmação"
          icon={Clock}
        />
        <MetricCard
          title="Confirmados"
          value={
            appointmentsToday.data?.items.filter((item) => item.status === "confirmed").length ?? 0
          }
          description="Horários confirmados hoje"
          icon={CheckCircle2}
        />
      </div>

      {showInventory ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              title="Produtos"
              value={inventoryDashboard.data?.products_count ?? 0}
              description="Produtos cadastrados"
              icon={Package}
              loading={inventoryDashboard.isLoading}
            />
            <MetricCard
              title="Estoque baixo"
              value={inventoryDashboard.data?.low_stock_count ?? 0}
              description="Abaixo do mínimo"
              icon={Package}
              loading={inventoryDashboard.isLoading}
              highlight={!!inventoryDashboard.data?.low_stock_count}
            />
            <MetricCard
              title="Vendas"
              value={inventoryDashboard.data?.period_sales_count ?? 0}
              description="Vendas no período"
              icon={ShoppingCart}
              loading={inventoryDashboard.isLoading}
            />
            <CurrencyMetricCard
              title="Receita vendas"
              value={inventoryDashboard.data?.product_sales_revenue ?? 0}
              description="Produtos no período"
              icon={TrendingUp}
              loading={inventoryDashboard.isLoading}
            />
            <CurrencyMetricCard
              title="Receita serviços"
              value={inventoryDashboard.data?.service_revenue ?? 0}
              description="Serviços no período"
              icon={TrendingUp}
              loading={inventoryDashboard.isLoading}
            />
            <CurrencyMetricCard
              title="Receita total"
              value={inventoryDashboard.data?.total_revenue ?? 0}
              description="Vendas + serviços"
              icon={TrendingUp}
              loading={inventoryDashboard.isLoading}
            />
          </div>
          <LowStockWidget />
        </>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Agenda do dia</CardTitle>
              <CardDescription>Próximos horários de hoje</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/calendar">Configurar horários</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentsToday.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : appointmentsToday.data?.items.length ? (
              appointmentsToday.data.items
                .slice()
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum atendimento marcado para hoje.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Próximos agendamentos</CardTitle>
            <CardDescription>Solicitações abertas mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : upcoming.data?.items.length ? (
              upcoming.data.items.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border p-3 text-sm"
                >
                  <p className="font-medium">{appointment.client_name}</p>
                  <p className="text-muted-foreground">
                    {appointment.items.map((i) => i.service_name).join(" + ") || "—"} ·{" "}
                    {appointment.appointment_date} às{" "}
                    {appointment.start_time}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum próximo agendamento pendente.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  highlight,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={`text-2xl font-bold tabular-nums ${highlight ? "text-amber-400" : ""}`}>{value}</p>
        )}
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function CurrencyMetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold tabular-nums text-emerald-400">{formatCurrency(value)}</p>
        )}
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
