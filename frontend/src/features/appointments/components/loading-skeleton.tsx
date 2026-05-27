import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton({ variant = "list" }: { variant?: "list" | "grid" }) {
  const count = variant === "grid" ? 6 : 5;
  return (
    <div className={variant === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}
