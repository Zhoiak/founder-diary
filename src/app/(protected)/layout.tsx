"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
      <Toaster />
    </>
  );
}
