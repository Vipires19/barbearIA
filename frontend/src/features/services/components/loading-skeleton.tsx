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
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("mx-auto max-w-2xl space-y-6", className)}>
        <Skeleton className="aspect-[16/10] w-full max-w-md rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-xl md:h-14" />
      ))}
    </div>
  );
}
