"use client";

import type { ReactNode } from "react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/features/appointments/components/status-badge";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { getAppointmentServiceLabel } from "@/features/appointments/types/appointment.types";
import { formatAppointmentDate, formatTimeRange } from "@/features/appointments/utils/format";

type AppointmentTableProps = {
  data: Appointment[];
  renderActions?: (appointment: Appointment) => ReactNode;
  onRowClick?: (appointment: Appointment) => void;
};

export function AppointmentTable({ data, renderActions, onRowClick }: AppointmentTableProps) {
  const columns: DataTableColumn<Appointment>[] = [
    {
      key: "client",
      header: "Cliente",
      cell: (a) => (
        <div>
          <p className="font-medium">{a.client_name}</p>
          <p className="text-xs text-muted-foreground">{a.client_phone}</p>
        </div>
      ),
    },
    { key: "service", header: "Serviços", cell: (a) => getAppointmentServiceLabel(a) },
    { key: "professional", header: "Profissional", cell: (a) => a.professional.name },
    {
      key: "date",
      header: "Data",
      cell: (a) => formatAppointmentDate(a.appointment_date),
    },
    {
      key: "time",
      header: "Horário",
      cell: (a) => formatTimeRange(a.start_time, a.end_time),
    },
    { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  ];
  if (renderActions) {
    columns.push({
      key: "actions",
      header: "",
      cell: (a) => renderActions(a),
      className: "w-12 text-right",
    });
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      keyExtractor={(a) => a.id}
      onRowClick={onRowClick}
    />
  );
}
