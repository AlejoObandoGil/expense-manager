# Review — ARCHITECTURE-SPINE.md (Backend Real, Auth y Deployment — expense-manager-1.0)

**Reviewer role:** revisor independiente de arquitectura (rubric walker)
**Documento revisado:** `_bmad-output/planning-artifacts/architecture/architecture-expense-manager-1.0-2026-08-17/ARCHITECTURE-SPINE.md`
**Contra:** spine padre `architecture-proyectos-2026-08-16/ARCHITECTURE-SPINE.md`, memlog de la sesión de coaching, y checklist de "good spine" provisto por el usuario.
**Fecha de revisión:** 2026-08-17. Verificación técnica hecha con búsquedas web en vivo (no de memoria).

---

## Veredicto

El spine es sólido en su núcleo de seguridad multi-usuario (AD-13/AD-18) y en la elección de hosting/DB (verificación de datos correcta y actual), pero tiene un **hueco crítico en el envolvente operacional**: no exige habilitar RLS por tabla como parte del contrato (la única barrera real contra el "bug más caro posible" queda fuera del spine), y aplica de forma inconsistente el criterio de "no dormir por inactividad" que usó para descartar Render al elegir Supabase, cuyo free tier tiene exactamente ese problema (pausa a los 7 días) sin backups — nada de esto está decidido, diferido, ni marcado como pregunta abierta.

**Recomendación:** no bloquear el epic, pero requerir una revisión antes de Finalize: agregar el AD faltante sobre "RLS enabled + policy obligatorios por migración" y resolver (decidir o diferir explícitamente) el riesgo de auto-pause/backups de Supabase free tier.

---

## Hallazgos por severidad

### 1. [CRITICAL] AD-13 no exige que RLS esté *habilitado* — solo prohíbe pasar `userId` como parámetro

**Dónde:** AD-13 (líneas 72–76), AD-17 (líneas 96–100), AD-18 (líneas 102–106).

AD-13 dice explícitamente que previene "el bug de seguridad más caro posible en este proyecto": un `Api*Repository` que filtre datos de otro usuario. Pero la Rule solo constriñe la *firma* de las interfaces (`ningún método... recibe userId`). En Postgres, RLS es **opt-in por tabla** — una tabla sin `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (o sin `CREATE POLICY`) devuelve todas las filas a cualquier cliente autenticado con la anon key, sin importar que el código de la app nunca haya tocado `userId`. AD-17 (migraciones vía Supabase CLI) no incluye ningún requisito de que toda migración de tabla nueva habilite RLS + cree la policy correspondiente antes de mergear. AD-18 menciona la columna `user_id` "requerida por AD-13 para que RLS sea performante" pero da por sentado que RLS ya está encendida, sin fijarlo como Rule.

Resultado: dos stories que agreguen tablas nuevas (o una migración de `budgets` sin la policy) pueden divergir exactamente en el eje que AD-13 dice cerrar, y nada en este spine lo detectaría — ni un lint, ni un checklist, ni una convención de migración. Esto viola directamente el criterio del checklist "cada AD tiene una Rule enforceable que realmente previene la divergencia que dice prevenir".

**Sugerencia:** añadir a AD-13 o como AD nuevo: "toda migración que crea una tabla nueva bajo `supabase/migrations/` debe incluir `ENABLE ROW LEVEL SECURITY` y al menos una `CREATE POLICY` en el mismo archivo; ninguna tabla queda sin RLS habilitada antes de mergear" — idealmente con un mecanismo de verificación (script que consulte `pg_tables.rowsecurity`, o checklist de PR).

### 2. [HIGH] Envolvente operacional: el spine aplica el criterio "no dormir por inactividad" a Vercel pero no a Supabase, que sí lo tiene

**Dónde:** AD-10 (líneas 54–58) vs. AD-11/AD-16 (líneas 60–64, 90–94).

AD-10 descarta explícitamente Render como hosting porque "sus free web services duermen tras 15 min de inactividad". Es un criterio de descarte real y bien aplicado — para hosting. Pero Supabase, elegido en AD-11 y usado como único proyecto dev=prod en AD-16 (sin staging, uso personal, tráfico probablemente esporádico), tiene un comportamiento equivalente documentado oficialmente por Supabase: **los proyectos Free se pausan tras ~7 días de baja actividad** (restaurables desde el dashboard, pero con downtime real hasta que alguien lo note y lo reactive). Verificado en `supabase.com/docs/guides/platform/free-project-pausing`, referenciado también en el propio "Production Checklist" de Supabase (`supabase.com/docs/guides/deployment/going-into-prod`), que recomienda pasar a Pro "para garantizar que no pausen tu proyecto por inactividad".

Ni AD-11 ni AD-16 ni la sección Deferred mencionan este riesgo — a pesar de que el spine sí investigó y verificó fuentes de Supabase (`supabase.com/docs/guides/auth/server-side/nextjs`, `.../row-level-security`) y de que el mismo documento demuestra que sabe reconocer "duerme por inactividad" como un descalificador (lo usó contra Render). Es una dimensión del envolvente operacional dejada en silencio absoluto, no decidida ni diferida — exactamente el tipo de hallazgo que el checklist pide vigilar en especial.

**Sugerencia:** como mínimo, un ítem en Deferred reconociendo el riesgo y la mitigación aceptada (ej. "aceptamos el riesgo de auto-pause en free tier; si ocurre, se reactiva manualmente desde el dashboard; revisitar si el proyecto necesita disponibilidad garantizada").

### 3. [HIGH] Ausencia total de estrategia de backups/disaster recovery

**Dónde:** todo el documento; ausente de Deferred.

El spine define un único proyecto Supabase compartido dev=prod (AD-16), sin ambiente de staging, para una app de finanzas personales con datos reales de transacciones. El free tier de Supabase (verificado, aunque no vía fetch directo del checklist de producción de Supabase) es conocido por no incluir backups automáticos/point-in-time-recovery en el plan Free. No hay AD, no hay Deferred, no hay pregunta abierta sobre qué pasa si una migración mal escrita corrompe datos, o si el usuario borra una transacción por error — no hay export/backup manual documentado ni plan de recuperación. Esto es una dimensión completa del envolvente operacional dejada en silencio.

**Sugerencia:** al menos un ítem Deferred explícito ("sin backups automáticos en free tier; mitigación manual: X; revisitar si se sube a Pro").

### 4. [MEDIUM] AD-15 es la única Rule "de seguridad" del documento sin mecanismo de enforcement en código

**Dónde:** AD-15 (líneas 84–88), comparado con AD-2 heredado (server-only) y AD-13 (firma de interfaz).

AD-2 (heredado) fuerza su invariante con `import 'server-only'`, que rompe el build ante una violación — un guardrail de código real. AD-13 fuerza la suya vía la firma de las interfaces `IXRepository` (no se puede pasar lo que la interfaz no acepta). AD-15, en cambio, depende enteramente de una convención administrativa ("no se define la env var en Vercel") sin ningún guardrail de código — nada impide que alguien defina `SUPABASE_SERVICE_ROLE_KEY` en Vercel el día de mañana (ej. copiando un ejemplo de internet, que es literalmente el escenario que el "Prevents" describe) y que `factory.ts` empiece a usarla sin que nada lo detecte en build ni en CI.

**Sugerencia:** agregar una guarda de código, ej. en `factory.ts` o en un módulo de arranque: `if (process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error(...)`, o un check de CI que grep-ee el repo por referencias a `SERVICE_ROLE_KEY`.

### 5. [MEDIUM] Vercel Preview Deployments no está resuelto contra AD-16 (single project dev=prod)

**Dónde:** AD-16 (líneas 90–94), AD-10 (líneas 54–58), Deferred (líneas 152–157).

Vercel, en su flujo estándar con integración de GitHub (que este proyecto ya usa, a juzgar por `.github/workflows/` mencionado en AD-10), genera automáticamente un Preview Deployment por cada PR/branch. AD-16 fija un único proyecto Supabase para dev y prod, pero no dice qué le pasa a un Preview Deployment: ¿usa las mismas env vars que producción (con lo cual un PR de prueba escribe contra datos reales) o no tiene env vars (con lo cual todo preview de una story que toque `Api*Repository` falla)? Es un punto real de divergencia entre stories no fijado en ningún lado — ni AD, ni Deferred.

**Sugerencia:** decidir explícitamente (ej. "Preview Deployments deshabilitados" o "Preview Deployments comparten el proyecto Supabase de prod, aceptando el riesgo por ser proyecto personal") o diferir con justificación como se hizo con staging en AD-16.

### 6. [LOW] Storage de recibos: citado como justificación de AD-11 pero ni decidido ni diferido

**Dónde:** AD-11 (línea 64: "...el usuario quiere login y potencialmente adjuntar archivos (recibos) sin sumar otro servicio").

AD-11 usa el soporte de Storage de Supabase como parte de la justificación para elegirlo sobre Neon. Pero el scope del spine (línea 7) no incluye attachments, y no hay ningún ítem en Deferred que reconozca esto como una dimensión fuera de alcance para este epic. No es grave — el scope explícito ya excluye la feature — pero dejar la justificación de un AD apoyada en una capacidad que el propio documento nunca decide ni difiere es una inconsistencia menor de higiene documental: alguien leyendo solo AD-11 podría asumir que el bucket/RLS de storage ya está resuelto en algún lado.

**Sugerencia:** una línea en Deferred: "Estrategia de Supabase Storage para recibos (buckets, RLS de `storage.objects`) — fuera de alcance de este epic, se resuelve cuando se implemente la feature de adjuntos."

### 7. [LOW] Convención heredada de manejo de errores no reconciliada con el estilo de `supabase-js`

**Dónde:** Consistency Conventions heredadas (spine padre, "State & cross-cutting") vs. AD-14/AD-13 de este spine.

La convención heredada asume un modelo de "excepciones de repositorio se capturan y se mapean a un mensaje curado". `@supabase/supabase-js` no lanza excepciones en el camino normal: devuelve `{ data, error }`. Nada en este spine reconcilia explícitamente ese cambio de modelo (¿cada `Api*Repository` debe `throw` manualmente cuando `error` no es null, para preservar la convención heredada? ¿o la convención heredada se reinterpreta?). Es un punto de divergencia real y pequeño: dos `Api*Repository` (transactions, categories, budgets) podrían implementar el mapeo de error de forma distinta sin que el spine lo note.

**Sugerencia:** una línea en Consistency Conventions o en AD-12: "todo método de `Api*Repository` que reciba `{ error }` no-nulo de supabase-js lo convierte en `throw` inmediatamente, preservando la convención heredada de captura/mapeo en el borde."

---

## Checklist — resultado punto por punto

| Criterio | Resultado |
| --- | --- |
| Fija los puntos reales de divergencia para stories, sin que se le escape ninguno | **Falla parcialmente** — ver hallazgos 1, 5, 6, 7 |
| Cada AD tiene una Rule enforceable que realmente previene la divergencia que dice prevenir | **Falla en AD-13 (hallazgo 1) y AD-15 (hallazgo 4)**; el resto (AD-10 a AD-12, AD-14, AD-16 a AD-18) está bien |
| Nada en "Deferred" podría dejar que dos unidades diverjan sin darse cuenta | **Aceptable** para lo que sí está en Deferred; el problema es lo que *falta* de Deferred (hallazgos 2, 3, 5, 6) |
| La tecnología nombrada está verificada como actual (no asumida de memoria) | **Pasa** — verificado en vivo: `@supabase/supabase-js@2.112.3` y `@supabase/ssr@0.12.4` son las versiones actuales en npm; límites de Vercel Hobby (100GB fast data transfer) correctos; límites de Supabase free tier (500MB DB, 50K MAU, 1GB storage, 2 proyectos) correctos; descarte de Railway ($1 crédito/mes) y Render (Postgres free expira a 30 días) correctos. La única brecha de verificación es que no se investigó/reportó el auto-pause de Supabase (hallazgo 2), a pesar de haber consultado fuentes oficiales de Supabase para otros temas. |
| Si hereda un spine padre, ningún AD nuevo debilita o contradice uno heredado | **Pasa** — el único caso límite es el override de AD-7 (crypto.randomUUID → gen_random_uuid), pero está declarado explícitamente en la tabla de Inherited Invariants con justificación, no es una contradicción silenciosa. AD-3 padre (firma async del factory) resulta coherente con la necesidad real de este epic (cliente autenticado por request vía cookies) |
| Cada dimensión de esta altitude está decidida/diferida/marcada como pregunta abierta, especialmente el envolvente operacional | **Falla** — backups/DR (hallazgo 3), auto-pause (hallazgo 2), y preview deployments (hallazgo 5) son dimensiones operacionales completas dejadas en silencio |

---

## Nota metodológica

Verificación técnica realizada con búsquedas web en vivo el 2026-08-17 contra: npm (`@supabase/supabase-js`, `@supabase/ssr`), `vercel.com/docs/plans/hobby` (vía fuentes agregadas), `supabase.com/docs/guides/platform/free-project-pausing`, `supabase.com/docs/guides/deployment/going-into-prod`, y fuentes agregadas sobre límites de Render/Railway. No se re-verificaron independientemente todas las afirmaciones de Netlify/Cloudflare Workers citadas en AD-10 (menor prioridad, no son la opción elegida).
