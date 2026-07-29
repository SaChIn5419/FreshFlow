"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useSidebarStore } from "@/app/stores/useSidebarStore";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, Sprout, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard & Live KPIs",
  "/orders": "Orders Queue",
  "/orders/upload": "Upload Order",
  "/packing": "Warehouse Packing Desk",
  "/purchase-orders": "Purchase Orders Desk",
  "/products": "Produce Catalog & Stock",
  "/customers": "Restaurant Clients",
  "/suppliers": "Farm Suppliers",
  "/finance/receivables": "Accounts Receivable (AR)",
  "/finance/payables": "Accounts Payable (AP)",
  "/finance/profit": "Profitability & Margins",
  "/audit-logs": "System Audit Logs",
  "/settings": "System Settings",
};

export function AdminNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { isCollapsed, toggleMobile, toggleSidebar } = useSidebarStore();

  const pageTitle = routeNames[pathname] || "Admin Portal";

  return (
    <header
      className={cn(
        "h-16 bg-white/90 backdrop-blur-md border-b border-green-100 flex items-center justify-between px-4 sm:px-6 fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out shadow-2xs",
        isCollapsed ? "left-0 lg:left-20" : "left-0 lg:left-64"
      )}
    >
      {/* Left Section: Mobile Menu Button + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-800 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-green-800 font-semibold flex items-center gap-1">
            <Sprout className="w-4 h-4 text-green-700 hidden sm:inline-block" />
            FreshFlow
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-none">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right Section: User Profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-green-50/80 border border-green-200/60 text-xs text-gray-700">
          <div className="w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-[10px]">
            {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
          </div>
          <span className="font-medium hidden sm:inline-block truncate max-w-[150px]">
            {user?.email || "Admin User"}
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-green-200/60 text-green-800 text-[10px] font-bold hidden md:inline-block">
            DIRECT FARM
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-1.5 text-red-600" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
