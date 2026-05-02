'use client';

import { MobileNav } from './mobile-nav';
import { DesktopSidebar } from './desktop-sidebar';
import { useBreakpoint } from '@/presentation/hooks';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isDesktop } = useBreakpoint();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop Sidebar - solo visible en desktop */}
      <DesktopSidebar />

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64 pb-20 lg:pb-0">
        {/* Header - solo visible en desktop */}
        <header className="hidden lg:block sticky top-0 bg-white/80 backdrop-blur-sm border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 z-30">
          <div className="flex items-center justify-between">
            <h1 className="text-responsive-xl font-semibold text-zinc-900">
              Gestor de Finanzas
            </h1>
            <span className="text-responsive-sm text-zinc-500">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Navigation - solo visible en móvil/tablet */}
      <MobileNav />
    </div>
  );
}
