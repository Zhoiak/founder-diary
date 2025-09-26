import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

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
