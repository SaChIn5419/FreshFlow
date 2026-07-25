"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Leaf, ShoppingCart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role === "ADMIN") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const pathname = usePathname();

  if (!isAuthenticated || user?.role !== "CUSTOMER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-700" />
          <div>
            <div className="font-bold text-sm tracking-tight">FreshFlow</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-gray-500">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>
      <div className="bg-white border-b border-gray-200">
        <div className="flex max-w-lg mx-auto">
          <Link 
            href="/order" 
            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 flex items-center justify-center gap-2 ${pathname === '/order' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            New Order
          </Link>
          <Link 
            href="/history" 
            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 flex items-center justify-center gap-2 ${pathname === '/history' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Clock className="w-4 h-4" />
            Order History
          </Link>
        </div>
      </div>
      <main className="flex-1 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
