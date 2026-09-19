# Epic 4 Context: Persistent, Private Accounts

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Los usuarios podrán crear una cuenta, iniciar sesión y tener sus transacciones, categorías y presupuestos persistidos de forma confiable — privados para cada uno, sobreviviendo a reinicios y disponibles desde cualquier dispositivo — en reemplazo de los datos de demostración en memoria compartida que hoy se reinician en cada deploy. El backend real es Supabase (Postgres + Auth), desplegado en Vercel, con Row Level Security (RLS) como único mecanismo de aislamiento de datos por usuario (nunca filtrado a nivel de aplicación). La migración de hosting (FR10) ya está resuelta antes de este epic (`next.config.ts` sin `output: "export"`, workflows de GitHub Pages eliminados — PR #5).

## Stories

- Story 4.1: Fundamento de Auth y sesión server-side
- Story 4.2: Persistencia de transacciones vía Supabase con RLS
- Story 4.3: Persistencia de categorías vía Supabase con RLS
- Story 4.4: Persistencia de presupuestos vía Supabase con RLS
- Story 4.5: UI mínima de login y signup

## Requirements & Constraints

- Toda transacción, categoría y presupuesto debe pertenecer a un usuario autenticado; la sesión se gestiona vía Supabase Auth.
- El aislamiento de datos por usuario se logra exclusivamente vía RLS en Postgres — ninguna interfaz `IXRepository` ni método de `Api*Repository` recibe `userId` como parámetro.
- Cada tabla nueva debe habilitar `ENABLE ROW LEVEL SECURITY` y tener una policy `TO authenticated` por operación (SELECT/INSERT/UPDATE/DELETE), con condición `(select auth.uid()) = user_id` (con subselect, para evitar reevaluación por fila).
- La sesión se refresca server-side en cada request; toda ruta protegida decide su necesidad de sesión en un único punto central (no en cada Server Action individualmente).
- Los tipos TypeScript generados desde el esquema (`supabase gen types typescript`) deben regenerarse y commitearse junto con cualquier migración que cambie el esquema.
- Todo cambio de esquema Postgres se versiona con Supabase CLI (`supabase migration new` / `supabase db push`); nada se cambia a mano en el dashboard.
- La `SERVICE_ROLE_KEY` de Supabase nunca se usa en runtime de la app ni se define como variable de entorno en Vercel; solo se exponen la URL y la anon key. El pipeline de CI falla el build si aparece el literal `SERVICE_ROLE` bajo `src/`.
- El proyecto opera dentro de los tiers gratuitos de Supabase y Vercel ($0/mes): la cuota relevante en Vercel es Fast Origin Transfer (10GB/mes), no Fast Data Transfer.
- Se acepta como riesgo conocido y documentado que el proyecto Supabase free tier se pausa tras 7 días de inactividad (restaurable hasta 90 días); no hay mitigación automatizada, el despause es manual.
- Se usa un único proyecto Supabase compartido entre desarrollo, producción y Preview Deployments de Vercel (no hay ambiente de staging separado); riesgo aceptado explícitamente para un proyecto personal de un solo usuario.
- No hay estrategia de backup automatizado; mitigación mínima es un `supabase db dump` manual antes de cambios grandes de esquema.

## Technical Decisions

- Stack de datos/auth: `@supabase/supabase-js` (2.112.3) y `@supabase/ssr` (0.12.4) — sin ORM (nada de Drizzle/Prisma/Kysely); todo `Api*Repository` usa exclusivamente el cliente crudo de supabase-js.
- El archivo de sesión server-side es `proxy.ts` en la raíz del proyecto (Next.js 16.2.2 renombró y deprecó `middleware.ts`), exportando una función `proxy` desde `next/server`. Este es el único lugar que refresca el token y decide si una ruta requiere sesión, redirigiendo a `/login` si no la hay.
- Cliente Supabase server-side vive en `src/lib/supabase/server.ts` (`createServerClient` con cookies de `next/headers`); cliente browser-side en `src/lib/supabase/client.ts` (`createBrowserClient`), usado solo por componentes cliente que necesiten UI de auth. Ningún `actions.ts` crea su propio cliente Supabase directamente — `factory.ts` construye el cliente autenticado y lo inyecta en cada `Api*Repository`.
- Los repositorios reales siguen el patrón existente: `Api*Repository` (paralelo a `Mock*Repository`) implementan las mismas interfaces `I*Repository` sin cambios de firma; `factory.ts` resuelve la rama `DATA_SOURCE='api'` (antes placeholder fail-loud).
- Las tablas Postgres (`transactions`, `categories`, `budgets`) llevan `id uuid primary key default gen_random_uuid()` y `user_id uuid not null default (select auth.uid()) references auth.users(id)` con índice btree. Postgres genera ambos; `Api*Repository.create()` nunca los setea a mano.
- Las entidades de dominio en `domain/entities/` no exponen `userId` — permanece implícito de punta a punta, nunca llega a usecases ni a presentación.
- Las fechas siguen como objetos `Date` nativos de extremo a extremo (columnas `timestamptz`); no hay conversión manual.
- `Api*Repository` traduce el resultado `{data, error}` de supabase-js a la convención heredada de excepciones curadas (capturadas por el server action → `ActionResult`); nunca se expone `error.message` crudo al cliente.
- Se mantiene la frontera server-only heredada (`import 'server-only'` en infraestructura); `Api*Repository` solo alcanzable desde `app/**/actions.ts`.
- Estado derivado (cálculos de presupuesto, etc.) sigue viviendo en usecases del dominio; `Api*Repository` solo persiste y lee, nunca calcula.
- Estilos de cualquier UI nueva (login/signup) usan clases semánticas de `app/globals.css`, sin colores ad-hoc.

## UX & Interaction Patterns

- `/login` es una página cliente con formulario único que alterna entre "iniciar sesión" y "registrarse" (email + password).
- Login exitoso o signup exitoso redirige al dashboard; logout redirige a `/login`.
- Un usuario ya autenticado que navega directamente a `/login` es redirigido al dashboard en vez de ver el formulario.
- Las llamadas de auth (`signInWithPassword`, `signUp`, `signOut`) se hacen directo desde el componente cliente contra el cliente browser de Supabase — no se enrutan a través de un server action; esto no viola la frontera server-only, que rige `domain`/`infrastructure`, no el SDK de Auth de Supabase.
- Fuera de alcance para este epic: recuperación de contraseña, providers OAuth, verificación de email por UI.

## Cross-Story Dependencies

- Story 4.1 (Auth Foundation) es prerrequisito de 4.2, 4.3 y 4.4: todas dependen del cliente Supabase server-side y del patrón de sesión que 4.1 establece en `factory.ts` y `proxy.ts`.
- Story 4.1 también es prerrequisito de 4.5 (Login/Signup UI), que reutiliza el cliente browser de Supabase creado en 4.1.
- Stories 4.2, 4.3 y 4.4 siguen el mismo patrón (migración con RLS + tipos regenerados + `Api*Repository`) aplicado independientemente a transacciones, categorías y presupuestos respectivamente; no dependen entre sí pero comparten convención.
- El smoke test manual final de 4.4 verifica `DATA_SOURCE=api` funcionando en conjunto para transacciones, categorías y presupuestos — depende de que 4.2, 4.3 y 4.4 estén completas.
- Depende de Epic 1 (factory pattern, frontera server-only, naming `I*Repository`) y Epic 3 (`IBudgetRepository`, `GetBudgetStatusUseCase`) ya establecidos como base sobre la que este epic reemplaza los Mock*Repository por Api*Repository.
