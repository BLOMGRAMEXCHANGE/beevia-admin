"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. Try again, and contact engineering if it
        persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
