import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/server";

export async function GET() {
  try {
    console.log("=== TEST AUTH ENDPOINT ===");
    const session = await getSession();
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ 
        authenticated: false, 
        error: "No session" 
      }, { status: 401 });
    }
    
    console.log("Session found:", {
      userId: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata?.provider
    });
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        provider: session.user.app_metadata?.provider
      }
    });
    
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error.message 
    }, { status: 500 });
  }
}
