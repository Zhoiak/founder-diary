"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth page - current session:", session ? "exists" : "null");
      
      if (session) {
        console.log("User already authenticated, should redirect to dashboard");
        window.location.href = "/";
      }
    };
    
    checkAuth();
  }, [supabase]);

  const signInWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}` } });
      if (error) throw error;
      toast("Magic link sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  const signInOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}` } });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "OAuth sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Founder Diary</CardTitle>
          <CardDescription>Use magic link or OAuth</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={signInWithMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
            </Button>
          </form>
          <div className="my-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => signInOAuth("google")}
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100"
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => signInOAuth("github")}
              disabled={loading}
              className="bg-gray-50 hover:bg-gray-100"
            >
              Continue with GitHub
            </Button>
          </div>
          
          {loading && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded">
              <strong>Rate limit hit!</strong> Too many magic link requests. Try OAuth above or wait 5-10 minutes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
