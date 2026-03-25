type SiteKey = {
  id: string;
  name: string;
  primaryDomain: string;
  publicKey: string;
  secretKey: string;
  status: string;
};

type ApiKeysTabProps = {
  sites: SiteKey[];
};

export function ApiKeysTab({ sites }: ApiKeysTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">API Keys</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review site keys scoped to this account.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Site</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Domain</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Public key</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Secret key</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {sites.map((site) => (
              <tr key={site.id}>
                <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                  {site.name}
                  <span className="ml-2 text-xs uppercase text-zinc-500">{site.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">{site.primaryDomain}</td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">{site.publicKey}</td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">{site.secretKey}</td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400" colSpan={4}>
                  No sites found for this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
