export { formatPrice as formatCurrency } from "@/features/services/utils/format";

export function formatPeriodStatus(status: string): string {
  return status === "OPEN" ? "Aberto" : "Fechado";
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
