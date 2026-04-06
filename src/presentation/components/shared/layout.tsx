import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, List, Tags, PieChart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home, emoji: '💰' },
  { href: '/transactions', label: 'Transacciones', icon: List, emoji: '📝' },
  { href: '/categories', label: 'Categorías', icon: Tags, emoji: '🏷️' },
  { href: '/reports', label: 'Reportes', icon: PieChart, emoji: '📊' },
];

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-200">
        <div className="p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <span className="text-xl font-semibold text-zinc-900">
              Finanzas
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg',
                    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                    'transition-colors duration-200'
                  )}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-zinc-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">
              Gestor de Finanzas
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
