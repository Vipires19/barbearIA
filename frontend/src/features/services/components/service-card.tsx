"use client";

import { Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Service } from "@/features/services/types/service.types";
import { formatDuration, formatPrice, resolveImageUrl } from "@/features/services/utils/format";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: Service;
  variant?: "public" | "admin";
  onEdit?: () => void;
  className?: string;
};

export function ServiceCard({ service, variant = "public", onEdit, className }: ServiceCardProps) {
  const imageSrc = resolveImageUrl(service.image_url);

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-border/50 bg-card/90 transition-all duration-300",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5",
        className,
      )}
    >
      <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl font-bold text-muted-foreground/25">
              {service.name.charAt(0)}
            </span>
          </div>
        )}
        {variant === "admin" && !service.is_active ? (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">
            Inativo
          </span>
        ) : null}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-lg font-semibold leading-snug tracking-tight">{service.name}</h3>
          {service.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-2 border-t border-border/50 pt-3">
          <div>
            <p className="text-xs text-muted-foreground">A partir de</p>
            <p className="text-xl font-bold text-primary">{formatPrice(service.price)}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {formatDuration(service.duration_minutes)}
          </span>
        </div>

        {variant === "public" ? (
          <Button asChild className="mt-1 w-full gap-2" size="lg">
            <Link href={`/booking?service=${service.id}`}>
              <Sparkles className="h-4 w-4" />
              Agendar
            </Link>
          </Button>
        ) : onEdit ? (
          <Button variant="outline" className="w-full" onClick={onEdit}>
            Editar
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
