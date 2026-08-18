# 📱 Gestor de Finanzas - Versión Mobile-First

Rediseño completo con enfoque mobile-first, tipografía moderna Plus Jakarta Sans y layout adaptativo que prioriza la experiencia en teléfonos.

---

## 🎯 Cambios Principales

### 1. Tipografía Moderna
- **Fuente**: Plus Jakarta Sans (contemporánea, amigable)
- **Escalado responsive**: `clamp()` para tamaños fluidos entre mobile/desktop
- **Pesos**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### 2. Layout Mobile-First
- **Móvil (< 768px)**: Bottom navigation bar con iconos grandes
- **Tablet (768-1024px)**: Sidebar colapsable o drawer
- **Desktop (> 1024px)**: Sidebar expandido tradicional

### 3. Escala Tipográfica Responsive

```
Mobile → Desktop
----------------
H1:    1.75rem (28px) → 2.5rem (40px)
H2:    1.5rem (24px)  → 2rem (32px)
H3:    1.25rem (20px) → 1.5rem (24px)
Body:  0.875rem (14px) → 1rem (16px)
Small: 0.75rem (12px)  → 0.875rem (14px)
Emojis: 2rem (32px)   → 3rem (48px)
```

---

## 🛠️ Fases de Implementación

### Fase 1: Setup Tipográfico 🔤

- [ ] Instalar Plus Jakarta Sans desde next/font/google
- [ ] Configurar variables CSS de fuente en globals.css
- [ ] Definir escala tipográfica responsive con `clamp()`
- [ ] Crear utilidades Tailwind personalizadas para texto
- [ ] Actualizar layout.tsx con nueva fuente

**Cambios clave:**
```tsx
// layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
```

### Fase 2: Layout Mobile-First 📐

- [ ] Crear componente `MobileNav` (bottom bar para móvil)
- [ ] Crear componente `DesktopSidebar` (sidebar tradicional)
- [ ] Crear hook `useBreakpoint` para detectar viewport
- [ ] Refactorizar `Layout` con renderizado condicional
- [ ] Ajustar padding/margins para touch targets (mínimo 44px)

**Breakpoints:**
```
sm: 640px   - Ajustes pequeños
distinct: 768px   - Switch a tablet
distinct: 1024px  - Switch a desktop
xl: 1280px  - Pantallas grandes
```

### Fase 3: Componentes Responsive 🧩

- [ ] **EmojiButton**: Tamaños `sm` (40px) / `md` (48px) / `lg` (56px)
- [ ] **EmojiCard**: Layout vertical en móvil, horizontal en desktop
- [ ] **DashboardStats**: Grid 2 cols en móvil, 4 cols en desktop
- [ ] **Charts**: Altura ajustable (200px móvil, 300px desktop)
- [ ] **TransactionList**: Cards en móvil, tabla en desktop
- [ ] **Forms**: Full width inputs, labels encima en móvil

### Fase 4: Páginas Adaptativas 📄

- [ ] **Dashboard**: Stack vertical en móvil, grid en desktop
- [ ] **Transactions**: Filtros colapsables en móvil
- [ ] **Categories**: Grid 2 cols móvil, 3 cols tablet, 4 cols desktop
- [ ] **Modal/Dialogs**: Full screen en móvil, centrado en desktop

### Fase 5: Touch & UX Móvil ✋

- [ ] Aumentar touch targets a mínimo 44x44px
- [ ] Implementar pull-to-refresh (opcional)
- [ ] Swipe gestures para acciones rápidas
- [ ] Bottom sheets en lugar de modales en móvil
- [ ] Floating Action Button (FAB) para acciones principales

### Fase 6: Optimización y Polish ✨

- [ ] Testing en diferentes viewports
- [ ] Ajustar espaciado para legibilidad en móviles
- [ ] Optimizar imágenes/emojis para retina displays
- [ ] Verificar contraste de colores en pantallas pequeñas
- [ ] Animaciones reducidas para `prefers-reduced-motion`

---

## 📱 Especificaciones Mobile-First

### Bottom Navigation (Móvil)
```
┌─────────────────────────────────────┐
│  💰   📝   🏷️   📊   ⚙️              │
│ Inicio  Trans  Categ  Rep  Ajustes  │
└─────────────────────────────────────┘
- Altura: 64px + safe-area-inset-bottom
- Iconos: 24px
- Labels: 11px
```

### Touch Targets
- Botones: mínimo 44px x 44px
- Cards: padding 16px
- Inputs: altura 48px en móvil
- Espaciado entre elementos: 12px mínimo

### Typography Scale (CSS Variables)
```css
:root {
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --text-3xl: clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
}
```

---

## 🎨 Paleta de Colores (Mantener)

```css
--background: #fafafa;
--foreground: #18181b;
--accent: #10b981;
--accent-light: #d1fae5;
--income: #10b981;
--expense: #ef4444;
--warning: #f59e0b;
--card: #ffffff;
--muted: #f4f4f5;
--border: #e4e4e7;
```

---

## 📁 Archivos a Modificar/Crear

### Nuevos Archivos
```
src/presentation/components/shared/
├── mobile-nav.tsx          # Bottom navigation para móvil
desktop-sidebar.tsx      # Sidebar para desktop
touch-button.tsx         # Botones optimizados para touch
responsive-container.tsx # Container con breakpoints

src/presentation/hooks/
└── use-breakpoint.ts       # Hook para detectar viewport

src/presentation/styles/
└── typography.css          # Escala tipográfica responsive
```

### Archivos a Modificar
```
src/app/layout.tsx          # Nueva fuente + estructura
src/presentation/components/shared/layout.tsx  # Layout adaptativo
src/presentation/components/shared/emoji-card.tsx
src/presentation/components/shared/emoji-button.tsx
src/presentation/components/dashboard/dashboard-stats.tsx
src/presentation/components/dashboard/monthly-chart.tsx
src/presentation/components/dashboard/category-chart.tsx
src/presentation/components/dashboard/recent-transactions.tsx
src/app/page.tsx
src/app/transactions/page.tsx
src/app/categories/page.tsx
src/app/globals.css         # Variables tipográficas
```

---

## ⏱️ Timeline Estimado

| Fase | Tiempo Estimado |
|------|----------------|
| 1. Setup Tipográfico | 1-2 horas |
| 2. Layout Mobile-First | 3-4 horas |
| 3. Componentes Responsive | 4-5 horas |
| 4. Páginas Adaptativas | 3-4 horas |
| 5. Touch & UX Móvil | 2-3 horas |
| 6. Optimización | 2-3 horas |
| **Total** | **15-21 horas** |

---

## 🔄 Estrategia de Branching

```
develop
├── feature/typography      # Fase 1
├── feature/mobile-layout   # Fase 2
├── feature/responsive-ui   # Fase 3
├── feature/adaptive-pages  # Fase 4
├── feature/mobile-ux       # Fase 5
└── feature/polish-mobile   # Fase 6
```

---

## 📝 Notas de Implementación

1. **Mobile-first CSS**: Usar `min-width` media queries, nunca `max-width`
2. **Font loading**: Usar `next/font` para optimización automática
3. **Touch targets**: Siempre verificar en dispositivo real o DevTools
4. **Testing**: Probar en iOS Safari y Chrome Android
5. **Accesibilidad**: Mantener focus indicators visibles
6. **Performance**: Lazy load componentes desktop-only

---

## ✅ Criterios de Aceptación

- [ ] Fuente Plus Jakarta Sans cargada correctamente
- [ ] Layout se adapta perfectamente a < 768px (bottom nav)
- [ ] Layout se adapta perfectamente a > 1024px (sidebar)
- [ ] Todos los textos son legibles en móvil (mínimo 14px)
- [ ] Touch targets cumplen 44px mínimo
- [ ] No hay scroll horizontal en ningún viewport
- [ ] Animaciones funcionan en móvil sin lag
