"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Professional } from "@/features/professionals/types/professional.types";
import { resolveAvatarUrl } from "@/features/professionals/utils/format";
import { cn } from "@/lib/utils";

type ProfessionalCardProps = {
  professional: Professional;
  variant?: "public" | "admin";
  selected?: boolean;
  onSelect?: () => void;
  serviceId?: string;
  className?: string;
};

export function ProfessionalCard({
  professional,
  variant = "public",
  selected,
  onSelect,
  serviceId,
  className,
}: ProfessionalCardProps) {
  const avatar = resolveAvatarUrl(professional.avatar_url);
  const agendarHref = serviceId
    ? `/booking?service=${serviceId}&professional=${professional.id}`
    : `/booking?professional=${professional.id}`;

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-border/50 transition-all duration-300",
        selected && "border-primary ring-2 ring-primary/30",
        variant === "public" && "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border/50">
            {avatar ? (
              <Image src={avatar} alt={professional.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xl font-bold text-primary/40">
                {professional.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight">{professional.name}</h3>
            {professional.bio ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{professional.bio}</p>
            ) : null}
          </div>
        </div>

        {professional.specialties.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {professional.specialties.slice(0, 4).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        ) : null}

        {professional.services.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Serviços: </span>
            {professional.services.map((s) => s.name).join(", ")}
          </p>
        ) : null}

        {professional.is_publicly_visible ? (
          <p className="text-xs text-primary">Visível na área pública</p>
        ) : null}

        {variant === "public" ? (
          onSelect ? (
            <Button
              type="button"
              className="mt-auto w-full"
              variant={selected ? "default" : "outline"}
              onClick={onSelect}
            >
              {selected ? "Selecionado" : "Selecionar"}
            </Button>
          ) : (
            <Button asChild className="mt-auto w-full gap-2" size="lg">
              <Link href={agendarHref}>
                <Sparkles className="h-4 w-4" />
                Agendar
              </Link>
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
