"use client";

import { Edit, Package, PackagePlus, Settings2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFormModal } from "@/features/inventory/components/product-form-modal";
import { StockAdjustmentModal } from "@/features/inventory/components/stock-adjustment-modal";
import { useCategories, useProducts } from "@/features/inventory/hooks/use-inventory";
import type { Product } from "@/features/inventory/types/inventory.types";
import { formatCurrency } from "@/features/inventory/utils/format";
import { useCurrentUser } from "@/hooks/use-current-user";

export function ProductsTable() {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const { data: categories } = useCategories(true);
  const { data, isLoading } = useProducts(1, undefined, categoryFilter || undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Produtos</CardTitle>
            <CardDescription>Controle de produtos vendidos na operação.</CardDescription>
          </div>
          {isAdmin ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PackagePlus className="mr-2 h-4 w-4" />
              Novo produto
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="category-filter" className="text-sm text-muted-foreground">
              Categoria:
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Todas</option>
              {categories?.items.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data?.items.length ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto"
              description={isAdmin ? "Cadastre produtos para controlar estoque e vendas." : "Nenhum produto disponível."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Produto</th>
                    <th className="pb-2 pr-4 font-medium">Categoria</th>
                    <th className="pb-2 pr-4 font-medium">Estoque</th>
                    <th className="pb-2 pr-4 font-medium">Mínimo</th>
                    <th className="pb-2 pr-4 font-medium">Preço venda</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    {isAdmin ? <th className="pb-2 font-medium">Ações</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((product) => (
                    <tr key={product.id} className="border-b border-border/50">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{product.name}</p>
                        {product.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        {product.category ? (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: product.category.color }}
                              aria-hidden
                            />
                            {product.category.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        <span className={product.is_low_stock ? "text-amber-400" : ""}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{product.minimum_stock}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatCurrency(product.sale_price)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {product.is_active ? (
                            <Badge variant="secondary">Ativo</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                          {product.is_low_stock ? (
                            <Badge variant="destructive" className="bg-amber-500/20 text-amber-400">
                              Baixo
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      {isAdmin ? (
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar produto"
                              onClick={() => setEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ajustar estoque"
                              onClick={() => setStockProduct(product)}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <ProductFormModal open={createOpen} onOpenChange={setCreateOpen} />
          <ProductFormModal
            open={!!editProduct}
            onOpenChange={(open) => !open && setEditProduct(null)}
            product={editProduct ?? undefined}
          />
          <StockAdjustmentModal
            open={!!stockProduct}
            onOpenChange={(open) => !open && setStockProduct(null)}
            product={stockProduct ?? undefined}
          />
        </>
      ) : null}
    </>
  );
}
