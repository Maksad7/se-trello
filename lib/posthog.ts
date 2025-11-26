"use client";

import posthog from "posthog-js";

let initialized = false;

export function getPosthog() {
  if (typeof window === "undefined") return null;

  if (!initialized) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

    if (!key) {
      console.warn("PostHog key missing, analytics disabled");
      return null;
    }

    posthog.init(key, {
      api_host: host,
    });
    initialized = true;
  }

  return posthog;
}
