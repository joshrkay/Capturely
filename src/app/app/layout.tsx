import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/sites", label: "Sites" },
  { href: "/app/settings/team", label: "Team" },
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
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Capturely
          </h1>
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
        <UserButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
