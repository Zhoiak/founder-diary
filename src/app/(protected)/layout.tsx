import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

// Disable static generation for protected routes
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth");
  }
  return <>{children}</>;
}
