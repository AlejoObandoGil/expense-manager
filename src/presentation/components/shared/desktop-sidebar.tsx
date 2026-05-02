'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, List, Tags, PieChart } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home, emoji: '💰' },
  { href: '/transactions', label: 'Transacciones', icon: List, emoji: '📝' },
  { href: '/categories', label: 'Categorías', icon: Tags, emoji: '🏷️' },
  { href: '/reports', label: 'Reportes', icon: PieChart, emoji: '📊' },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-200 hidden lg:block">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl">💰</span>
          <span className="text-xl font-semibold text-zinc-900">
            Finanzas
          </span>
        </Link>
      </div>

      <nav className="px-4 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
