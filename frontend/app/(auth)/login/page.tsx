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
import { Leaf, Sprout, ShieldCheck, Image as ImageIcon, Sparkles } from "lucide-react";

const BG_THEMES = [
  { id: "doodle", name: "Green Produce Doodle", url: "/images/bg/green_doodle.png", opacity: "opacity-45" },
  { id: "sketch", name: "Farm Vegetables Sketch", url: "/images/bg/veg_sketch.png", opacity: "opacity-35" },
  { id: "wave", name: "Organic Produce Wave", url: "/images/bg/green_wave.png", opacity: "opacity-60" },
  { id: "banner", name: "Fresh Harvest Banner", url: "/images/bg/fresh_banner.png", opacity: "opacity-50" },
  { id: "grid", name: "Geometric Produce Grid", url: "/images/bg/green_grid.png", opacity: "opacity-40" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBgIndex, setSelectedBgIndex] = useState(0);
  
  const router = useRouter();
  const login = useAuth((state) => state.login);

  const activeBg = BG_THEMES[selectedBgIndex];

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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-900 px-4 py-8 overflow-hidden font-sans">
      {/* Dynamic Background Image Wallpaper */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out ${activeBg.opacity}`}
        style={{ backgroundImage: `url(${activeBg.url})` }}
      />

      {/* Subtle Gradient Backdrop Tint to ensure card contrast */}
      <div className="absolute inset-0 bg-gradient-to-tr from-green-950/80 via-emerald-900/60 to-teal-950/80 backdrop-blur-2xs" />

      {/* Top Right Background Art Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/20 text-white shadow-xl">
        <span className="text-[11px] font-bold uppercase tracking-wider text-green-300 flex items-center gap-1 pl-2 hidden sm:flex">
          <Sparkles className="w-3.5 h-3.5" /> Farm Artwork:
        </span>
        <div className="flex items-center gap-1">
          {BG_THEMES.map((theme, idx) => (
            <button
              key={theme.id}
              onClick={() => setSelectedBgIndex(idx)}
              title={theme.name}
              className={`relative overflow-hidden w-8 h-8 rounded-xl border-2 transition-all ${
                selectedBgIndex === idx
                  ? "border-green-400 scale-110 shadow-md shadow-green-500/50"
                  : "border-white/30 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={theme.url} alt={theme.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-2xl border-green-200/40 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden relative z-10 transition-all duration-300">
        <div className="h-2.5 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600"></div>
        
        <CardHeader className="space-y-2 text-center pb-4 pt-6">
          <div className="flex justify-center mb-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-green-700/30">
              <Leaf className="w-8 h-8" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 mx-auto">
            <Sprout className="w-3.5 h-3.5 text-green-700" />
            100% Direct From Partner Farmers
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            FreshFlow
          </CardTitle>
          
          <CardDescription className="text-xs text-gray-600 max-w-xs mx-auto">
            B2B Wholesale Produce Procurement for Commercial Kitchens & Restaurants
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} action="javascript:void(0);">
          <CardContent className="space-y-4 px-6 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold text-gray-800 text-xs uppercase tracking-wider">
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
                className="rounded-xl border-gray-200 focus:border-green-600 h-11 text-sm bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required 
                className="rounded-xl border-gray-200 focus:border-green-600 h-11 text-sm bg-white"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
            <Button 
              className="w-full bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white font-extrabold rounded-xl py-3 text-sm shadow-lg shadow-green-700/25 transition-all" 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In to Portal"}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Direct Farm Quality Guarantee & Mandi Pricing
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
