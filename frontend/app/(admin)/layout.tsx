"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { AdminSidebar } from "@/app/components/layout/AdminSidebar";
import { AdminNavbar } from "@/app/components/layout/AdminNavbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-56">
        <AdminNavbar />
        <main className="flex-1 p-6 pt-22 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
