"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.24em] text-amber-200/80">
        TABLE FAULT
      </p>
      <h1 className="text-2xl font-semibold text-zinc-50">
        The encoding table hiccuped.
      </h1>
      <p className="max-w-md text-sm text-zinc-400">
        {error.message || "An unexpected error dropped the cards."}
      </p>
      <Button onClick={reset}>Reshuffle</Button>
    </div>
  );
}
