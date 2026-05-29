export { formatCurrency, formatDate, toISODate } from "@/features/financial/utils/format";

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatMovementType(type: string): string {
  const labels: Record<string, string> = {
    IN: "Entrada",
    OUT: "Saída",
    ADJUSTMENT: "Ajuste",
  };
  return labels[type] ?? type;
}
