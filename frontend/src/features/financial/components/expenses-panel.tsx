"use client";

import { Plus, Receipt } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpenseFormModal } from "@/features/financial/components/expense-form-modal";
import type { Expense } from "@/features/financial/types/financial.types";
import { formatCurrency, formatDate } from "@/features/financial/utils/format";

type ExpensesPanelProps = {
  expenses: Expense[];
};

export function ExpensesPanel({ expenses }: ExpensesPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Despesas</CardTitle>
            <CardDescription>Despesas operacionais do período aberto.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova despesa
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhuma despesa"
              description="Registre despesas para compor o resultado operacional."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Descrição</th>
                    <th className="pb-2 pr-4 font-medium">Categoria</th>
                    <th className="pb-2 pr-4 font-medium">Data</th>
                    <th className="pb-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-border/50">
                      <td className="py-3 pr-4">{expense.description}</td>
                      <td className="py-3 pr-4">{expense.category_label}</td>
                      <td className="py-3 pr-4">{formatDate(expense.expense_date)}</td>
                      <td className="py-3 tabular-nums text-red-400">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ExpenseFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}
