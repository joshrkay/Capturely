import { IntegrationCard } from "./integration-card";

export function WordpressCard({ status }: { status: "connected" | "disconnected" | "error" }) {
  return (
    <IntegrationCard
      icon="📝"
      title="WordPress"
      description="Install the Capturely plugin and connect your WordPress site key."
      status={status}
    >
      <details className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
        <summary className="cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Installation Instructions
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Install and activate the Capturely plugin from your WordPress admin.</li>
          <li>Copy your Capturely site public key from the Sites page.</li>
          <li>Paste the key into plugin settings and click save.</li>
        </ol>
      </details>
    </IntegrationCard>
  );
}
