"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { Service } from "@/features/services/types/service.types";
import { formatDuration, formatPrice } from "@/features/services/utils/format";

type ServiceTableProps = {
  data: Service[];
  renderActions: (service: Service) => ReactNode;
};

export function ServiceTable({ data, renderActions }: ServiceTableProps) {
  const columns: DataTableColumn<Service>[] = [
    {
      key: "name",
      header: "Serviço",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {s.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{s.name}</p>
            <p className="truncate text-xs text-muted-foreground">{s.description ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Preço",
      cell: (s) => <span className="font-medium text-primary">{formatPrice(s.price)}</span>,
    },
    {
      key: "duration",
      header: "Duração",
      hideOnMobile: true,
      cell: (s) => formatDuration(s.duration_minutes),
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => (
        <Badge variant={s.is_active ? "default" : "destructive"}>
          {s.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (s) => renderActions(s),
    },
  ];

  return <DataTable columns={columns} data={data} keyExtractor={(s) => s.id} />;
}
