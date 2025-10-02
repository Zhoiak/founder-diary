"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function AuthPgPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            console.log("User already authenticated, redirecting to dashboard");
            router.push("/");
          }
        }
      } catch (error) {
        console.log("Not authenticated, staying on auth page");
      }
    };
    
    checkAuth();
  }, [router]);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password, name }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Sign up failed');
        }
        
        toast.success("Account created successfully!");
        router.push("/");
        
      } else {
        // Sign in
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Sign in failed');
        }
        
        toast.success("Signed in successfully!");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success("Signed out successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Sign out failed");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isSignUp ? "Create Account" : "Sign in to Founder Diary"}
            <span className="text-sm font-normal text-blue-600 ml-2">(PostgreSQL)</span>
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create your account with our new PostgreSQL authentication" 
              : "Sign in with your PostgreSQL account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Email/Password Form */}
          <form onSubmit={signInWithPassword} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your full name" 
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@company.com" 
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
                placeholder="Your password" 
                required 
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </div>

          <div className="my-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          {/* Test Actions */}
          <div className="space-y-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={signOut}
            >
              Sign Out (Test)
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push("/auth")}
            >
              Back to Supabase Auth
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
            <strong>PostgreSQL Auth:</strong> This uses our new authentication system with JWT tokens and HTTP-only cookies.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
