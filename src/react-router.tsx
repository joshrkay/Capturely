'use client';

import NextLink from 'next/link';
import { usePathname, useRouter, useParams as useNextParams } from 'next/navigation';
import React from 'react';

// Re-export Link with `to` prop mapped to `href`
export function Link({ to, children, className, ...props }: { to: string; children: React.ReactNode; className?: string; [key: string]: any }) {
  return <NextLink href={to} className={className} {...props}>{children}</NextLink>;
}

// Re-export useNavigate as a function that returns a navigate function
export function useNavigate() {
  const router = useRouter();
  return (path: string) => router.push(path);
}

// Re-export useParams
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useNextParams() as T;
}

// Re-export useLocation
export function useLocation() {
  const pathname = usePathname();
  return { pathname };
}
