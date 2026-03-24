export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage account details, team members, notifications, keys, and destructive actions.
        </p>
      </div>
      {children}
    </div>
  );
}
