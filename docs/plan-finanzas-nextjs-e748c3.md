# 💰 Gestor de Finanzas Personales

**Descripción**: Aplicación web moderna y minimalista para gestionar finanzas personales, construida con Next.js, diseño limpio con emojis grandes y arquitectura escalable basada en Clean Architecture.

---

## 🎨 Principios de Diseño

- **Minimalismo**: Interfaces limpias, espacios generosos, máximo 2-3 colores principales
- **Emojis Grandes**: Iconos de 24-48px para acciones principales, 64px+ para estados vacíos y logros
- **Tipografía**: Inter o Geist, pesos 400-600, tamaños consistentes
- **Micro-interacciones**: Hover states sutiles, transiciones de 200ms
- **Mobile-first**: Diseño responsive optimizado para todos los dispositivos

---

## 🏗️ Clean Architecture

```
src/
├── domain/                 # Capa de Dominio (reglas de negocio puras)
│   ├── entities/           # Entidades de negocio
│   ├── repositories/       # Interfaces de repositorios
│   ├── usecases/           # Casos de uso
│   └── types/              # Tipos del dominio
├── infrastructure/         # Capa de Infraestructura
│   ├── data/               # Datos mockeados
│   ├── repositories/       # Implementaciones de repositorios
│   └── storage/            # localStorage, APIs futuras
├── presentation/           # Capa de Presentación (Next.js App Router)
│   ├── app/                # Rutas de la aplicación
│   ├── components/         # Componentes React
│   ├── hooks/              # Custom hooks
│   └── styles/             # Estilos globales
└── shared/                 # Utilidades compartidas
    ├── utils/
    ├── constants/
    └── types/
```

**Flujo de Dependencias**: Presentación → Casos de Uso → Repositorios → Infraestructura

---

## 📋 Fases de Implementación

### Fase 1: Setup y Arquitectura Base 🏗️

- [ ] Inicializar Next.js 15 con App Router
- [ ] Configurar shadcn/ui con tema zinc (minimalista)
- [ ] Instalar dependencias: lucide-react, recharts, date-fns, clsx
- [ ] Crear estructura de carpetas Clean Architecture
- [ ] Configurar Tailwind con colores personalizados (zinc + un acento)

### Fase 2: Dominio y Entidades 📦

- [ ] Definir entidades: `Transaction`, `Category`, `Budget`, `Account`
- [ ] Crear interfaces de repositorios
- [ ] Implementar casos de uso:
  - `CreateTransactionUseCase`
  - `GetTransactionsUseCase`
  - `GetBalanceUseCase`
  - `GetMonthlyStatsUseCase`

### Fase 3: Datos Mockeados 💾

- [ ] Crear data mockeada realista (30-50 transacciones)
- [ ] Categorías predefinidas con emojis (🏠 Vivienda, 🍕 Alimentación, 🚗 Transporte, etc.)
- [ ] Implementar repositorios en memoria
- [ ] Helpers para filtrar, agregar y transformar datos

### Fase 4: Componentes UI Base 🧩

- [ ] **Layout**: Sidebar minimalista, header con emoji logo 💰
- [ ] **EmojiButton**: Botones grandes con emojis (48px) + texto
- [ ] **EmojiCard**: Cards con icono emoji destacado
- [ ] **EmptyState**: Estados vacíos con emojis grandes (64px+)
- [ ] **AmountDisplay**: Montos con colores (verde ingresos, rojo gastos)

### Fase 5: Dashboard Principal 📊

- [ ] Header con balance total y emoji 💰
- [ ] Cards de métricas con emojis grandes:
  - 💵 Ingresos del mes
  - 💸 Gastos del mes
  - 📈 Balance
  - 🎯 Presupuesto restante
- [ ] Gráfico de evolución mensual (línea suave)
- [ ] Gráfico de distribución por categorías (donut)
- [ ] Lista de transacciones recientes (últimas 5)

### Fase 6: Gestión de Transacciones 📝

- [ ] Página lista completa con filtros
- [ ] Formulario modal para agregar/editar
- [ ] Campos: monto, categoría (con emojis), fecha, descripción, tipo
- [ ] Acciones: ✏️ editar, 🗑️ eliminar, 📋 duplicar
- [ ] Filtros: fecha range, categoría, tipo

### Fase 7: Categorías y Presupuestos 🏷️

- [ ] Grid de categorías con emojis grandes (48px)
- [ ] Colores distintivos por categoría
- [ ] Configuración de presupuestos mensuales
- [ ] Barras de progreso circulares/lineales
- [ ] Alertas visuales cuando > 80% del presupuesto

### Fase 8: Polish y UX Final ✨

- [ ] Animaciones con Framer Motion (fade, slide)
- [ ] Toasts para feedback de acciones
- [ ] Estados de carga skeleton
- [ ] Hover effects en cards y botones
- [ ] Transiciones suaves entre páginas

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **UI** | shadcn/ui + TailwindCSS |
| **Estilo** | zinc base + un acento (emerald o blue) |
| **Íconos/Emojis** | Lucide React + emojis nativos |
| **Gráficos** | Recharts |
| **Animaciones** | Framer Motion |
| **Fechas** | date-fns |
| **Estado** | React Context (simple) |

---

## 🎭 Paleta de Colores Minimalista

```css
/* Base */
--background: #fafafa;        /* zinc-50 */
--foreground: #18181b;        /* zinc-900 */

/* Acento (elegir uno) */
--accent: #10b981;            /* emerald-500 - para finanzas */
--accent-light: #d1fae5;      /* emerald-100 */

/* Estados */
--income: #10b981;            /* emerald-500 */
--expense: #ef4444;           /* red-500 */
--warning: #f59e0b;           /* amber-500 */

/* Superficies */
--card: #ffffff;
--muted: #f4f4f5;             /* zinc-100 */
--border: #e4e4e7;            /* zinc-200 */
```

---

## 📁 Estructura Final de Carpetas

```
my-app/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── transaction.ts
│   │   │   ├── category.ts
│   │   │   └── budget.ts
│   │   ├── repositories/
│   │   │   ├── transaction.repository.ts
│   │   │   └── category.repository.ts
│   │   └── usecases/
│   │       ├── transactions/
│   │       │   ├── create-transaction.ts
│   │       │   ├── get-transactions.ts
│   │       │   └── delete-transaction.ts
│   │       └── dashboard/
│   │           └── get-monthly-stats.ts
│   ├── infrastructure/
│   │   ├── data/
│   │   │   └── mock-data.ts
│   │   └── repositories/
│   │       ├── mock-transaction.repository.ts
│   │       └── mock-category.repository.ts
│   ├── presentation/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/           # shadcn components
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   └── shared/
│   │   │       ├── emoji-card.tsx
│   │   │       ├── emoji-button.tsx
│   │   │       └── empty-state.tsx
│   │   └── hooks/
│   │       └── use-transactions.ts
│   └── shared/
│       ├── utils/
│       ├── constants/
│       └── types/
├── components.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🚀 MVP - Funcionalidades Prioritarias

1. **Dashboard** con balance, ingresos, gastos (emojis grandes)
2. **CRUD transacciones** con formulario modal
3. **Categorías** con emojis visuales
4. **Gráficos** simples de barras y donut
5. **Filtros** básicos por fecha

---

## ⏭️ Post-MVP (Futuras Iteraciones)

- 💾 Persistencia con localStorage
- 📤 Exportar a CSV
- 🎯 Metas de ahorro con celebración (emoji 🎉)
- 🔔 Recordatorios de pagos recurrentes
- 🔐 Autenticación básica
- 🌐 Backend real con API
- 📱 PWA para mobile

---

## � Git Workflow Automation

Durante el desarrollo, yo (Cascade) automatizaré completamente el control de versiones siguiendo estas convenciones:

### 🌿 Estrategia de Branching

```
main                    # Producción estable
├── develop             # Desarrollo integrado
├── feature/setup       # Fase 1: Setup inicial
├── feature/domain      # Fase 2: Dominio y entidades
├── feature/mock-data   # Fase 3: Datos mockeados
├── feature/ui-base     # Fase 4: Componentes UI
├── feature/dashboard   # Fase 5: Dashboard
├── feature/transactions # Fase 6: Transacciones
├── feature/categories  # Fase 7: Categorías
└── feature/polish      # Fase 8: Polish final
```

### 📝 Convención de Commits (Conventional Commits)

Formato: `type(scope): emoji descripción`

```
feat(domain): ✨ add Transaction entity
feat(infra): 💾 implement mock transaction repository
feat(ui): 🧩 create EmojiCard component
feat(dashboard): 📊 add monthly balance chart
fix(transactions): 🐛 correct amount calculation
refactor(categories): ♻️ extract category grid component
docs(readme): �📝 update installation instructions
```

**Tipos permitidos:**
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `refactor` - Refactor sin cambiar comportamiento
- `docs` - Documentación
- `style` - Cambios de formato/espaciado
- `test` - Tests
- `chore` - Tareas de mantenimiento

### 🤖 Automatización por Fase

Para cada fase del plan, ejecutaré automáticamente:

```bash
# 1. Crear feature branch desde develop
git checkout -b feature/nombre-fase develop

# 2. Desarrollar con commits frecuentes y atómicos
# (cada cambio lógico = un commit)

# 3. Antes de finalizar fase
git add .
git commit -m "feat(scope): emoji descripción del trabajo completado"

# 4. Merge a develop con squash si es necesario
git checkout develop
git merge --no-ff feature/nombre-fase -m "merge: integrate feature/nombre-fase"

# 5. Eliminar branch de feature
git branch -d feature/nombre-fase
```

### 📋 Reglas de Commit Automáticas

1. **Frecuencia**: Commit después de cada cambio lógico completado
2. **Atomicidad**: Un commit = un cambio coherente (no mixes)
3. **Mensajes claros**: Descripción en imperativo presente
4. **Emojis obligatorios**: Usar emoji apropiado para el tipo de cambio
5. **Scope explícito**: Siempre indicar el área afectada

### 🔧 Pre-commit Checks (Automáticos)

Antes de cada commit verificaré:
- [ ] TypeScript compila sin errores (`tsc --noEmit`)
- [ ] ESLint pasa (`next lint`)
- [ ] No console.logs de debugging
- [ ] Código formateado consistentemente

### 📤 Flujo de Merge

```
Fase completada
       ↓
Commit en feature branch
       ↓
Checkout develop
       ↓
Merge feature → develop
       ↓
(Al finalizar MVP)
       ↓
Merge develop → main
       ↓
Tag: v1.0.0-mvp 🏷️
```

### 🏷️ Versionado Semántico

- `v0.1.0-setup` - Setup inicial completo
- `v0.2.0-domain` - Dominio implementado
- `v0.3.0-mock` - Datos mockeados
- `v0.4.0-ui` - UI base lista
- `v0.5.0-dashboard` - Dashboard funcional
- `v0.6.0-transactions` - CRUD transacciones
- `v0.7.0-categories` - Categorías y presupuestos
- `v0.8.0-polish` - UX final polish
- `v1.0.0-mvp` - MVP completo 🎉

### 🔄 Comandos Git que Ejecutaré

```bash
# Inicialización
git init
git add .
git commit -m "chore(repo): 🎉 initial commit"
git branch -M main
git checkout -b develop

# Por cada fase
git checkout -b feature/fase-X develop
# ... trabajo ...
git add .
git commit -m "feat(scope): ✨ descripción"
git checkout develop
git merge feature/fase-X
git branch -d feature/fase-X

# Release MVP
git checkout main
git merge develop
git tag -a v1.0.0-mvp -m "🎉 MVP release - Gestor de Finanzas Personales"
```

### 📊 Resumen de Commits Esperados por Fase

| Fase | Commits Estimados | Branch |
|------|------------------|--------|
| 1. Setup | 3-5 | `feature/setup` |
| 2. Dominio | 4-6 | `feature/domain` |
| 3. Mock Data | 3-4 | `feature/mock-data` |
| 4. UI Base | 5-8 | `feature/ui-base` |
| 5. Dashboard | 4-6 | `feature/dashboard` |
| 6. Transacciones | 5-7 | `feature/transactions` |
| 7. Categorías | 4-5 | `feature/categories` |
| 8. Polish | 3-5 | `feature/polish` |
| **Total** | ~30-40 commits | - |

---

## 📝 Notas de Implementación

- **Emojis**: Usar emojis nativos, no librerías externas
- **Tamaños**: `text-2xl` (24px) para botones, `text-4xl` (36px) para cards, `text-6xl` (60px) para estados vacíos
- **Espaciado**: `gap-6` o `gap-8` entre elementos, `p-6` para padding interno
- **Bordes**: Bordes sutiles (`border-zinc-200`) o sin bordes con sombras suaves
- **Sombras**: `shadow-sm` o `shadow-md` máximo, nada agresivo
- **Clean Code**: Una responsabilidad por función, nombres descriptivos, sin comentarios innecesarios
- **Git**: Commits atómicos, mensajes claros, branches por fase, merges ordenados
