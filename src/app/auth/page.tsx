"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AuthPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          </form>
          <div className="my-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => signInOAuth("google")} disabled={loading}>Continue with Google</Button>
            <Button variant="outline" onClick={() => signInOAuth("github")} disabled={loading}>Continue with GitHub</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
