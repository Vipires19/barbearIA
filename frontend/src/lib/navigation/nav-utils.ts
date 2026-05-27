import type { SidebarItem } from "@/types/navigation";

function flattenItems(items: readonly SidebarItem[]): SidebarItem[] {
  const out: SidebarItem[] = [];
  for (const item of items) {
    if (item.href) out.push(item);
    if (item.children?.length) out.push(...flattenItems(item.children));
  }
  return out;
}

export function getUniqueNavItems(items: readonly SidebarItem[]): SidebarItem[] {
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();
  const unique: SidebarItem[] = [];

  const walk = (list: readonly SidebarItem[]) => {
    for (const item of list) {
      if (seenIds.has(item.id)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Sidebar] id duplicado ignorado:", item.id, item);
        }
        continue;
      }
      seenIds.add(item.id);
      if (item.href) {
        if (seenHrefs.has(item.href)) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[Sidebar] href duplicado ignorado:", item.href, item);
          }
          continue;
        }
        seenHrefs.add(item.href);
      }
      unique.push(item);
      if (item.children?.length) walk(item.children);
    }
  };

  walk(items);
  return unique;
}

export function assertNavItems(items: readonly SidebarItem[], source: string): void {
  if (process.env.NODE_ENV !== "development") return;

  const flat = flattenItems(items);
  const ids = flat.map((i) => i.id);
  const hrefs = flat.map((i) => i.href).filter(Boolean) as string[];
  const dupIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  const dupHrefs = hrefs.filter((href, idx) => hrefs.indexOf(href) !== idx);

  if (dupIds.length > 0) {
    console.error(`[Sidebar] IDs duplicados em ${source}:`, dupIds, items);
  }
  if (dupHrefs.length > 0) {
    console.error(`[Sidebar] hrefs duplicados em ${source}:`, dupHrefs, items);
  }
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavGroupActive(pathname: string, item: SidebarItem): boolean {
  if (item.href && isNavItemActive(pathname, item.href)) return true;
  return item.children?.some((c) => c.href && isNavItemActive(pathname, c.href)) ?? false;
}
