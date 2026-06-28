"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  Kanban,
  Heart,
  Settings,
  Users,
  BarChart3,
  Bell,
  LogOut,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Proprietăți",
    href: "/properties",
    icon: Home,
    badge: null,
  },
  {
    label: "CRM Leads",
    href: "/leads",
    icon: Kanban,
    badge: null,
  },
  {
    label: "Favorite",
    href: "/favorites",
    icon: Heart,
    badge: null,
  },
];

const adminItems = [
  {
    label: "Echipă",
    href: "/admin/team",
    icon: Users,
    badge: null,
  },
  {
    label: "Statistici",
    href: "/admin/stats",
    icon: BarChart3,
    badge: null,
  },
  {
    label: "Setări",
    href: "/admin/settings",
    icon: Settings,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/25">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground tracking-tight">FORTIS</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Făgăraș CRM</p>
        </div>
      </div>

      {/* Scraper status badge */}
      <div className="mx-4 mt-3 mb-1 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 border border-border">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-muted-foreground font-medium">Import activ</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold">3 surse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-semibold">
                  {item.badge}
                </Badge>
              )}
              {active && <ChevronRight className="w-3 h-3 text-primary/60" />}
            </Link>
          );
        })}

        <Separator className="my-3 opacity-50" />

        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
          Administrare
        </p>

        {adminItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Notifications link */}
      <div className="px-3 pb-2">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all group"
        >
          <div className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-sidebar" />
          </div>
          <span className="flex-1">Notificări</span>
        </Link>
      </div>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">AM</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">Andrei Moldovan</p>
            <p className="text-[10px] text-muted-foreground truncate">Agent · Fortis</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/60">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
