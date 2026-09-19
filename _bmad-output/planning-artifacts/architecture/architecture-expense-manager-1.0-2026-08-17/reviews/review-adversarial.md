# Revisión Adversarial — ARCHITECTURE-SPINE.md (expense-manager-1.0, backend real)

**Documento revisado:** `_bmad-output/planning-artifacts/architecture/architecture-expense-manager-1.0-2026-08-17/ARCHITECTURE-SPINE.md`
**Método:** para cada AD-10..AD-18, se construyen dos implementaciones hipotéticas ("dos stories, dos desarrolladores") que cumplen la Rule tal como está escrita pero producen artefactos incompatibles entre sí o reabren el riesgo que el AD dice prevenir.
**Veredicto general:** el spine tiene un hueco crítico real (RLS puede "cumplirse" sin proteger nada) y varios huecos altos/medios donde la Rule fija el *qué* pero no el *cómo se verifica*, dejando implementaciones divergentes igualmente "conformes".

---

## Hallazgo 1 — CRÍTICO — AD-13 se puede cumplir literalmente con las tablas completamente abiertas

**AD atacado:** AD-13 (scoping vía RLS, nunca `userId` explícito), en interacción con AD-15 (anon key "segura para exponer") y AD-17 (migraciones).

**Rule tal como está escrita:** "ninguna interfaz `IXRepository` ni método de `Api*Repository` recibe `userId` como parámetro. El scoping por usuario es responsabilidad exclusiva de RLS policies en Postgres."

**Implementación A:** escribe la migración con `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;` y una policy `USING (auth.uid() = user_id)` para cada tabla, para cada operación (`SELECT`/`INSERT`/`UPDATE`/`DELETE`), y el `Api*Repository` nunca pasa `userId` a ningún método.

**Implementación B:** el `Api*Repository` tampoco pasa nunca `userId` a ningún método de la interfaz (cumple la Rule al pie de la letra) — pero la migración solo agrega la columna `user_id` (requerida por AD-18) y el índice btree, sin ejecutar `ENABLE ROW LEVEL SECURITY` ni crear ninguna policy. En Postgres, RLS está **deshabilitada por default** en una tabla nueva; y en Supabase, los privilegios por default (`ALTER DEFAULT PRIVILEGES`) ya otorgan `SELECT/INSERT/UPDATE/DELETE` sobre tablas nuevas de `public` a los roles `anon`/`authenticated`. El resultado: con RLS off, **cualquier fila de cualquier usuario es legible y escribible por cualquiera que tenga el anon key** — que es exactamente la clave que AD-15 declara "segura para exponer" bajo la premisa (nunca escrita como Rule) de que RLS está activa.

**Por qué las dos son "conformes":** el texto de AD-13 regula la *forma de la interfaz* (nada de `userId` como parámetro) pero no impone ningún gate de *estado real de la base* — no dice "toda tabla nueva debe ir acompañada, en el mismo PR/migración, de `ENABLE ROW LEVEL SECURITY` + al menos una policy por operación", ni exige verificación (test automatizado tipo "usuario B no puede leer fila de usuario A", o un check en CI que falle si existe una tabla en `information_schema` sin `rowsecurity = true`). La Implementación B pasa code review de alguien que solo lee el diff del `Api*Repository` (que en efecto no tiene `userId` en ningún lado) sin mirar el SQL de la migración.

**Severidad:** crítica — es el "bug de seguridad más caro posible" que el propio AD-13 dice prevenir, y el spine no cierra la ruta para introducirlo por omisión, no por malicia.

**Recomendación (para un AD-19 o para endurecer AD-13/AD-17):** exigir explícitamente que cada migración que crea una tabla de dominio incluya `ENABLE ROW LEVEL SECURITY` + policies para las 4 operaciones en el mismo archivo de migración, y definir un mecanismo de verificación (script/test que falle el build si `pg_tables`/`pg_policies` muestra una tabla sin RLS o sin policy para algún comando).

---

## Hallazgo 2 — ALTO — AD-18 fija el DEFAULT de `id` pero no el de `user_id`, dejando el punto de escritura ambiguo entre "DB decide" y "app decide"

**AD atacado:** AD-18, en el límite exacto con AD-13.

**Rule:** "las tablas... llevan columna `user_id uuid`... e `id uuid default gen_random_uuid()`... Las entidades TypeScript... no exponen `userId`."

Nótese: para `id` la Rule especifica el mecanismo (`default gen_random_uuid()`). Para `user_id` solo dice que la columna existe — no dice `default auth.uid()`.

**Implementación A:** agrega `user_id uuid not null default auth.uid()` a la columna. Consecuencia: el `Api*Repository.create()` hace un `insert` que nunca menciona `user_id` en ningún punto del código de aplicación — el valor lo resuelve Postgres a partir del JWT de la sesión. Cero código de aplicación toca `user_id`, en cualquier punto, para siempre.

**Implementación B:** deja `user_id uuid not null` sin default (la Rule no lo prohíbe ni lo exige). Sin default, un `insert` que no incluya `user_id` viola `NOT NULL` (o la policy `WITH CHECK`) y falla. Para que `create()` funcione, el desarrollador de la Implementación B agrega dentro de `Api*Repository.create()` una llamada a `supabase.auth.getUser()` y arma el payload de insert incluyendo `user_id: user.id` manualmente. Esto **no pasa `userId` como parámetro del método de la interfaz** (sigue siendo `create(data: Omit<Entity, 'id'|'createdAt'|'updatedAt'>)`), así que cumple la Rule de AD-13 al pie de la letra — pero reintroduce exactamente la clase de responsabilidad que AD-13 quiere sacar de la aplicación: ahora hay una línea de código de infraestructura responsable de setear el tenant scope. Un futuro `create()` de una nueva entidad (o un fix apurado) que se olvide de esa línea no falla de forma obvia — dependiendo de si la policy tiene `WITH CHECK` estricto, puede fallar en runtime (mejor caso) o, si algún día se relaja la policy, escribir con `user_id NULL`/incorrecto (peor caso).

**Por qué es un hueco real:** el tipo generado por `supabase gen types typescript` (AD-12) hace explícita esta divergencia — si la columna tiene default, el campo `user_id` es *opcional* en `Database['public']['Tables']['transactions']['Insert']`; si no tiene default, es *requerido*, y el compilador obliga a la Implementación B a suplirlo desde algún lado. Dos desarrolladores leyendo solo AD-18 llegan a dos arquitecturas de escritura incompatibles, una de las cuales reabre el riesgo de AD-13.

**Bonus (mismo AD, hueco menor pero relacionado):** AD-18 tampoco dice nada sobre `created_at`/`updated_at`. AD-7 heredado (vía su convención `Omit<Entity, 'id'|'createdAt'|'updatedAt'>`) implica que hoy el Mock las asigna en código (`new Date()`). Nada en AD-18 dice si en la rama `api` esas columnas pasan a ser `default now()` + trigger de Postgres (fuente de verdad en DB, consistente con el tratamiento que sí se le da a `id`) o si el `Api*Repository` las sigue seteando con el reloj de la app (riesgo de clock skew, inconsistente con el resto de AD-18). Ninguna migración de ejemplo ni el Structural Seed lo resuelve.

**Severidad:** alta — no es un bug de seguridad garantizado como el Hallazgo 1, pero es una ambigüedad de construcción concreta con impacto de seguridad potencial, verificable por dos lecturas razonables del mismo texto.

**Recomendación:** AD-18 debería fijar explícitamente `user_id uuid not null default auth.uid()` (o el mecanismo equivalente) como parte de la Rule, no dejarlo implícito, y decidir explícitamente el mecanismo de `created_at`/`updated_at`.

---

## Hallazgo 3 — ALTO — AD-16 ("un solo proyecto, dev = prod") no resuelve qué significa "desarrollo local", y no menciona Vercel Preview Deployments

**AD atacado:** AD-16, en interacción no resuelta con AD-10 (Vercel).

**Rule:** "existe un único proyecto Supabase, usado tanto en desarrollo local como en producción (Vercel). No hay proyecto de staging separado."

**Implementación A:** interpreta "desarrollo local" como *Supabase CLI local* (`supabase start`, stack de Postgres en Docker), aplicando las migraciones de `supabase/migrations/` contra esa instancia local, y solo hace `supabase db push` contra el proyecto remoto compartido al deployar. `.env.local` apunta a `http://localhost:54321` con las claves locales de desarrollo.

**Implementación B:** interpreta la Rule literalmente — "un único proyecto... usado tanto en desarrollo local como en producción" significa que no existe una instancia local separada: `.env.local` apunta directamente a las credenciales del proyecto Supabase remoto compartido. Cada `npm run dev` local lee y escribe sobre los datos reales de producción.

Ambas son lecturas defendibles del mismo texto, con consecuencias muy distintas (B implica que probar borrar una transacción localmente borra una transacción real).

**Gap adicional no cubierto por ningún AD:** Vercel, por default, crea un **Preview Deployment** por cada push a una rama que no es la de producción, cada uno con su propia URL pública. AD-10 fija "Vercel Hobby" pero no dice nada sobre el comportamiento de Preview Deployments; AD-16 fija "un solo proyecto compartido" pero no dice si las variables de entorno de Supabase están scoped a "Production" únicamente en el dashboard de Vercel o si también se propagan a "Preview"/"Development" (comportamiento default de Vercel: las env vars marcadas para "All Environments" se replican automáticamente en cada preview). Si un desarrollador sigue la Rule de AD-16 al pie de la letra ("un único proyecto... usado tanto en desarrollo local como en producción") y configura las env vars de Supabase como compartidas en Vercel, **cualquier rama con una feature a medio terminar obtiene, en su URL de preview pública, acceso de lectura/escritura a la base de datos real**, sin que ningún AD lo haya decidido explícitamente.

**Severidad:** alta — no es una falla de seguridad tan directa como el Hallazgo 1 (requiere que alguien abra la preview URL), pero es un vector de corrupción/exposición de datos reales completamente no contemplado, agravado por AD-16 mismo (no hay ambiente de staging donde "probar" sin miedo).

**Recomendación:** AD-16 debería especificar explícitamente el mecanismo de desarrollo local (CLI local vs. conexión directa al proyecto remoto) y un AD nuevo (o una cláusula en AD-10) debería fijar el scope de env vars en Vercel para Preview Deployments — como mínimo, decidir si Preview Deployments comparten el proyecto Supabase de prod o si se bloquean/deshabilitan.

---

## Hallazgo 4 — MEDIO — AD-12 exige generar `database.types.ts` pero no exige regenerarlo, ni conectarlo al cliente, ni verificar que esté al día

**AD atacado:** AD-12, en interacción con AD-17.

**Rule:** "Los tipos de fila se generan con `supabase gen types typescript` hacia `src/lib/supabase/database.types.ts`."

**Implementación A:** corre `supabase gen types typescript` cada vez que agrega una migración (disciplina personal, no exigida por ningún AD), y usa `createServerClient<Database>(...)` / `createBrowserClient<Database>(...)` pasando el tipo `Database` generado como generic, de forma que cualquier `.from('transactions').select()` está tipado end-to-end contra el esquema real.

**Implementación B:** genera el archivo una única vez, al principio del epic (cumple la Rule: el archivo existe, fue generado con el comando indicado), pero nunca lo vuelve a correr tras migraciones posteriores (AD-17 no lo obliga: "todo cambio de esquema... se declara con `migration new`... y se aplica con `db push`" no dice nada sobre types). Además, nunca conecta el generic `Database` al cliente (la Rule de AD-12 solo dice que "los tipos se generan", no que el cliente los use) — usa `createServerClient(url, key)` sin generic, y define a mano interfaces TypeScript paralelas dentro de cada `Api*Repository` que coinciden con el esquema *original* pero divergen silenciosamente después de la segunda migración (columna renombrada, nueva columna nullable, etc.). El código compila igual, porque el generic nunca estuvo conectado — el archivo `database.types.ts` es, en la práctica, decorativo.

**Por qué es un hueco real:** ninguna de las dos implementaciones viola una palabra de la Rule. No hay mandato de (a) regenerar tipos como paso obligatorio post-migración, (b) usar el generic `Database` en `createServerClient`/`createBrowserClient` — sin eso, AD-12 no compra ninguna seguridad de tipos real —, ni (c) un check en CI que compare el hash/timestamp de la última migración contra la última regeneración de `database.types.ts`.

**Severidad:** media — no es un riesgo de seguridad, es un riesgo de mantenibilidad/drift que se vuelve doloroso exactamente cuando el esquema cambia (que es, dado AD-17, algo que va a pasar).

**Recomendación:** AD-12 debería exigir explícitamente que `server.ts`/`client.ts` instancien el cliente con el generic `Database`, y que la regeneración de tipos sea un paso obligatorio del mismo flujo que `supabase db push` (o un check de CI).

---

## Hallazgo 5 — MEDIO — AD-14 asigna "refrescar el token" a `middleware.ts` pero no asigna "proteger rutas" a nadie

**AD atacado:** AD-14.

**Rule:** "se agrega `middleware.ts`... que usa `@supabase/ssr`... para refrescar el token de auth en cada request... `factory.ts` construye el cliente autenticado... y lo inyecta en cada `Api*Repository` — ningún `actions.ts` crea su propio cliente de Supabase directamente."

Esto fija con precisión *quién refresca el token* y *quién construye el cliente para los repositorios*. No fija *quién decide si un usuario no autenticado puede ver una página*, que es una decisión de arquitectura distinta (dónde vive el gate de autorización de rutas).

**Implementación A:** implementa el patrón estándar de `@supabase/ssr` con Next.js: el `middleware.ts` no solo refresca el token, sino que además chequea `supabase.auth.getUser()` y redirige a `/login` si no hay sesión, con un `matcher` que cubre todas las rutas protegidas. La UI nunca se renderiza para un usuario no autenticado.

**Implementación B:** interpreta la Rule de forma más angosta — `middleware.ts` *solo* refresca el token (que es literalmente lo único que la Rule le manda a hacer: "para refrescar el token de auth en cada request"), sin matcher de protección ni redirect. Las páginas (Server Components) se renderizan igual para cualquiera; el único punto donde la ausencia de sesión se manifiesta es dentro de cada Server Action, cuando el `Api*Repository` intenta hacer una query y RLS devuelve cero filas (porque `auth.uid()` es null) o Supabase Auth rechaza la operación. El usuario no autenticado ve la UI completa (con datos vacíos, no con un error claro), y solo al intentar crear una transacción obtiene un error genérico.

**Por qué es un hueco real:** ambas cumplen la Rule de AD-14 (el middleware refresca el token en cada request; factory.ts es la única fuente del cliente para los repos). La diferencia es un modelo de autorización de rutas completamente distinto — UX y postura de seguridad "fail open en la vista, fail closed en la escritura" (B) vs. "fail closed en la vista" (A) — que ningún AD decide. El Deferred del documento excluye explícitamente "UI de login/registro" pero el gate de rutas protegidas no es UI, es una decisión de dónde vive la autorización, directamente adyacente a AD-14.

**Severidad:** media — no es una fuga de datos entre usuarios (eso lo sigue cubriendo RLS si el Hallazgo 1 está resuelto), pero es una divergencia de arquitectura real entre dos implementaciones igualmente conformes, con impacto de UX y de superficie de exposición (páginas que revelan estructura/estado de la app a usuarios anónimos).

**Recomendación:** decidir explícitamente en AD-14 (o un AD-19) si la protección de rutas vive en `middleware.ts` (matcher + redirect) o en cada Server Component, y si el Deferred de "UI de login" cubre también esta decisión (no debería — el gate no es una pantalla, es un mecanismo).

---

## Hallazgo 6 — BAJO/MEDIO — AD-12 no impide mover cálculo derivado a Postgres vía `.rpc()`, lo que violaría AD-5 heredado sin violar AD-12

**AD atacado:** AD-12, en interacción con AD-5 heredado del spine padre.

**Rule de AD-12:** "todo `Api*Repository` usa exclusivamente `@supabase/supabase-js`... Ningún ORM... se agrega."

**Implementación A:** el `Api*Repository` hace solo lecturas/escrituras planas (`select`, `insert`, `update`, `delete`) fila por fila; todo cálculo de `isNearLimit`, `isOverBudget`, balance, variación mensual, sigue viviendo en los usecases existentes (`GetBudgetStatusUseCase`, etc.), tal como manda AD-5 heredado.

**Implementación B:** para "aprovechar Postgres" y evitar traer todas las filas a Node para sumar, crea una función SQL (`get_monthly_balance(user_id_param uuid)`) y la llama vía `supabase.rpc('get_monthly_balance', {...})` desde `Api*Repository`. Esto sigue siendo, literalmente, "usar exclusivamente `@supabase/supabase-js`" (el método `.rpc()` es parte del mismo SDK, no un ORM) — cumple AD-12 al pie de la letra — pero mueve un cálculo derivado (balance) a la base de datos, violando AD-5 heredado ("todo cálculo derivado... se implementa en un usecase... ningún componente recalcula estas métricas" — aquí ni siquiera es un componente, es la propia infraestructura recalculando fuera de la capa de usecases).

**Por qué es un hueco real:** AD-12 define la herramienta permitida (supabase-js, no ORM) pero no la superficie permitida de esa herramienta (`.from()` sí, `.rpc()` con lógica de negocio no). Nada en el spine cierra explícitamente esta puerta, y es una tentación de performance real y previsible.

**Severidad:** baja/media — probable que ocurra recién cuando el dataset crezca lo suficiente para que alguien lo "optimice", pero cuando ocurra, el spine no tiene ninguna cláusula que lo prohíba citando el AD correcto (alguien podría defender el RPC citando AD-12 como habilitante).

**Recomendación:** aclarar en AD-12 o AD-5 que `.rpc()` está permitido solo para operaciones puramente de persistencia (ninguna lógica de negocio/derivación en funciones Postgres), o prohibirlo explícitamente.

---

## Hallazgos menores (no desarrollados en detalle)

- **AD-10 / .github/workflows/:** la Rule fija el host (Vercel Hobby) pero no dice si el deployment ocurre vía integración nativa Git↔Vercel (sin workflow) o vía un workflow de GitHub Actions que corre su propio build y `vercel deploy`. Dos implementaciones válidas producen pipelines de CI/CD incompatibles (con o sin secrets duplicados entre GitHub Actions y Vercel Env Vars).
- **AD-15 / ubicación de scripts admin:** la Rule permite que un script puntual use `service_role` "localmente", pero no fija dónde vive ese script en el repo. Si termina bajo `src/` (p. ej. `src/lib/supabase/admin.ts`, junto a `server.ts`/`client.ts`), nada impide estructuralmente que un futuro `actions.ts` lo importe por error, reabriendo exactamente el riesgo que AD-15 previene.
- **AD-3 heredado (no-singleton) vs. AD-14:** AD-14 no repite ni referencia la restricción heredada de AD-3 ("la implementación real no asume estado compartido entre llamadas"). Un desarrollador que solo lea el AD nuevo (AD-14) podría memoizar el cliente Supabase a nivel de módulo "por performance", lo cual en un runtime serverless con instancias tibias reutilizadas podría filtrar la sesión de un usuario a la request de otro. La restricción ya existe en el spine padre, pero AD-14 no la refuerza donde más aplica (instanciación del cliente autenticado).

---

## Resumen de severidades

| # | AD(s) | Severidad | Resumen |
| --- | --- | --- | --- |
| 1 | AD-13 × AD-15 × AD-17 | **Crítica** | RLS puede quedar sin habilitar/sin policies mientras la interfaz cumple "no `userId` como parámetro" — tablas abiertas con el anon key "seguro" |
| 2 | AD-18 × AD-13 | **Alta** | Sin `default auth.uid()` explícito en `user_id`, una implementación reintroduce el seteo de tenant scope en código de infraestructura |
| 3 | AD-16 × AD-10 | **Alta** | "Un solo proyecto" no resuelve dev local vs. remoto, ni el comportamiento de Vercel Preview Deployments contra datos reales |
| 4 | AD-12 × AD-17 | Media | Tipos generados sin obligación de regenerar, sin conectar el generic al cliente, sin check de drift |
| 5 | AD-14 | Media | Refresh de token asignado a middleware; protección de rutas no asignada a nadie |
| 6 | AD-12 × AD-5 heredado | Baja/Media | `.rpc()` permite mover cálculo derivado a Postgres sin violar la letra de AD-12 |
