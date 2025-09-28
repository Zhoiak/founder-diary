"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

let posthogInitialized = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (posthogInitialized) return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,
      person_profiles: "always",
      persistence: "localStorage+cookie",
    });

    // Initial pageview
    posthog.capture("pageview");
    posthogInitialized = true;
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
