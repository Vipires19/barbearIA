"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { Professional } from "@/features/professionals/types/professional.types";

type ProfessionalTableProps = {
  data: Professional[];
  renderActions: (p: Professional) => ReactNode;
};

export function ProfessionalTable({ data, renderActions }: ProfessionalTableProps) {
  const columns: DataTableColumn<Professional>[] = [
    {
      key: "name",
      header: "Profissional",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {p.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {p.specialties.slice(0, 2).join(" · ") || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "services",
      header: "Serviços",
      hideOnMobile: true,
      cell: (p) => (
        <span className="text-sm">{p.services.length ? p.services.map((s) => s.name).join(", ") : "—"}</span>
      ),
    },
    {
      key: "visibility",
      header: "Público",
      hideOnMobile: true,
      cell: (p) => (
        <span className="text-sm text-muted-foreground">
          {p.is_publicly_visible ? "Sim" : "Não"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => (
        <Badge variant={p.is_active ? "default" : "destructive"}>
          {p.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (p) => renderActions(p),
    },
  ];

  return <DataTable columns={columns} data={data} keyExtractor={(p) => p.id} />;
}
