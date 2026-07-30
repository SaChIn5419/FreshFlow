"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { AdminSidebar } from "@/app/components/layout/AdminSidebar";
import { AdminNavbar } from "@/app/components/layout/AdminNavbar";
import { useSidebarStore } from "@/app/stores/useSidebarStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebarStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "ADMIN") {
      router.push("/customer/order");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null; // Don't render until verified
  }

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-900 flex flex-col font-sans">
      <AdminSidebar />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-64"
        )}
      >
        <AdminNavbar />
        <main className="flex-1 pt-20 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
