"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { imageFileSchema } from "@/features/services/schemas/service.schema";
import { cn } from "@/lib/utils";

type UploadFieldProps = {
  value?: string | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
};

export function UploadField({ value, onFileSelect, disabled, className }: UploadFieldProps) {
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
      const parsed = imageFileSchema.safeParse(file);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "Arquivo inválido");
        return;
      }
      setPreview(URL.createObjectURL(file));
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const clear = () => {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative flex aspect-[16/10] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/20",
          disabled && "opacity-50",
        )}
      >
        {displayUrl ? (
          <>
            <Image src={displayUrl} alt="Preview" fill className="object-cover" unoptimized />
            {!disabled ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={clear}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
          >
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm font-medium">Adicionar imagem</span>
            <span className="text-xs">JPEG, PNG ou WebP — máx. 5MB</span>
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
      {displayUrl && !disabled ? (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Trocar imagem
        </Button>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
