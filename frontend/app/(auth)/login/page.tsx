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
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuth((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) return;

    setLoading(true);
    try {
      const { access_token } = await authService.login(cleanEmail, cleanPassword);
      
      // Temporary token placement to get 'me'
      localStorage.setItem("access_token", access_token);
      
      const user = await authService.getMe();
      login(user, access_token);
      
      toast.success("Welcome back");
      
      if (user.role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/order");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 px-4">
      <Card className="w-full max-w-sm shadow-sm border-gray-200">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="bg-green-100 p-2 rounded-full text-green-700">
              <Leaf className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">FreshFlow</CardTitle>
          <CardDescription>
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-green-700 hover:bg-green-800" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
