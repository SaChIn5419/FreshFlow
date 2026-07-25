"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, Leaf, Truck, ClipboardList, PackageCheck, Receipt, Wallet, TrendingUp, Activity } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Receivables (AR)", href: "/finance/receivables", icon: Receipt },
  { name: "Payables (AP)", href: "/finance/payables", icon: Wallet },
  { name: "Profitability", href: "/finance/profit", icon: TrendingUp },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
  { name: "Packing Desk", href: "/packing", icon: PackageCheck },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Audit Logs", href: "/audit-logs", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-56 border-r border-gray-200 bg-white h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Leaf className="w-6 h-6 text-green-700 mr-2" />
        <span className="font-bold text-lg tracking-tight">FreshFlow</span>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                isActive 
                  ? "bg-green-700 text-white" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 flex-shrink-0 h-5 w-5",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
