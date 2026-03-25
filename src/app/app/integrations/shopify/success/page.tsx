import Link from "next/link";

export default function ShopifySuccessPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Shopify Connected
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Your Shopify store has been connected successfully. The Capturely widget
        will be automatically injected into your storefront.
      </p>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Next steps</h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">1.</span>
            Create your first campaign in the campaign builder
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">2.</span>
            Publish the campaign to make it live on your store
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">3.</span>
            Watch submissions flow in from the Submissions page
          </li>
        </ol>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/app/campaigns/new"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Campaign
        </Link>
        <Link
          href="/app"
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
