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
import { Leaf, Sprout, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

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

      toast.success("Welcome back to FreshFlow!");

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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50/70 via-stone-50 to-green-50/70 px-4 py-8 overflow-hidden font-sans">
      {/* Minimalist Organic Leaf Art Backdrop */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url(/images/bg/minimalist_leaf.png)" }}
      />

      {/* Subtle Glow Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />

      {/* Minimalist Glassmorphism Card */}
      <Card className="w-full max-w-md shadow-xl border-green-100/80 bg-white/85 backdrop-blur-xl rounded-3xl overflow-hidden relative z-10 transition-all duration-300">
        <div className="h-1.5 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600" />

        <CardHeader className="space-y-3 text-center pb-4 pt-8 px-8">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-2xl bg-green-800 text-white flex items-center justify-center shadow-md shadow-green-800/20">
              <Leaf className="w-6 h-6" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-green-100/80 text-green-900 border border-green-200/80 mx-auto">
            <Sprout className="w-3.5 h-3.5 text-green-700" />
            Direct Farm Sourcing B2B
          </div>

          <div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              FreshFlow
            </CardTitle>
            <CardDescription className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
              Wholesale Fresh Produce Procurement Portal
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} action="javascript:void(0);">
          <CardContent className="space-y-4 px-8 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                Email Address
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@freshflow.local" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required 
                className="rounded-xl border-gray-200 focus:border-green-600 h-11 text-sm bg-white/90 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required 
                className="rounded-xl border-gray-200 focus:border-green-600 h-11 text-sm bg-white/90 shadow-2xs"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-4">
            <Button 
              className="w-full bg-green-800 hover:bg-green-900 text-white font-extrabold rounded-xl py-3 text-sm shadow-md shadow-green-800/20 transition-all flex items-center justify-center gap-2" 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Verified Quality & Direct Mandi Rates
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
