import {
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Package,
  Scissors,
  Settings,
  UserCircle,
  Wrench,
} from "lucide-react";

import type { SidebarItem } from "@/types/navigation";
import type { UserRole } from "@/types/user";

export function getDashboardNavItems(role?: UserRole): SidebarItem[] {
  const settingsChildren: SidebarItem[] = [
    {
      id: "dashboard-settings-profile",
      href: "/dashboard/settings/profile",
      label: "Perfil",
      icon: <UserCircle className="h-4 w-4" aria-hidden />,
    },
  ];

  if (role === "admin") {
    settingsChildren.push({
      id: "dashboard-settings-system",
      href: "/dashboard/settings",
      label: "Sistema",
      icon: <Wrench className="h-4 w-4" aria-hidden />,
    });
  }

  const items: SidebarItem[] = [
    {
      id: "dashboard-home",
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-appointments",
      href: "/dashboard/appointments",
      label: "Agendamentos",
      icon: <CalendarClock className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-services",
      href: "/dashboard/services",
      label: "Serviços",
      icon: <Scissors className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-professionals",
      href: "/dashboard/professionals",
      label: "Profissionais",
      icon: <UserCircle className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-calendar",
      href: "/dashboard/calendar",
      label: "Agenda",
      icon: <CalendarDays className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-financial",
      href: "/dashboard/financial",
      label: role === "barber" ? "Carteira" : "Financeiro",
      icon: <CircleDollarSign className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-inventory",
      href: "/dashboard/inventory",
      label: "Estoque",
      icon: <Package className="h-4 w-4" aria-hidden />,
    },
    {
      id: "dashboard-settings",
      label: "Configurações",
      icon: <Settings className="h-4 w-4" aria-hidden />,
      children: settingsChildren,
    },
  ];

  if (role === "barber") {
    return items.filter(
      (item) => !["dashboard-services", "dashboard-professionals"].includes(item.id),
    );
  }

  return items;
}
