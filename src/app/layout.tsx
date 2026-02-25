import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { ClientLayout } from './client-layout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capturely - Form & Popup Builder for SMBs',
  description: 'Build high-converting popups and forms for your website',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
