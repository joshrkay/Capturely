"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isMembershipError = error.message.includes("No account membership found");

  if (isMembershipError) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <h2 className="text-xl font-semibold">We&apos;re setting up your workspace</h2>
        <p className="mt-2 text-sm">
          Your account membership was not available yet. Please retry to finish
          loading your workspace.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Retry
          </button>
          <Link
            href="/app/settings"
            className="rounded-md border border-amber-400 px-4 py-2 text-sm font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
          >
            Go to settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 max-w-xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Retry
      </button>
    </div>
  );
}
