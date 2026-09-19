---
title: 'Revisión de verificación web — ARCHITECTURE-SPINE.md (Backend Real, Auth y Deployment)'
target: architecture-expense-manager-1.0-2026-08-17/ARCHITECTURE-SPINE.md
reviewer: independent web-verification pass
date: 2026-08-17
---

# Revisión de verificación web

Objetivo: confirmar, con WebSearch/WebFetch contra fuentes vivas (no memoria de entrenamiento), cada afirmación técnica comprometida en el spine. Fecha de referencia: 2026-08-17.

## Hallazgo crítico

### 1. AD-14 y el Structural Seed prescriben `middleware.ts`, pero Next.js 16.2.2 (la versión exacta en `package.json` de este proyecto) renombró y deprecó ese file convention a `proxy.ts` — SEVERIDAD: ALTA

- El spine dice explícitamente: *"se agrega `middleware.ts` en la raíz que usa `@supabase/ssr`... Server Components no pueden escribir cookies, por eso el middleware es obligatorio"* (AD-14), y el Structural Seed lista `middleware.ts # nuevo, raiz del proyecto`.
- Verificado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (docs locales de la versión instalada, `next@16.2.2` según `package.json`): *"The `middleware` file convention is deprecated and has been renamed to `proxy`"*. No existe ningún `middleware.md` en `node_modules/next/dist/docs/` — solo `proxy.md`.
- Confirmado también en `nextjs.org/docs/messages/middleware-to-proxy`: hay codemod oficial (`npx @next/codemod@canary middleware-to-proxy .`) que renombra el archivo y la función `middleware()` → `proxy()`.
- Irónicamente, la propia fuente citada en el memlog (`supabase.com/docs/guides/auth/server-side/nextjs`) ya usa la terminología nueva: *"The Proxy is responsible for... Since Next.js Server Components can't write cookies, you need a Proxy to refresh expired Auth tokens"*. Si esa página se hubiera leído con atención en vez de solo citarse como fuente, el nombre correcto habría aparecido.
- Esto es exactamente el tipo de trampa que `AGENTS.md` de este repo advierte explícitamente: *"This is NOT the Next.js you know... Read the relevant guide in `node_modules/next/dist/docs/` before writing any code"*. La decisión de nombrar el archivo `middleware.ts` parece escrita desde memoria de entrenamiento (convención pre-Next.js-16), no verificada contra los docs reales de la versión instalada.
- **Acción recomendada:** corregir AD-14 y el Structural Seed para usar `proxy.ts` (función exportada `proxy()`), no `middleware.ts`.

## Hallazgos menores / notas

### 2. Supabase free tier — cifras correctas, pero falta una condición operativa relevante para AD-16 — SEVERIDAD: MEDIA

- Verificado en `supabase.com/pricing`: 500MB storage, 50K MAU, 1GB file storage, 2 proyectos, 500K invocaciones de edge functions — **todos los números del spine (AD-11) y del memlog coinciden exactamente**.
- Pero la misma fuente agrega una condición no mencionada en el spine: *"Free projects are paused after 1 week of inactivity."* AD-16 elige un único proyecto Supabase compartido dev=prod para un usuario personal — si el usuario no usa la app (ni corre nada contra el proyecto) durante una semana, el proyecto se pausa automáticamente. Esto no invalida la decisión, pero es un riesgo operativo real para un proyecto de baja frecuencia de uso que el spine no contempla y que no se puede descartar sin acción (ej. seguir usando localmente, algún ping, o aceptar el riesgo).
- No es evidencia de "no investigado" — los números centrales sí están bien verificados — pero es una omisión que una investigación más completa habría capturado.

### 3. Patrón RLS citado (`auth.uid() = user_id`) es funcional pero no el patrón de mejor práctica actual — SEVERIDAD: BAJA

- Verificado en `supabase.com/docs/guides/database/postgres/row-level-security`: el patrón recomendado actualmente envuelve `auth.uid()` en un `select` por rendimiento: `(select auth.uid()) = user_id`, no `auth.uid() = user_id` sin envolver (AD-13, AD-18 usan la forma sin envolver).
- Función y sintaxis `TO authenticated` sí siguen vigentes y correctamente citadas.
- Es una diferencia de *performance*, no de corrección funcional — pero ya que AD-18 explícitamente justifica el índice btree en `user_id` "para que RLS sea performante", vale la pena que la implementación real use el patrón recomendado.

### 4. Vercel Hobby — "100GB fast data transfer" es aproximadamente correcto pero la página oficial actual ya no lo presenta como línea del plan, y existe un límite más estricto no mencionado — SEVERIDAD: MEDIA-BAJA

- El WebFetch directo a `vercel.com/docs/plans/hobby` (fecha `last_updated: 2026-06-16` en la propia página) muestra una tabla de "Hobby Included Usage" centrada en Active CPU (4 CPU-hrs), Provisioned Memory (360 GB-hrs), Function Invocations (1M), Edge Requests (hasta 1M) — **sin ninguna fila de "Fast Data Transfer"** en esa tabla actual.
- Búsquedas adicionales confirman que 100GB de Fast Data Transfer sigue existiendo como guía de fair-use (no como línea de tabla), y agregan un dato que el spine no menciona: existe un límite separado y mucho más chico, "Fast Origin Transfer", de solo ~10GB/mes en Hobby (tráfico no cacheado / desde funciones/Server Actions). Para una app con Server Actions (como este proyecto), ese es el límite más relevante, no el de 100GB de CDN cacheado.
- El número de 100GB citado no es falso, pero el spine lo presenta como el límite operativo relevante sin mencionar el límite de origin transfer, que es el que de hecho podría afectar a una app basada en Server Actions.

## Verificaciones que sí coinciden completamente con la fuente actual

| Afirmación del spine/memlog | Estado |
| --- | --- |
| `@supabase/supabase-js` v2.112.3 es la versión vigente | Confirmado (npm, agosto 2026) |
| `@supabase/ssr` v0.12.4 es la versión vigente, reemplaza `@supabase/auth-helpers-*` (deprecado, última versión 0.15.0, sin más actualizaciones) | Confirmado |
| `@supabase/ssr` recomendado oficialmente para auth server-side en Next.js | Confirmado |
| RLS con `auth.uid()` y policies `TO authenticated` sigue siendo el mecanismo vigente y recomendado | Confirmado (con matiz de performance, ver hallazgo 3) |
| Railway free: reducido a $1 USD crédito/mes tras trial de $5 (30 días) | Confirmado |
| Render free: web services duermen tras 15 min de inactividad (antes 30 min); Postgres free expira a 30 días + 14 días de gracia | Confirmado |
| Cloudflare Workers requiere adaptador OpenNext (`@opennextjs/cloudflare`), no first-party de Vercel/Next.js | Confirmado — soporta Next 16 actualmente, riesgo de compatibilidad citado en el spine es razonable como cautela pero no está "vencido" hoy |
| Next.js 16.2.2 es una versión real (marzo 2026) | Confirmado, y coincide con `package.json` del repo |
| Supabase CLI: uso de `supabase migration new` / `supabase db push`, instalación vía npm/brew/scoop | Sigue siendo el flujo vigente |

## Veredicto

La mayoría de los números y decisiones sí fueron verificados correctamente contra fuentes vivas — coinciden con lo que se encuentra hoy. El problema real no es un número mal citado sino una convención de Next.js que cambió de nombre: el spine compromete `middleware.ts` cuando la versión instalada (`next@16.2.2`) ya renombró esa convención a `proxy.ts`, algo que los propios docs locales del proyecto y la fuente citada en el memlog (Supabase) ya reflejan. Esto debe corregirse antes de implementar AD-14.
