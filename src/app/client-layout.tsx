'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Plug,
  Code,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Logo } from './components/logo';
import { cn } from './components/ui/utils';
import { NotificationBell } from './components/notification-bell';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Install', href: '/embed', icon: Code },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-200">
            <Logo size="md" showText={true} />
          </div>
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          {/* Footer help section */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Need Help?</h3>
              <p className="text-xs text-gray-600 mb-3">
                Check out our documentation and tutorials
              </p>
              <button className="text-xs font-medium text-blue-700 hover:text-blue-800">
                View Docs →
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-end h-14 px-6 bg-white border-b border-gray-200">
          <NotificationBell />
        </div>
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
