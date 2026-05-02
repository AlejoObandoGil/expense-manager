'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, List, Tags, PieChart } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home, emoji: '💰' },
  { href: '/transactions', label: 'Transacciones', icon: List, emoji: '📝' },
  { href: '/categories', label: 'Categorías', icon: Tags, emoji: '🏷️' },
  { href: '/reports', label: 'Reportes', icon: PieChart, emoji: '📊' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] h-14 rounded-xl transition-colors',
                'touch-target',
                isActive
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
              )}
            >
              <span className="text-xl mb-0.5">{item.emoji}</span>
              <span className="text-[11px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
