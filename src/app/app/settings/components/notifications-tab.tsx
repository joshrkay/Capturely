type NotificationsTabProps = {
  disableMutations: boolean;
};

export function NotificationsTab({ disableMutations }: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure email alerts and product updates.
        </p>
      </div>

      <form className={`space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${disableMutations ? "opacity-60" : ""}`}>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" defaultChecked disabled={disableMutations} />
          Campaign performance summaries
        </label>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" defaultChecked disabled={disableMutations} />
          Team invitations and role updates
        </label>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" disabled={disableMutations} />
          Product release updates
        </label>

        <button
          type="button"
          disabled={disableMutations}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save notification settings
        </button>
      </form>
    </div>
  );
}
