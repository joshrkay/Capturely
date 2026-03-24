import { ReactNode } from "react";

type IntegrationStatus = "connected" | "disconnected" | "error";

const statusStyles: Record<IntegrationStatus, string> = {
  connected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  disconnected: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<IntegrationStatus, string> = {
  connected: "Connected",
  disconnected: "Not Connected",
  error: "Error",
};

interface IntegrationCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  status: IntegrationStatus;
  children: ReactNode;
}

export function IntegrationCard({ icon, title, description, status, children }: IntegrationCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          </div>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
