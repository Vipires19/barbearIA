import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  variant?: "list" | "grid" | "form";
  className?: string;
};

export function LoadingSkeleton({ variant = "list", className }: LoadingSkeletonProps) {
  if (variant === "grid") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (variant === "form") {
    return (
      <div className={cn("mx-auto max-w-2xl space-y-6", className)}>
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
      ))}
    </div>
  );
}
