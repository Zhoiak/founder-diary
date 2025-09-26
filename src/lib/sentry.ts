import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === "development",
      beforeSend(event) {
        // Don't send events in development unless explicitly enabled
        if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
      integrations: [
        new Sentry.BrowserTracing({
          // Set sampling rate for performance monitoring
          tracePropagationTargets: ["localhost", /^https:\/\/yourapp\.vercel\.app\/api/],
        }),
      ],
    });
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error("Error captured:", error, context);
  
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  console.log(`[${level.toUpperCase()}] ${message}`);
  
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}
