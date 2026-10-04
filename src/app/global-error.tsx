"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html><body>
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <button onClick={reset} className="mt-4 rounded bg-zinc-900 px-4 py-2 text-white">Try again</button>
      </div>
    </body></html>
  );
}
