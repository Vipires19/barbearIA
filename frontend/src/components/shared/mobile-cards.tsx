"use client";

import type { ReactNode } from "react";

type MobileCardsProps<T> = {
  data: T[];
  keyExtractor: (row: T) => string;
  renderCard: (row: T) => ReactNode;
};

export function MobileCards<T>({ data, keyExtractor, renderCard }: MobileCardsProps<T>) {
  return (
    <div className="space-y-3 md:hidden">
      {data.map((row) => (
        <div key={keyExtractor(row)}>{renderCard(row)}</div>
      ))}
    </div>
  );
}
