"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function AdminNavbar() {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 fixed top-0 right-0 left-56 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:inline-block">{user?.email || "Admin"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-gray-700">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
