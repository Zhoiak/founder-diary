import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    // TODO: Add proper admin check based on your user schema
    // For now, we'll allow any authenticated user
    // if (session.user.role !== "admin") {
    //   return NextResponse.json(
    //     { error: "Forbidden - Admin access required" },
    //     { status: 403 }
    //   );
    // }

    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check service availability
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      return NextResponse.json({
        status: response.ok ? "online" : "offline",
        statusCode: response.status,
        url,
      });
    } catch (error) {
      return NextResponse.json({
        status: "offline",
        error: error instanceof Error ? error.message : "Unknown error",
        url,
      });
    }
  } catch (error) {
    console.error("Error checking service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
