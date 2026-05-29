"use client";

import { Edit, Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryFormModal } from "@/features/inventory/components/category-form-modal";
import {
  useCategories,
  useCategoryAggregations,
  useDeactivateCategory,
} from "@/features/inventory/hooks/use-inventory";
import type { ProductCategory } from "@/features/inventory/types/inventory.types";
import { formatCurrency } from "@/features/inventory/utils/format";

export function CategoriesPanel() {
  const { data, isLoading } = useCategories();
  const { data: aggregations } = useCategoryAggregations();
  const deactivateMutation = useDeactivateCategory();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);

  const handleDeactivate = async (category: ProductCategory) => {
    if (category.products_count > 0) {
      window.alert(
        `A categoria "${category.name}" possui ${category.products_count} produto(s). ` +
          "Desative-a pelo botão editar em vez de excluir.",
      );
      return;
    }
    if (!window.confirm(`Desativar a categoria "${category.name}"?`)) return;
    await deactivateMutation.mutateAsync(category.id);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Categorias</CardTitle>
              <CardDescription>Gerencie as categorias dos produtos.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova categoria
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data?.items.length ? (
              <EmptyState
                icon={Tags}
                title="Nenhuma categoria"
                description="Crie categorias para organizar seus produtos."
              />
            ) : (
              <div className="space-y-2">
                {data.items.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.products_count} produto(s)
                        </p>
                      </div>
                      {!category.is_active ? (
                        <Badge variant="outline">Inativa</Badge>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar categoria"
                        onClick={() => setEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Desativar categoria"
                        disabled={deactivateMutation.isPending}
                        onClick={() => void handleDeactivate(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agregações por categoria</CardTitle>
            <CardDescription>
              Dados preparados para relatórios futuros (período financeiro aberto).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!aggregations?.items.length ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Categoria</th>
                      <th className="pb-2 pr-4 font-medium">Produtos</th>
                      <th className="pb-2 pr-4 font-medium">Vendidos</th>
                      <th className="pb-2 font-medium">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregations.items.map((row) => (
                      <tr key={row.category_id} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: row.color }}
                              aria-hidden
                            />
                            {row.category_name}
                          </span>
                        </td>
                        <td className="py-2 pr-4 tabular-nums">{row.products_count}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.quantity_sold}</td>
                        <td className="py-2 tabular-nums text-emerald-400">
                          {formatCurrency(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <CategoryFormModal
        open={!!editCategory}
        onOpenChange={(open) => !open && setEditCategory(null)}
        category={editCategory ?? undefined}
      />
    </>
  );
}
