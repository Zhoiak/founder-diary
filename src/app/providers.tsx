"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Temporarily disable PostHog to avoid content blocker issues
    // if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    //   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    //     api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    //     person_profiles: "identified_only",
    //   });
    // }
    console.log("PostHog disabled for debugging");
  }, []);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
