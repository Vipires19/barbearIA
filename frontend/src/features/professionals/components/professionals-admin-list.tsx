"use client";

import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { ParticipationSummaryBanner } from "@/features/financial/components/participation-summary-banner";
import { LoadingSkeleton } from "@/features/professionals/components/loading-skeleton";
import { ProfessionalMobileCard } from "@/features/professionals/components/professional-mobile-card";
import { ProfessionalTable } from "@/features/professionals/components/professional-table";
import { ProfessionalsPagination } from "@/features/professionals/components/professionals-pagination";
import { useDebouncedValue } from "@/features/services/hooks/use-debounced-value";
import {
  useDeleteProfessional,
  useProfessionalsList,
} from "@/features/professionals/hooks/use-professionals";
import type { Professional } from "@/features/professionals/types/professional.types";

const PAGE_SIZE = 10;

export function ProfessionalsAdminList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null);

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

  const { data, isLoading, isFetching } = useProfessionalsList(params);
  const deleteMutation = useDeleteProfessional();

  const renderActions = (p: Professional) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/professionals/${p.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeleteTarget(p)}
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
        title="Profissionais"
        description="Gerencie a equipe, disponibilidade e serviços de cada profissional"
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/professionals/new">
              <Plus className="h-4 w-4" />
              Novo profissional
            </Link>
          </Button>
        }
      />

      <div className="mb-6">
        <ParticipationSummaryBanner />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por nome ou bio..."
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
          icon={Users}
          title="Nenhum profissional encontrado"
          description="Cadastre profissionais para exibir na área pública e agendamentos."
          action={
            <Button asChild>
              <Link href="/dashboard/professionals/new">Cadastrar profissional</Link>
            </Button>
          }
        />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
          <ProfessionalTable data={data.items} renderActions={renderActions} />
          <MobileCards
            data={data.items}
            keyExtractor={(p) => p.id}
            renderCard={(p) => (
              <ProfessionalMobileCard professional={p} onDelete={() => setDeleteTarget(p)} />
            )}
          />
          <ProfessionalsPagination
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
        title="Excluir profissional"
        description={
          deleteTarget
            ? `Remover "${deleteTarget.name}" permanentemente?`
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
