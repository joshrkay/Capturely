"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const missingMembership = error.message === "No account membership found";

  if (missingMembership) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
          We&apos;re still setting up your account
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
          Your sign-in worked, but we could not find an account membership yet.
          This can happen right after first login if setup is still finishing.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-300"
          >
            Retry setup
          </button>
          <Link
            href="/sign-in"
            className="rounded-md border border-amber-300 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
      <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">Something went wrong</h2>
      <p className="mt-2 text-sm text-red-700 dark:text-red-300">
        Please try again. If the problem continues, contact support.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
      >
        Retry
      </button>
    </div>
  );
}
