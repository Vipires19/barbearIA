"use client";

import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { avatarFileSchema } from "@/features/professionals/schemas/professional.schema";
import { cn } from "@/lib/utils";

type AvatarUploadFieldProps = {
  value?: string | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
};

export function AvatarUploadField({
  value,
  onFileSelect,
  disabled,
  className,
}: AvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview ?? value ?? null;

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null);
      if (!file) {
        setPreview(null);
        onFileSelect(null);
        return;
      }
      const parsed = avatarFileSchema.safeParse(file);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "Arquivo inválido");
        return;
      }
      setPreview(URL.createObjectURL(file));
      onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div className={cn("flex flex-col items-start gap-3 sm:flex-row sm:items-center", className)}>
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30">
        {displayUrl ? (
          <>
            <Image src={displayUrl} alt="Avatar" fill className="object-cover" unoptimized />
            {!disabled ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 rounded-full"
                onClick={() => {
                  handleFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
          >
            <Camera className="h-8 w-8" />
            <span className="text-xs">Foto</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {displayUrl ? "Trocar foto" : "Adicionar foto"}
        </Button>
        <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP — máx. 5MB</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
