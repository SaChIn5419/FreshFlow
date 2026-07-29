"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/services/auth";
import { useAuth } from "@/app/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf, Sprout, ShieldCheck } from "lucide-react";
import { ProducePattern } from "@/app/components/ui/ProducePattern";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuth((state) => state.login);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) return;

    setLoading(true);
    try {
      await authService.login(cleanEmail, cleanPassword);
      const user = await authService.getMe();

      login(user);

      toast.success("Welcome back to FreshFlow Portal!");

      if (user.role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/order");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      toast.error(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50/60 to-teal-50 px-4 py-8 overflow-hidden font-sans">
      {/* Background Produce Vector Pattern */}
      <ProducePattern className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-green-100/80 bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden relative z-10">
        <div className="h-2 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600"></div>
        <CardHeader className="space-y-2 text-center pb-4 pt-6">
          <div className="flex justify-center mb-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white shadow-md">
              <Leaf className="w-7 h-7" />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 mx-auto">
            <Sprout className="w-3.5 h-3.5 text-green-600" />
            Direct From Partner Farmers
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            FreshFlow
          </CardTitle>
          <CardDescription className="text-xs text-gray-600">
            B2B Wholesale Produce Procurement for Restaurants & Hotels
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} action="javascript:void(0);">
          <CardContent className="space-y-4 px-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@freshflow.local" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required 
                className="rounded-xl border-gray-200 focus:border-green-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required 
                className="rounded-xl border-gray-200 focus:border-green-600"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
            <Button 
              className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold rounded-xl py-2.5 shadow-md shadow-green-700/20" 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In to Portal"}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Direct Farm Quality Guarantee & Mandi Pricing
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
