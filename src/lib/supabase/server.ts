import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    }
  );
  return supabase;
}

export async function getSession() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getSession();
    
    console.log("Server getSession - error:", error);
    console.log("Server getSession - session exists:", data.session ? "yes" : "no");
    if (data.session) {
      console.log("Server getSession - user id:", data.session.user.id);
      console.log("Server getSession - user email:", data.session.user.email);
    }
    
    return data.session;
  } catch (error) {
    console.error("Error in getSession:", error);
    return null;
  }
}
