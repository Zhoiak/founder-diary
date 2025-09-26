import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

// Disable static generation for protected routes
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSession();
    console.log("Protected layout - session:", session ? "exists" : "null");
    
    if (!session) {
      console.log("No session found, redirecting to /auth");
      redirect("/auth");
    }
    
    console.log("Session found, showing protected content");
    return <>{children}</>;
  } catch (error) {
    console.error("Error in protected layout:", error);
    redirect("/auth");
  }
}
