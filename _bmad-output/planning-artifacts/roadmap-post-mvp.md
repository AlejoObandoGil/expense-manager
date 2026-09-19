---
status: planning
version: v1.0.0-beta
date: 2026-08-29
---

# Roadmap Post-MVP — expense-manager-1.0

## Versioning Strategy

```
v1.0.0-beta     (ACTUAL) — MVP funcional, falta polish visual + tests
  ├─ v1.1.0     — Epic 5: Cuentas Bancarias
  ├─ v1.2.0     — Epic 6: Metas de Ahorro
  ├─ v1.3.0     — Epic 7: Reportes Avanzados
  └─ v1.0.0-stable — Después de testear en prod + bugfixes
```

---

## Epic 5: Cuentas Bancarias ⭐⭐⭐⭐⭐

**Prioridad:** ALTA | **Esfuerzo:** 10-15 horas | **Versión:** v1.1.0

### Why
- Transacciones sin contexto de fuente/destino (tarjeta vs efectivo vs cuenta)
- Usuarios con múltiples cuentas necesitan visibilidad de balance por cuenta
- Detectar sobreendeudamiento en tarjetas de crédito

### What
```
Nueva tabla: accounts
├─ id (uuid)
├─ user_id (FK → auth.users, ON DELETE CASCADE)
├─ name (ej: "Tarjeta Crédito", "Cuenta Corriente")
├─ type (enum: credit_card | checking | savings | cash | investment)
├─ balance (decimal, saldo actual)
├─ currency (USD, MXN, ARS, etc)
├─ is_active (boolean, para soft delete)
├─ created_at (timestamp)
└─ updated_at (timestamp)

Modificar tabla: transactions
├─ account_id (uuid, FK → accounts, ON DELETE RESTRICT)
│  └─ Una transacción siempre ocurre en una cuenta
└─ (todas las otras columnas se mantienen)
```

### Stories
- **5.1 Create Account table + RLS + migrations**
  - Crear tabla `accounts` con RLS
  - Crear `IAccountRepository` interface
  - Crear `MockAccountRepository` + `ApiAccountRepository`
  - Regenerate Supabase types

- **5.2 Add account_id to transactions**
  - Migración: agregar FK account_id a transactions
  - Actualizar `ITransactionRepository` para aceptar account_id en create
  - Actualizar `CreateTransactionUseCase`

- **5.3 Implement Account CRUD**
  - `CreateAccountUseCase` + server action
  - `GetAccountsUseCase` (lista por usuario)
  - `UpdateAccountUseCase` (nombre, tipo, currency)
  - `DeleteAccountUseCase` (soft delete: is_active=false)

- **5.4 Account selector en Transaction form**
  - Dropdown de cuentas activas en modal crear transacción
  - Validación: usuario solo ve sus propias cuentas (RLS)
  - Mostrar balance actual de la cuenta seleccionada

- **5.5 Dashboard: Balance por Cuenta**
  - Nuevas cards en dashboard: 
    - Tarjeta Crédito: $X (en rojo si está overdrawn)
    - Cuenta Corriente: $Y
    - Efectivo: $Z
  - Total general = suma de todas
  - Link a detalles de cuenta

- **5.6 Accounts Management Page**
  - Nueva página `/accounts`
  - Lista de cuentas con tipo, currency, balance
  - Botones: Editar, Eliminar (soft), Ver historial
  - Crear nueva cuenta (modal)
  - Buscar/filtrar por tipo

### Acceptance Criteria
- [ ] Usuario puede crear múltiples cuentas
- [ ] Cada transacción está vinculada a una cuenta
- [ ] Dashboard muestra balance por cuenta
- [ ] RLS previene ver cuentas de otros usuarios
- [ ] Eliminación de cuenta (soft) no rompe transacciones antiguas
- [ ] Saldo de cuenta se actualiza automáticamente con nuevas transacciones

---

## Epic 6: Metas de Ahorro 🎯 ⭐⭐⭐

**Prioridad:** MEDIA | **Esfuerzo:** 8-10 horas | **Versión:** v1.2.0

### Why
- Gamificación: usuarios ven progreso hacia un objetivo
- Diferente de presupuesto (límite de gasto) → meta es ingreso/acumulación
- Motivación: "Necesito $5000 para vacaciones, voy en 46%"

### What
```
Nueva tabla: savings_goals
├─ id (uuid)
├─ user_id (FK → auth.users, ON DELETE CASCADE)
├─ name (ej: "Vacaciones 2027")
├─ target_amount (decimal, meta)
├─ current_amount (decimal, progreso actual)
├─ deadline (date, opcional)
├─ category_id (uuid, FK → categories, opcional)
│  └─ Canalizar solo gastos/ingresos de esta categoría hacia meta
├─ emoji (text, para visualización)
├─ is_completed (boolean)
├─ completed_at (timestamp, cuando alcanzó target)
├─ created_at (timestamp)
└─ updated_at (timestamp)
```

### Stories
- **6.1 Create savings_goals table + RLS**
- **6.2 Implement Savings Goal CRUD**
  - Create, Read, Update, Delete usecases
- **6.3 Progress Calculation**
  - Actualizar `current_amount` automáticamente
  - Opción 1: Recalcular dinámicamente (queries en tiempo real)
  - Opción 2: Trigger en Postgres (actualizar columna on transaction insert)
- **6.4 Savings Goals Dashboard**
  - Nueva sección en dashboard con goals activas
  - Barra circular de progreso (% visualizado)
  - Emoji grande + nombre + "Faltan $X"
- **6.5 Savings Goals Management Page**
  - `/goals` — lista completa
  - Crear, editar, eliminar metas
  - Ver transacciones asociadas
  - Celebración emoji 🎉 cuando alcanza target

### Acceptance Criteria
- [ ] Usuario puede crear meta con target y deadline
- [ ] Progreso se calcula automáticamente desde transacciones
- [ ] Dashboard muestra goals en orden de urgencia (deadline)
- [ ] Barra de progreso visual
- [ ] Celebración cuando alcanza 100%

---

## Epic 7: Reportes Avanzados 📊 ⭐⭐⭐

**Prioridad:** MEDIA | **Esfuerzo:** 6-8 horas | **Versión:** v1.3.0

### Why
- Usuarios necesitan ver patrones de gasto
- Comparativas mes a mes detectan sobregastos temprano
- Exportar datos para auditoría personal

### What
```
Nueva página: /reports

Vistas:
1. Overview (por defecto)
   - Total ingresos vs gastos (mes actual)
   - Comparativa vs mes anterior (% cambio)
   - Top 5 categorías por gasto

2. Monthly Trend
   - Línea: gastos/ingresos por mes (últimos 12)
   - Detectar seasonality

3. Category Breakdown
   - Tabla: categoría | % | monto | cambio vs mes anterior
   - Filtrar por rango de fechas

4. Account Summary
   - Tabla: cuenta | tipo | balance | cambio este mes
   - Gráfico: balance trend por cuenta (últimos 90 días)

5. Export
   - CSV: todas transacciones (filtrable)
   - PDF: reporte visual (resumen + tablas)
```

### Stories
- **7.1 Create Reports Infrastructure**
  - New usecase: `GenerateMonthlyReportUseCase`
  - Calculate aggregates (sum by category, date, etc)
  - Caching if needed (reports can be expensive)

- **7.2 Monthly Overview Page**
  - vs Month comparison logic
  - Top categories widget

- **7.3 Trends & Analytics**
  - 12-month line chart (recharts)
  - Category drilldown

- **7.4 Export Functionality**
  - CSV export server action
  - PDF generation (use library: `jsPDF` or `html2pdf`)

### Acceptance Criteria
- [ ] Reports carga en < 2s
- [ ] Comparativas mes a mes son correctas
- [ ] Exportar CSV incluye todos los campos
- [ ] PDF es visualmente limpio
- [ ] Filtros (rango fechas, categoría) funcionan

---

## Epic 8: Transacciones Recurrentes ⏰ ⭐⭐

**Prioridad:** BAJA | **Esfuerzo:** 8-12 horas | **Versión:** v1.4.0

### Why
- Usuario: "Todos los meses pago $50 de gym"
- No quiere tipear la misma transacción 12 veces
- Opción: generar automáticamente o solo recordatorio

### What
```
Nueva tabla: recurring_transactions
├─ id (uuid)
├─ user_id (FK → auth.users, ON DELETE CASCADE)
├─ amount (decimal)
├─ category_id (uuid, FK → categories)
├─ account_id (uuid, FK → accounts)
├─ description (text)
├─ type (income | expense)
├─ frequency (enum: daily | weekly | biweekly | monthly | quarterly | yearly)
├─ day_of_month (int, ej: 15 para el día 15 de cada mes)
├─ start_date (date)
├─ end_date (date, opcional, para limitar)
├─ is_active (boolean)
├─ next_execution_date (date, calculado)
└─ created_at (timestamp)
```

### Stories
- **8.1 Create recurring_transactions table**
- **8.2 Implement Recurring Transaction CRUD**
- **8.3 Auto-execution (cron job)**
  - Cada día, ejecutar Postgres trigger/Edge Function
  - Crear transacción real si `next_execution_date <= today`
  - Actualizar `next_execution_date` al siguiente ciclo
- **8.4 Recurring Transactions Dashboard**
  - Nueva sección: "Próximas recurrencias"
  - "Gym $50 en 5 días"
- **8.5 Management Page**
  - `/recurring` — ver, crear, pausar recurrencias

### Acceptance Criteria
- [ ] Usuario define recurrencia (día, frecuencia, duración)
- [ ] Transacción se genera automáticamente en día programado
- [ ] Usuario puede pausar/reanudar recurrencia
- [ ] Dashboard muestra próximas recurrencias

---

## Epic 9: Etiquetas/Tags Personalizados 🏷️ ⭐⭐

**Prioridad:** BAJA | **Esfuerzo:** 6-8 horas | **Versión:** v1.5.0

### Why
- Categoría es fija, pero usuario quiere clasificación adicional
- Ejemplo: "Comida" categoría, pero "#lujo" vs "#necesario" tags
- Reportes filtrados por tag

### What
```
Nueva tabla: transaction_tags
├─ id (uuid)
├─ user_id (FK → auth.users, ON DELETE CASCADE)
├─ name (text, ej: "lujo", "urgente", "viaje")
├─ color (hex, para visualización)
└─ created_at (timestamp)

Tabla de join: transaction_to_tags
├─ transaction_id (uuid, FK → transactions, ON DELETE CASCADE)
├─ tag_id (uuid, FK → transaction_tags, ON DELETE CASCADE)
└─ PK: (transaction_id, tag_id)
```

### Stories
- **9.1 Create tags infrastructure**
- **9.2 Transaction tag selector**
  - Multi-select en transaction form
  - Autocomplete de tags existentes
  - Crear tag on-the-fly si no existe
- **9.3 Filter & Search by tags**
  - Filtro de tags en transaction list
  - Reportes filtrados por tag
- **9.4 Tag Management Page**
  - `/tags` — lista, editar color, eliminar tags

### Acceptance Criteria
- [ ] Usuario puede crear tags personalizadas
- [ ] Asignar múltiples tags a una transacción
- [ ] Filtrar transacciones por tag
- [ ] Reportes incluyen breakdown por tag

---

## Epic 10: Modo Oscuro + Temas 🌙 ⭐⭐

**Prioridad:** BAJA | **Esfuerzo:** 4-6 horas | **Versión:** v1.6.0

### Why
- UX: usuarios que usan app de noche necesitan modo oscuro
- Branding: permite customización visual

### What
- Detector de preferencia del SO (`prefers-color-scheme`)
- Toggle en settings para forzar light/dark
- Persistir preferencia en BD (user preferences table)
- CSS variables para ambos modos

### Stories
- **10.1 Create user_preferences table**
- **10.2 Implement theme toggle**
- **10.3 Update all components for dark mode**
  - Revisar contraste
  - Ajustar colores

### Acceptance Criteria
- [ ] Toggle dark/light en settings
- [ ] Preferencia persiste entre sesiones
- [ ] Contraste WCAG AA en ambos modos
- [ ] No hay jarring flashes al cambiar tema

---

## Epic 11: Tests E2E (opcional) 🧪

**Prioridad:** MEDIA (quality assurance) | **Esfuerzo:** 10-15 horas | **Versión:** -

### Stories
- **11.1 Setup Playwright**
- **11.2 Auth flow tests** (login, signup, logout)
- **11.3 Transaction CRUD tests**
- **11.4 Account management tests**
- **11.5 Dashboard rendering tests**
- **11.6 Edge cases** (invalid input, RLS violations, etc)

---

## Epic 12: Mobile-First Polish 📱 (from roadmap-mobile-first.md)

**Prioridad:** MEDIA | **Esfuerzo:** 15-21 horas | **Versión:** v1.x.0

### Fases
1. Setup tipográfico (Plus Jakarta Sans)
2. Layout mobile-first (bottom nav en móvil)
3. Componentes responsive
4. Páginas adaptativas
5. Touch & UX móvil
6. Optimización

---

## Deployment & Production 🚀

- [ ] Setup Vercel (already Next.js compatible)
- [ ] Environment variables en Vercel
- [ ] Custom domain (si lo quieren)
- [ ] Monitoring: Sentry o similar
- [ ] Backups automáticos de BD Supabase

---

## Timeline Sugerido

```
Semana 1-2: Epic 5 (Cuentas)
Semana 3:   Epic 6 (Metas)
Semana 4:   Epic 7 (Reportes)
Semana 5:   Mobile-first polish
Semana 6:   Tests E2E + bugfixes
Semana 7:   Deploy a producción
```

---

## Known Issues from Deferred Work

Ver `deferred-work.md` para bugs pendientes pre-features:
- Auth middleware validation gaps
- Pagination en repositories
- Soft delete vs hard delete strategy
- Error messages en inglés
- Accesibilidad (ARIA labels)

**Recomendación:** Arreglár primero antes de agregar nuevas features.

---

## Notas

- Todos los epics siguen Clean Architecture
- RLS en todas las tablas nuevas
- Migraciones versionadas
- Regenerate Supabase types después de cada migración
- Tests e2e para flujos críticos
