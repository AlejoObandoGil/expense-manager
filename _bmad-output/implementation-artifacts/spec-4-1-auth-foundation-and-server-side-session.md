---
title: 'Story 4.1: Fundamento de Auth y sesión server-side'
type: 'feature'
created: '2026-08-18'
status: 'done'
review_loop_iteration: 1
baseline_commit: '58816f0e919b1729adba16145ea3df779d4638bc'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hoy no existe autenticación real: los datos son mock en memoria compartida, sin sesión de usuario a la que scopar nada. Ninguna historia de persistencia (4.2-4.4) tiene a quién aislar los datos sin un fundamento de sesión server-side.

**Approach:** Instalar `@supabase/supabase-js@2.112.3` y `@supabase/ssr@0.12.4`; crear los clientes Supabase server (`src/lib/supabase/server.ts`) y browser (`src/lib/supabase/client.ts`); crear `src/proxy.ts` (junto a `src/app`, la ubicación que Next.js 16 realmente registra en este proyecto — ver corrección en Spec Change Log) que refresca el token de sesión y redirige a `/login` en toda ruta de la app cuando no hay sesión; añadir el guard de CI que falla el build si aparece el literal `SERVICE_ROLE` bajo `src/`.

## Boundaries & Constraints

**Always:**
- `import 'server-only'` como primera línea en `src/lib/supabase/server.ts` (el cliente browser NO lo lleva — se usa desde componentes cliente).
- `src/proxy.ts` es el único lugar de la app que refresca el token y decide redirects por sesión.
- Versiones exactas: `@supabase/supabase-js@2.112.3`, `@supabase/ssr@0.12.4` — no usar rangos `^`/`~`.
- Env vars de Supabase: `SUPABASE_URL` y `SUPABASE_ANON_KEY` (sin prefijo) para uso server-side (`server.ts`, `src/proxy.ts`); `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mismos valores, expuestos a propósito al bundle del navegador — la anon key es segura de exponer) para uso browser-side (`client.ts` exclusivamente). Documentar las 4 en `.env.example`, sin valores reales.
- Todas las rutas de la app quedan protegidas por `src/proxy.ts` salvo los assets internos de Next.js (`_next/static`, `_next/image`, `favicon.ico`) y `/login`, excluida explícitamente del matcher desde ya (aunque la ruta no exista todavía) para evitar un loop de redirect en cuanto la Story 4.5 la cree — decisión ya tomada con el humano.
- `src/proxy.ts` envuelve `supabase.auth.getUser()` en `try/catch`: si falla (outage/red), se trata igual que "sin sesión" (redirect a `/login`) en vez de lanzar una excepción no controlada que tumbe la ruta completa.

**Ask First:**
- Si surge la necesidad de tocar `src/infrastructure/repositories/factory.ts` para que esta historia compile/funcione — está fuera de alcance de 4.1 (lo tocan 4.2-4.4); si el AC no se puede cumplir sin tocarlo, HALT y preguntar.

**Never:**
- No crear tablas Supabase, migraciones, ni ningún `Api*Repository` — eso es 4.2-4.4.
- No construir la UI de `/login`/`/signup` — eso es 4.5. `src/proxy.ts` puede redirigir a una ruta que aún no existe.
- No crear `middleware.ts` bajo ningún nombre ni ubicación.
- No definir ni referenciar `SUPABASE_SERVICE_ROLE_KEY` en ningún archivo bajo `src/`, ni en `.env.example`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ruta protegida sin sesión | Request a `/`, `/transactions`, `/categories` o `/budgets` sin cookie de sesión válida | `src/proxy.ts` redirige (307) a `/login` | N/A |
| Ruta protegida con sesión válida | Request con cookie de sesión Supabase vigente | `src/proxy.ts` refresca el token si aplica y deja pasar el request sin redirect | N/A |
| Asset interno de Next.js | Request a `/_next/static/...`, `/_next/image/...`, `/favicon.ico` | `src/proxy.ts` no intercepta (excluido por `matcher`) | N/A |
| Ruta `/login` sin sesión | Request a `/login` sin cookie de sesión válida | `src/proxy.ts` no redirige (excluida del `matcher`); deja pasar el request | N/A |
| `supabase.auth.getUser()` falla | Error de red/outage de Supabase Auth durante el refresh | `src/proxy.ts` trata el fallo igual que "sin sesión" y redirige a `/login` | El error se captura en `try/catch`, nunca se propaga sin controlar |
| CI detecta `SERVICE_ROLE` bajo `src/` | PR con el literal `SERVICE_ROLE` en cualquier archivo de `src/` | Job `lint-and-build` falla | El step de grep retorna código de salida distinto de 0 y detiene el job |

</frozen-after-approval>

## Code Map

- `src/infrastructure/repositories/factory.ts:1` -- ejemplo existente del patrón `import 'server-only'` como primera línea; NO se modifica en esta historia (las ramas `DATA_SOURCE === 'api'` siguen siendo el stub fail-loud hasta 4.2-4.4).
- `src/infrastructure/repositories/mock-transaction.repository.ts:1` -- misma convención `server-only`, referencia de estilo para `server.ts`.
- `package.json:18,23` -- `next@16.2.2` y `server-only@^0.0.1` ya presentes; sin ningún `@supabase/*` instalado todavía (confirmado, sin conflictos de versión).
- `.github/workflows/ci.yml` -- job `lint-and-build`: `checkout` → `setup-node` (node 20.x) → `npm ci` → `npm run lint --if-present` → `npx tsc --noEmit` → `npm run build`. El guard de `SERVICE_ROLE` se inserta como step nuevo dentro de este job, después de `npm ci`.
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md:15,33-37` -- confirma que Next.js 16 renombró `middleware.ts` a `proxy.ts` (misma funcionalidad); convención: archivo en la raíz o junto a `app`. Como en este proyecto `app` vive en `src/app`, Next.js solo registra el proxy en `src/proxy.ts` — un `proxy.ts` en la raíz del repo se compila pero nunca se ejecuta (confirmado empíricamente: sin él, `next build` no genera la ruta `ƒ Proxy (Middleware)`). Exporta una función `proxy` desde `next/server`, `export const config = { matcher: [...] }` opcional para excluir rutas.
- `src/app/` -- estructura actual: `layout.tsx`, `page.tsx` (dashboard), `categories/page.tsx`, `transactions/page.tsx` (no existe `/login` ni `budgets/page.tsx` todavía) — confirma que ninguna UI de auth existe aún.
- No existe `.env.example` ni `.env.local` en el repo — se crea `.env.example` en esta historia.
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md` -- confirma que Next.js solo inyecta al bundle del navegador las env vars con prefijo `NEXT_PUBLIC_`; las demás quedan `undefined` en código que se ejecuta en el browser. `client.ts` necesita `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Hallazgo de la ronda de revisión anterior (iteración 1): el matcher de `src/proxy.ts` debe excluir `/login` explícitamente además de los assets internos de Next.js, o la ruta quedará atrapada en un loop de redirect en cuanto exista (Story 4.5).

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- agregar `@supabase/supabase-js@2.112.3` y `@supabase/ssr@0.12.4` como dependencias exactas -- requerido por AC1
- [x] `src/lib/supabase/server.ts` -- crear, primera línea `import 'server-only'`, exportar `createServerClient` que arma el cliente Supabase server-side leyendo/escribiendo cookies vía `next/headers` (`cookies()`), usando `process.env.SUPABASE_URL`/`SUPABASE_ANON_KEY` (sin prefijo) -- AC1
- [x] `src/lib/supabase/client.ts` -- crear, exportar `createBrowserClient` para uso desde componentes cliente de auth UI (sin `server-only`), usando `process.env.NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` -- AC1
- [x] `src/proxy.ts` (junto a `src/app`, no en la raíz del proyecto) -- crear, exportar función `proxy` desde `next/server` que use `@supabase/ssr` para refrescar la sesión en cada request (con `supabase.auth.getUser()` envuelto en `try/catch`, tratando el error como "sin sesión") y redirigir (307) a `/login` cuando no hay sesión válida; `export const config = { matcher: [...] }` excluyendo `_next/static`, `_next/image`, `favicon.ico` y `/login` -- AC2
- [x] `.env.example` -- crear, documentar `SUPABASE_URL=`, `SUPABASE_ANON_KEY=`, `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (sin valores reales, sin `SERVICE_ROLE`), mencionando `src/proxy.ts` además de `server.ts`/`client.ts` como consumidores -- soporta AC1/AC3
- [x] `.github/workflows/ci.yml` -- agregar step `- run: '! grep -r "SERVICE_ROLE" src/'` (o equivalente que falle si hay match) al job `lint-and-build`, después de `npm ci` -- AC3

**Acceptance Criteria:**
- Given un request llega sin sesión válida a cualquier ruta de la app (excepto assets internos de Next.js), when pasa por `src/proxy.ts`, then se redirige a `/login`.
- Given un request llega con una sesión Supabase vigente, when pasa por `src/proxy.ts`, then el token se refresca si corresponde y el request continúa sin redirect.
- Given un request llega a `/login` sin sesión válida, when pasa por `src/proxy.ts`, then NO se redirige (la ruta está excluida del `matcher`) y el request continúa.
- Given el literal `SERVICE_ROLE` aparece en cualquier archivo bajo `src/`, when corre el job `lint-and-build` en un PR, then el build falla.
- Given el proyecto se despliega en Vercel, when se revisan las env vars configuradas, then `SUPABASE_SERVICE_ROLE_KEY` nunca está entre ellas (verificación manual, fuera del alcance de este agente — el humano confirma en el dashboard de Vercel).
- Given el repositorio completo, when se busca `middleware.ts` en cualquier ubicación, then no existe ningún archivo con ese nombre.

## Design Notes

`src/proxy.ts` sigue el patrón estándar de `@supabase/ssr` para Next.js App Router: crea un `NextResponse` mutable, instancia el cliente server con `createServerClient(url, anonKey, { cookies: { getAll, setAll } })` apuntando a las cookies del request/response del proxy (no las de `next/headers`, que son de solo lectura fuera de Server Actions/Route Handlers), llama `supabase.auth.getUser()` dentro de un `try/catch` para forzar el refresh sin dejar que un error de red tumbe la ruta, y redirige si `user` es `null` (o la llamada falló) y la ruta no es un asset ni `/login`, excluidos por `matcher`.

`client.ts` usa las variables `NEXT_PUBLIC_*` porque es el único de los tres archivos que se ejecuta en el navegador; `server.ts` y `src/proxy.ts` siguen usando las variables sin prefijo porque corren exclusivamente en el servidor y no necesitan (ni deben) quedar inlineadas en el bundle del cliente.

## Spec Change Log

- **Finding (iteración 1, tres reviewers coincidieron):** `client.ts` leía `SUPABASE_URL`/`SUPABASE_ANON_KEY` sin prefijo `NEXT_PUBLIC_`, por lo que ambos valores resolvían `undefined` en el navegador y `createBrowserClient()` habría fallado en tiempo de ejecución apenas se invocara (Story 4.5). **Amend:** `client.ts` ahora usa `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`; `.env.example` documenta las 4 variables. **Evita:** un `createBrowserClient(undefined, undefined)` que rompe login/signup/logout desde el día uno de 4.5. **KEEP:** el resto de la arquitectura de `client.ts` (sin `server-only`, misma forma de export) se mantiene igual.
- **Finding (iteración 1, tres reviewers coincidieron):** el matcher de `src/proxy.ts` no excluía `/login`, generando un loop de redirect infinito en cuanto esa ruta exista (Story 4.5) — la página pensada para resolver "sin sesión" quedaría inalcanzable. **Amend:** el matcher ahora excluye también `/login` explícitamente. **Evita:** el loop infinito y la imposibilidad de completar login. **KEEP:** el resto del comportamiento del matcher (todas las demás rutas protegidas, assets internos excluidos) se mantiene igual.
- **Finding (iteración 1, un reviewer):** `supabase.auth.getUser()` sin `try/catch` podía tumbar cualquier ruta ante un outage transitorio de Supabase Auth. **Amend:** se envuelve en `try/catch`, tratando el error igual que "sin sesión". **Evita:** una excepción no controlada en el único punto por el que pasa casi todo request de la app. **KEEP:** el resto de la lógica de refresh no cambia.
- **Finding (implementación, iteración 2, descubierto empíricamente):** el spec original decía "`proxy.ts` en la raíz del proyecto", siguiendo literalmente los Dev Notes de `epics.md`. Como `app` vive en `src/app` en este proyecto (no en la raíz), Next.js 16 solo registra el proxy en `src/proxy.ts` — un archivo en la raíz compila y pasa `tsc`/`build` sin error pero nunca se ejecuta en runtime (confirmado: sin `src/proxy.ts`, `next build` no emite `ƒ Proxy (Middleware)` y un `GET /` sin sesión devuelve 200 en vez de redirigir). **Amend:** el archivo se ubica en `src/proxy.ts`. **Evita:** un guard de sesión que compila pero no protege nada. **KEEP:** el resto del comportamiento (contenido de la función, matcher, try/catch) no cambia — es un cambio de ubicación de archivo únicamente.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos -- ✅ ejecutado dos veces (por el subagente y de forma independiente), sin errores.
- `npm run build` -- expected: build exitoso, sin fallo por `output: "export"` ni por el nuevo `src/proxy.ts`, y debe emitir `ƒ Proxy (Middleware)` -- ✅ ejecutado, build exitoso, `ƒ Proxy (Middleware)` presente.
- `grep -r "SERVICE_ROLE" src/` (local, simulando el step de CI) -- expected: sin matches -- ✅ verificado, sin matches (y en la ronda anterior se confirmó también que el guard SÍ detecta el literal cuando está presente).

**Manual checks (if no CLI):**
- Levantar el dev server y confirmar que una request a `/` sin cookie de sesión redirige a `/login`, y que una request a `/login` sin sesión NO redirige (pasa directo, ya excluida del matcher). -- ✅ Verificado con `next start` + env vars dummy: `GET /` y `GET /transactions` → 307 a `/login`; `GET /login` → pasa el matcher (404 porque la página aún no existe, esperado hasta la Story 4.5). No se probó contra un proyecto Supabase real (sesión válida / outage real de Auth) — la lógica sigue el patrón oficial de `@supabase/ssr` y las decisiones de diseño quedan documentadas arriba, pero esos dos escenarios de la matriz quedan sin ejercitar end-to-end contra un backend real.
- Confirmar en el dashboard de Vercel que las env vars del proyecto son únicamente `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nunca `SUPABASE_SERVICE_ROLE_KEY`). -- ⏳ Pendiente, a cargo de John (fuera del alcance del agente — no hay proyecto Supabase real configurado en este entorno).
