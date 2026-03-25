type AccountTabProps = {
  account: {
    id: string;
    name: string;
    planKey: string;
    paymentStatus: string;
    createdAt: string;
  };
  disableMutations: boolean;
};

export function AccountTab({ account, disableMutations }: AccountTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Account</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your account profile and billing metadata.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Account ID</p>
          <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{account.id}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Created</p>
          <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{new Date(account.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Plan</p>
          <p className="mt-1 text-sm capitalize text-zinc-900 dark:text-zinc-100">{account.planKey}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Payment status</p>
          <p className="mt-1 text-sm capitalize text-zinc-900 dark:text-zinc-100">{account.paymentStatus}</p>
        </div>
      </div>

      <form className={`space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${disableMutations ? "opacity-60" : ""}`}>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="account-name">
          Account name
        </label>
        <input
          id="account-name"
          name="account-name"
          defaultValue={account.name}
          disabled={disableMutations}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          disabled={disableMutations}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save account settings
        </button>
      </form>
    </div>
  );
}
