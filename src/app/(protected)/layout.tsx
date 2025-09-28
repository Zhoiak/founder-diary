"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { PostHogProvider } from "@/providers/posthog-provider";
import FloatingDevNotes from "@/components/dev/FloatingDevNotes";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { open, setOpen } = useCommandPalette();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Protected layout - session:", session ? "exists" : "null");
      
      if (!session) {
        console.log("No session found, redirecting to /auth");
        router.push("/auth");
        return;
      }
      
      console.log("Session found, showing protected content");
      setUser(session.user);
      
      // Ensure Personal project exists for this user
      try {
        const response = await fetch("/api/user/ensure-personal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Personal project ensured:", data.message);
        } else {
          console.warn("Failed to ensure Personal project");
        }
      } catch (error) {
        console.error("Error ensuring Personal project:", error);
      }

      // Check if user is admin/dev (has user number)
      try {
        const userRes = await fetch("/api/collaboration/users");
        if (userRes.ok) {
          // If user can access collaboration API, they have a user number (admin/dev)
          setIsAdmin(true);
          // Get user number for display
          const userData = await userRes.json();
          // We'll need to modify the API to return current user info
          setUserNumber(1234); // Placeholder - will be loaded from API
        }
      } catch (error) {
        console.log("User is not admin/dev");
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push("/auth");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PostHogProvider>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
      <FloatingDevNotes isAdmin={isAdmin} userNumber={userNumber || undefined} />
      <Toaster />
    </PostHogProvider>
  );
}
