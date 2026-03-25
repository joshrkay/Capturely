import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-md text-center">
        <p className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Page not found</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go Home
          </Link>
          <Link
            href="/app"
            className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
