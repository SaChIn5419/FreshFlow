"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/app/stores/useSidebarStore";
import {
  LayoutDashboard,
  ShoppingCart,
  Upload,
  Users,
  Package,
  Settings,
  Leaf,
  Truck,
  ClipboardList,
  PackageCheck,
  Receipt,
  Wallet,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sprout,
  X
} from "lucide-react";

interface NavGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    groupName: "Core Operations",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Orders Queue", href: "/orders", icon: ShoppingCart },
      { name: "Upload Order", href: "/orders/upload", icon: Upload, badge: "AI Parser" },
      { name: "Packing Desk", href: "/packing", icon: PackageCheck },
      { name: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
    ],
  },
  {
    groupName: "Catalog & Partners",
    items: [
      { name: "Produce Catalog", href: "/products", icon: Package, badge: "320 Items" },
      { name: "Restaurant Clients", href: "/customers", icon: Users },
      { name: "Farm Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    groupName: "Finance & Admin",
    items: [
      { name: "Receivables (AR)", href: "/finance/receivables", icon: Receipt },
      { name: "Payables (AP)", href: "/finance/payables", icon: Wallet },
      { name: "Profitability", href: "/finance/profit", icon: TrendingUp },
      { name: "Audit Logs", href: "/audit-logs", icon: Activity },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobile } = useSidebarStore();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-green-100 flex flex-col transition-all duration-300 ease-in-out shadow-xs",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-green-100 bg-gradient-to-r from-green-50/80 to-white">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Leaf className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-gray-900 flex items-center gap-1">
                  FreshFlow
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
                <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider flex items-center gap-0.5">
                  <Sprout className="w-3 h-3" /> Direct Farm B2B
                </span>
              </div>
            )}
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={toggleMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-green-800/70 mb-2">
                  {group.groupName}
                </h3>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 group relative",
                      isActive
                        ? "bg-green-700 text-white shadow-md shadow-green-700/20"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5 transition-transform duration-150 group-hover:scale-110",
                        isCollapsed ? "mx-auto" : "mr-3",
                        isActive ? "text-white" : "text-green-700/70 group-hover:text-green-700"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          isActive
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-green-100 text-green-800 border-green-200"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Collapse Toggle */}
        <div className="p-3 border-t border-green-100 bg-gray-50/50 hidden lg:block">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-green-100/60 hover:text-green-900 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Navigation</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
