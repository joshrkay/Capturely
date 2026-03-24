import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <Logo size="lg" className="mb-8" />
      {children}
    </div>
  );
}
