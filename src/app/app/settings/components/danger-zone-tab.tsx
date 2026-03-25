export function DangerZoneTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Irreversible account-level operations. Proceed carefully.
        </p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/20">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Delete account</h3>
        <p className="mt-2 text-sm text-red-700/90 dark:text-red-300">
          Permanently removes this account, all campaigns, and all collected submissions.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
