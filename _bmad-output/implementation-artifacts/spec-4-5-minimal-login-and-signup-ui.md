---
title: 'Story 4.5: UI mínima de login y signup'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md']
baseline_commit: '482fa5d0870695508710f54c827e9d73a91989de'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hoy no existe ninguna UI para iniciar sesión, registrarse o cerrar sesión — `proxy.ts` ya redirige a `/login` cuando no hay sesión válida, pero esa ruta no existe, dejando a cualquier visitante sin forma de entrar a la app.

**Approach:** Crear `/login` como página cliente con un único formulario que alterna entre "iniciar sesión" y "registrarse", llamando directo al cliente browser de Supabase (`createBrowserClient()`, ya creado en 4.1) — sin server action. Agregar un control de logout en la navegación existente, y ocultar el chrome de dashboard (sidebar/nav) en `/login`.

## Boundaries & Constraints

**Always:**
- `src/app/login/page.tsx` es un client component (`'use client'`) con un solo formulario que alterna login/signup vía estado local (`useState`), reutilizando `Input`/`Label`/`Button` de `src/components/ui/`.
- Las llamadas de auth (`signInWithPassword`, `signUp`, `signOut`) van directo al cliente de `createBrowserClient()` (`src/lib/supabase/client.ts`) desde el componente cliente — nunca a través de un server action; esto no viola la frontera server-only (que rige `domain`/`infrastructure`, no el SDK de Auth).
- Al montar `/login`, si ya existe una sesión válida (`supabase.auth.getSession()`), redirigir de inmediato a `/` sin mostrar el formulario.
- Login o signup exitoso (cuando la respuesta trae `session`) redirige a `/` con `router.replace('/')` + `router.refresh()` (fuerza que `proxy.ts` re-evalúe la sesión en la siguiente navegación).
- Si `signUp()` no devuelve `session` (confirmación de email requerida por config del proyecto Supabase), mostrar un mensaje inline ("Revisá tu correo para confirmar tu cuenta") en vez de asumir sesión iniciada.
- Errores de Supabase Auth se muestran inline en el formulario, en español, traducidos desde los casos esperados (credenciales inválidas, email ya registrado) — nunca el string crudo en inglés del SDK.
- `src/presentation/components/shared/layout.tsx` se vuelve pathname-aware (`'use client'` + `usePathname()`, mismo patrón que `desktop-sidebar.tsx`): en `/login` renderiza solo `children`, sin `DesktopSidebar`/`MobileNav`/header.
- Se agrega un control de logout (llama `supabase.auth.signOut()`, luego `router.push('/login')` + `router.refresh()`) al final de `desktop-sidebar.tsx`.
- Estilos usan tokens semánticos ya definidos (`bg-background`, `text-foreground`, `bg-card`, `border`, variantes de `Button`) — sin colores ad-hoc, por AD-8 heredado.

**Ask First:** Ninguna decisión de esta historia requiere aprobación humana durante la ejecución — el único riesgo (confirmación de email) ya está resuelto arriba como comportamiento condicional, no como bloqueo.

**Never:**
- No modificar `proxy.ts` (ya excluye `/login` correctamente del matcher).
- No implementar recuperación de contraseña, providers OAuth, ni verificación de email por UI (fuera de alcance, ya en Deferred de ARCHITECTURE-SPINE.md).
- No agregar logout a `mobile-nav.tsx` en esta historia — sus 4 tabs no tienen espacio sin rediseño; queda fuera de alcance mínimo.
- No enrutar las llamadas de auth a través de un nuevo server action.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login válido | Email/password correctos de cuenta existente | `signInWithPassword` devuelve `session`, redirect a `/` | N/A |
| Login inválido | Credenciales incorrectas | Error inline curado ("Credenciales inválidas") | Traducir código de error de Supabase, no mostrar string crudo |
| Signup con sesión inmediata | Email nuevo, password válido, confirmación de email desactivada | Cuenta creada, `session` presente, redirect a `/` | N/A |
| Signup con confirmación pendiente | Email nuevo, password válido, confirmación de email requerida | Cuenta creada, `session` ausente, mensaje "Revisá tu correo" sin redirect | N/A |
| Signup con email duplicado | Email ya registrado | Error inline curado ("Ese correo ya está registrado") | N/A |
| Visita a /login ya autenticado | Sesión válida existente al montar la página | Redirect inmediato a `/`, sin mostrar el formulario | N/A |
| Logout | Usuario autenticado hace click en salir | `signOut()` limpia sesión, redirect a `/login` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/supabase/client.ts` -- `createBrowserClient()` ya existe (Story 4.1); reutilizar tal cual, no modificar.
- `src/proxy.ts` -- ya excluye `/login` del matcher y redirige ahí sin sesión; no se modifica.
- `src/app/layout.tsx` -- root layout; sigue envolviendo todo en `<Layout>`, no se modifica.
- `src/presentation/components/shared/layout.tsx` -- hoy envuelve TODO en sidebar/nav/header sin importar la ruta; se vuelve pathname-aware.
- `src/presentation/components/shared/desktop-sidebar.tsx` -- referencia directa del patrón `'use client'` + `usePathname()` a replicar en `layout.tsx`; se le agrega el control de logout al final del `<nav>`.
- `src/components/ui/{input,label,button}.tsx` -- componentes shadcn ya existentes (Button no se usa hoy en `transaction-form.tsx` pero sí está disponible y sigue los tokens semánticos).
- `src/presentation/components/transactions/transaction-form.tsx` -- referencia de patrón de formulario cliente (`useState`, `FormData`, manejo de loading); login usa error inline en vez de `sonner` toast (no hay server action que capturar).
- `package.json:13-14` -- `@supabase/ssr@0.12.4` y `@supabase/supabase-js@2.112.3` ya instalados, sin cambios de versión.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/login/page.tsx` -- crear página cliente con formulario único login/signup, check de sesión al montar, manejo de los 7 escenarios de la matriz -- AC1, AC2, AC4
- [x] `src/presentation/components/shared/layout.tsx` -- pathname-aware, sin chrome de dashboard en `/login` -- AC5
- [x] `src/presentation/components/shared/desktop-sidebar.tsx` -- agregar control de logout -- AC3

**Acceptance Criteria:**
- Given un visitante en `/login`, when envía email/password válidos de una cuenta existente, then Supabase Auth lo autentica y es redirigido a `/`.
- Given un visitante en `/login`, when cambia a "registrarse" y envía un email nuevo válido, then se crea la cuenta y, si hay `session`, aterriza en `/`; si no, ve el mensaje de confirmación pendiente.
- Given un usuario autenticado, when hace click en "salir", then su sesión termina y es redirigido a `/login`.
- Given un usuario ya autenticado, when navega directo a `/login`, then es redirigido a `/` en vez de ver el formulario.
- Given la página `/login` renderizada, then no aparece el sidebar ni la navegación del dashboard.

## Design Notes

`layout.tsx` (shared) hoy es un server component sin lógica de ruta — envolver TODO en sidebar/nav/header no tiene problema para las páginas ya protegidas por `proxy.ts`, pero `/login` está explícitamente excluida del matcher para poder mostrarse sin sesión, y mostrar ahí la navegación completa del dashboard (que redirige a `/login` en cuanto se toca, por no haber sesión) es confuso. Convertirlo a client component con `usePathname()` — mismo patrón ya usado en `desktop-sidebar.tsx`/`mobile-nav.tsx` — resuelve esto con un diff mínimo, sin reestructurar rutas en route groups.

El logout se agrega solo a `desktop-sidebar.tsx` (no a `mobile-nav.tsx`) para mantener el alcance mínimo de esta historia: los 4 tabs fijos del nav móvil no tienen espacio para un quinto sin rediseño, y eso es un problema de UI aparte, no de esta historia de auth.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos.
- `npm run build` -- expected: build exitoso.

**Manual checks (if no CLI):**
- Con `DATA_SOURCE=api`: signup con un email nuevo → (confirmar si aterriza en `/` o ve el mensaje de confirmación pendiente, según config del proyecto) → logout → login con las mismas credenciales → navegar directo a `/login` estando autenticado y confirmar redirect a `/`.

## Suggested Review Order

**Formulario login/signup**

- Punto de entrada: estado local del formulario y verificación de sesión al montar, con manejo defensivo si `getSession()` falla.
  [`page.tsx:40`](../../src/app/login/page.tsx#L40)

- `handleSubmit` alterna login/signup contra `createBrowserClient()`, con `catch` para errores no-`AuthError` (ej. red).
  [`page.tsx:66`](../../src/app/login/page.tsx#L66)

- Caso borde de anti-enumeración de Supabase: email duplicado con confirmación habilitada no trae `error` ni `session`, se detecta por `identities` vacío.
  [`page.tsx:110`](../../src/app/login/page.tsx#L110)

- Traducción de errores curados de Supabase Auth al español, nunca el string crudo del SDK.
  [`page.tsx:17`](../../src/app/login/page.tsx#L17)

**Chrome del layout**

- `Layout` se vuelve pathname-aware para ocultar sidebar/nav/header en `/login`.
  [`layout.tsx:11`](../../src/presentation/components/shared/layout.tsx#L11)

**Logout**

- Control de logout agregado al final del sidebar de escritorio.
  [`desktop-sidebar.tsx:21`](../../src/presentation/components/shared/desktop-sidebar.tsx#L21)
