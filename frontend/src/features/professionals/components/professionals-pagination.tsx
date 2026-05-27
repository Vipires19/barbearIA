"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProfessionalsPaginationProps = {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ProfessionalsPagination({
  page,
  pages,
  total,
  onPageChange,
}: ProfessionalsPaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Página {page} de {pages} · {total} profissional{total !== 1 ? "is" : ""}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
