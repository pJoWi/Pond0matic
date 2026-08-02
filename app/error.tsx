"use client";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-bold">Something went wrong</h2>
      <p className="max-w-md text-sm text-ink-muted">
        {error.message?.slice(0, 200) || "An unexpected error occurred."}
        {error.digest ? (
          <span className="mt-1 block font-num text-xs">ref: {error.digest}</span>
        ) : null}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-sm font-bold text-accent-deep"
      >
        Try again
      </button>
    </div>
  );
}
