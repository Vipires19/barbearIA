import type { ReactNode } from "react";

export type SidebarItem = {
  id: string;
  href?: string;
  label: string;
  icon: ReactNode;
  children?: SidebarItem[];
};
