import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { NotificationsBell } from "./notifications-bell";
import { BillingGuard } from "./billing-guard";

const navLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/campaigns", label: "Campaigns" },
  { href: "/app/templates", label: "Templates" },
  { href: "/app/sites", label: "Sites" },
  { href: "/app/embed", label: "Embed" },
  { href: "/app/submissions", label: "Submissions" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-6">
          <Logo size="md" />
          <nav className="flex gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <UserButton />
        </div>
      </header>
      <main className="p-6">
          <BillingGuard>{children}</BillingGuard>
        </main>
    </div>
  );
}
