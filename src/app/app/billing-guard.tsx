"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Checks if the account is suspended or usage-locked,
 * and redirects to /app/billing if so (except on the billing page itself).
 */
export function BillingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't block billing page, accept-invite, or settings
    if (pathname === "/app/billing" || pathname.startsWith("/app/billing")) {
      setChecked(true);
      return;
    }

    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.paymentStatus === "suspended" || data.usage?.usageLocked) {
          router.replace("/app/billing");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // If billing check fails, don't block the user
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked && pathname !== "/app/billing") {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
