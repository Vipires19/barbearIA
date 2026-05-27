"use client";

import { MoreHorizontal, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { MobileCards } from "@/components/shared/mobile-cards";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { LoadingSkeleton } from "@/features/services/components/loading-skeleton";
import { ServiceMobileCard } from "@/features/services/components/service-mobile-card";
import { ServiceTable } from "@/features/services/components/service-table";
import { ServicesPagination } from "@/features/services/components/services-pagination";
import { useDebouncedValue } from "@/features/services/hooks/use-debounced-value";
import { useDeleteService, useServicesList } from "@/features/services/hooks/use-services";
import type { Service } from "@/features/services/types/service.types";

const PAGE_SIZE = 10;

export function ServicesAdminList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    }),
    [page, debouncedSearch, statusFilter],
  );

  const { data, isLoading, isFetching } = useServicesList(params);
  const deleteMutation = useDeleteService();

  const renderActions = (service: Service) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
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
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeleteTarget(service)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <PageHeader
        title="Serviços"
        description="Gerencie os serviços oferecidos pela barbearia"
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/services/new">
              <Plus className="h-4 w-4" />
              Novo serviço
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por nome ou descrição..."
          className="min-w-0 flex-1"
        />
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "inactive"] as const).map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
              }}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : !data?.items.length ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço encontrado"
          description={
            debouncedSearch || statusFilter !== "all"
              ? "Tente outros filtros ou termos de busca."
              : "Cadastre o primeiro serviço da barbearia."
          }
          action={
            <Button asChild>
              <Link href="/dashboard/services/new">Criar serviço</Link>
            </Button>
          }
        />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
          <ServiceTable data={data.items} renderActions={renderActions} />
          <MobileCards
            data={data.items}
            keyExtractor={(s) => s.id}
            renderCard={(s) => (
              <ServiceMobileCard service={s} onDelete={() => setDeleteTarget(s)} />
            )}
          />
          <ServicesPagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir serviço"
        description={
          deleteTarget
            ? `Remover "${deleteTarget.name}" permanentemente? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
      />
    </>
  );
}
