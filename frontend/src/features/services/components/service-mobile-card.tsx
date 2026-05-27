"use client";

import Link from "next/link";
import { Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Service } from "@/features/services/types/service.types";
import { formatDuration, formatPrice } from "@/features/services/utils/format";

type ServiceMobileCardProps = {
  service: Service;
  onDelete: () => void;
};

export function ServiceMobileCard({ service, onDelete }: ServiceMobileCardProps) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold leading-tight">{service.name}</p>
              <Badge variant={service.is_active ? "default" : "destructive"} className="shrink-0">
                {service.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            {service.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
            ) : null}
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-primary">{formatPrice(service.price)}</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(service.duration_minutes)}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/services/${service.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
