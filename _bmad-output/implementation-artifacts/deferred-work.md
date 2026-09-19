- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-auth-foundation-and-server-side-session.md`
  summary: Los Server Actions (`app/**/actions.ts`) no verifican sesión/autorización por sí mismos, dependiendo únicamente de `proxy.ts` para el gate de acceso.
  evidence: La documentación vendida de Next.js en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (línea ~213) advierte explícitamente que un matcher de Proxy que excluye una ruta también salta las llamadas a Server Functions en esa ruta, y recomienda verificar auth dentro de cada Server Function en vez de confiar solo en Proxy. La arquitectura de este epic (AD-13/AD-18) delega el aislamiento por usuario a RLS en Postgres — que sí protegería los datos incluso si un Server Action se invocara sin pasar por `proxy.ts` — pero no hay una capa de defensa explícita a nivel de Server Action documentada como aceptada. Vale una revisión enfocada cuando existan Server Actions reales contra Supabase (Stories 4.2-4.4) para confirmar que RLS por sí solo es suficiente o si se necesita un chequeo de sesión explícito también ahí.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-persist-transactions-via-supabase-with-rls.md`
  summary: Confirmado con `ApiTransactionRepository` real: sin chequeo de sesión explícito, un caller sin sesión válida falla profundo dentro de una violación NOT NULL/RLS en el round-trip a la DB en vez de recibir un error "no autenticado" claro desde la capa de aplicación.
  evidence: Hallazgo del reviewer `blind-hunter` en la revisión de la Historia 4.2 — reconfirma y da evidencia concreta a la preocupación ya registrada arriba para spec-4-1, ahora que existe un repositorio `api` real contra el que probarla.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-persist-transactions-via-supabase-with-rls.md`
  summary: La FK `user_id references auth.users(id)` en la migración de `transactions` no define `ON DELETE` (ni `CASCADE` ni `SET NULL`), así que borrar un usuario de `auth.users` fallará o dejará la FK en estado indefinido.
  evidence: Hallazgo de `blind-hunter`/`edge-case-hunter` en la revisión de la Historia 4.2. No hay feature de borrado de cuenta en la app todavía, así que no es bloqueante para 4.2, pero debe resolverse (probablemente `on delete cascade`) antes de construir esa feature.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-persist-transactions-via-supabase-with-rls.md`
  summary: No hay constraint ni convención documentada sobre si `amount` es siempre positivo (con `type` indicando la dirección) o puede ser negativo — el modelo viene de los mocks sin esa definición explícita.
  evidence: Hallazgo de `blind-hunter`. Relevante para que los cálculos de balance/presupuesto (Epic 3, `GetBudgetStatusUseCase`) no inviertan ni dupliquen ingresos vs gastos a medida que la persistencia real reemplace a los mocks.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-persist-transactions-via-supabase-with-rls.md`
  summary: `findAll`/`findByDateRange`/`findByCategory`/`findByType` en `ApiTransactionRepository` no aceptan paginación/límite — cada uno hace un `select('*')` sin acotar.
  evidence: Hallazgo de `blind-hunter`. Limitación preexistente de la interfaz `ITransactionRepository` (el Mock tampoco pagina), pero solo se vuelve un problema real de escala una vez que usuarios reales acumulen historial en Postgres en vez de en memoria.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-persist-transactions-via-supabase-with-rls.md`
  summary: Solo `user_id` tiene índice en `transactions`; los filtros por `category_id`, `type` y `date` (usados por `findByCategory`/`findByType`/`findByDateRange`) no tienen índice compuesto de soporte.
  evidence: Hallazgo de `blind-hunter`, consistente con el único hallazgo INFO de `mcp__supabase__get_advisors` (performance) sobre `transactions_user_id_idx` sin uso — esperado en una tabla vacía recién creada; revisar cuando haya volumen real de datos.

- source_spec: none
  summary: `src/app/categories/actions.ts` es un archivo de server actions huérfano/duplicado de `src/app/actions/categories.ts` (el que realmente se importa desde `categories/page.tsx` y `transactions/page.tsx`) — nadie lo importa, tiene validación Zod más laxa (sin regex hex para color) y expone `getCategoriesByType`, que el canon no tiene.
  evidence: Hallazgo de investigación durante la planificación de la Historia 4.3. Se decidió explícitamente no tocarlo en esa historia para no ampliar su alcance; queda como candidato de limpieza (decidir cuál es el canon y borrar/reconciliar el otro).

- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-persist-categories-via-supabase-with-rls.md`
  summary: Eliminar el campo vestigial `budget?: number` de `Category` (`domain/entities/category.ts`) y ajustar `src/app/categories/page.tsx:61,116`, que hoy dependen de un fallback `cat.budget || 1000` que siempre dispara porque ninguna categoría mock define ese campo — el presupuesto real ya vive en `IBudgetRepository`/`Budget` (Epic 3).
  evidence: Se dividió de la Historia 4.3 para acotar el tamaño del spec (~2400 tokens estimados, por encima del rango sugerido de 900-1600) a un solo objetivo cohesivo: persistencia de categorías + seed en signup. La limpieza de `budget` es un cambio independiente y separable — no bloquea ni depende de la migración/repositorio de categorías.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-persist-categories-via-supabase-with-rls.md`
  summary: `transactions.category_id` sigue siendo `text` sin FK a `categories.id` (`uuid`) ahora que la tabla `categories` existe — la migración de `transactions` explícitamente difirió esto "hasta que exista `categories`" (Historia 4.3), pero conectar la FK real requeriría migrar el formato de `category_id` (hoy strings tipo `"cat-1"` en mocks vs. UUIDs reales), fuera del alcance de esta historia.
  evidence: Hallazgo convergente de `blind-hunter` y `verification-gap` en la revisión de la Historia 4.3. Sin esta FK, no hay integridad referencial entre transacciones y categorías — vale resolverlo cuando se migren datos reales o se aborde la Historia 4.4 (presupuestos, que también referencia categorías).

- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-persist-categories-via-supabase-with-rls.md`
  summary: `categories.user_id references auth.users(id)` no define `ON DELETE` (mismo gap ya registrado para `transactions.user_id`) — borrar un usuario de `auth.users` fallará por violación de FK en vez de resolverse limpiamente.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 4.3, consistente con el gap ya documentado para `transactions`. Sin feature de borrado de cuenta todavía, no es bloqueante; ambas tablas deberían resolverse juntas (probablemente `on delete cascade`) cuando se construya esa feature.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-persist-budgets-via-supabase-with-rls.md`
  summary: `budgets.category_id references public.categories(id)` no define `ON DELETE` — borrar una categoría que tiene un presupuesto asociado falla con una violación de FK cruda (`23503`) en vez de un mensaje claro. `ApiCategoryRepository.delete()` (`src/infrastructure/repositories/api-category.repository.ts`) tampoco distingue ese código de error del genérico, así que el usuario recibe "No se pudo eliminar la categoría." sin indicar que la causa real es el presupuesto asociado.
  evidence: Hallazgo convergente de `blind-hunter` y `verification-gap` en la revisión de la Historia 4.4, mismo patrón ya aceptado para `transactions.user_id`/`categories.user_id` (ambos sin `ON DELETE`). `deleteCategory` ya existe como Server Action pero no está conectado a ninguna UI todavía, así que no es bloqueante hoy; resolver junto con los otros gaps de `ON DELETE` cuando se aborde borrado en cascada.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-persist-budgets-via-supabase-with-rls.md`
  summary: La migración de `budgets` no tiene `check` de rango en `year` (a diferencia de `month`, que sí tiene `check (month between 1 and 12)`), y `createBudgetSchema` en `src/app/budgets/actions.ts` solo valida `year >= 1900` sin límite superior — un año absurdo (ej. `999999`) pasa validación end-to-end.
  evidence: Hallazgo convergente de `blind-hunter` y `edge-case-hunter` en la revisión de la Historia 4.4. Bajo impacto (el usuario solo se perjudicaría a sí mismo con datos inconsistentes), pero agregar el `check` requeriría una nueva migración con el mismo gate de confirmación humana antes de aplicar — se deja fuera del alcance de esta historia.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-persist-budgets-via-supabase-with-rls.md`
  summary: `src/app/budgets/actions.ts` (no tocado por la Historia 4.4) tiene dos gaps de validación preexistentes que se vuelven más relevantes ahora que `budgets.category_id` es un `uuid` real: `createBudgetSchema.categoryId` solo valida `z.string().min(1)` sin `.uuid()`, así que un id malformado falla profundo en Postgres (`22P02`) y se traduce al mensaje genérico de `ApiBudgetRepository` en vez de un error de validación claro; y `updateBudgetSchema` solo expone `amount`/`spent`, así que no hay forma de corregir la categoría/mes/año de un presupuesto existente sin borrar y recrearlo, aunque `ApiBudgetRepository.updateBudget`/`IBudgetRepository` sí lo soportan.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 4.4. Ninguno de los dos archivos de acciones fue tocado por esta historia (spec explícitamente los referencia solo como confirmación de que `spent` es input manual), así que no es una regresión de este cambio — pero vale resolver junto con un futuro ajuste de `actions.ts`.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-persist-budgets-via-supabase-with-rls.md`
  summary: `GetBudgetStatusUseCase.execute()` (`src/domain/usecases/budgets/get-budget-status.ts`, Epic 3, fuera de alcance para esta historia) lanza un `Error` en inglés sin curar (`Budget not found for category...`) cuando `getBudgetForCategory` retorna `null` — ese mensaje crudo se propaga tal cual a través de `getBudgetStatus` en `actions.ts` hasta la UI. Con datos mock esto casi nunca se disparaba (3 presupuestos fijos); con persistencia real, cualquier categoría de un usuario nuevo sin presupuesto todavía lo dispara como caso común de "primer uso".
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 4.4. El bug es preexistente de Epic 3 y la spec de esta historia prohíbe explícitamente modificar `GetBudgetStatusUseCase` — se deja registrado para resolverlo en una historia futura que sí toque ese use case.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-5-minimal-login-and-signup-ui.md`
  summary: El logout de `desktop-sidebar.tsx` no revisa el `error` que puede devolver `supabase.auth.signOut()` (navega a `/login` igual) y el botón "Salir" no se deshabilita durante el `await`, permitiendo doble click concurrente.
  evidence: Hallazgo convergente de `blind-hunter` y `edge-case-hunter` en la revisión de la Historia 4.5. La matriz I/O congelada de la historia solo especifica el camino feliz de logout ("`signOut()` limpia sesión, redirect a `/login`"), sin manejo de error, así que agregarlo ahora sería exceder el alcance mínimo aprobado; vale resolverlo la próxima vez que se toque ese componente.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-5-minimal-login-and-signup-ui.md`
  summary: Convertir `src/presentation/components/shared/layout.tsx` de Server a Client Component (necesario para que sea pathname-aware) movió el cálculo de la fecha del header (`new Date().toLocaleDateString(...)`) de render de servidor a render de cliente, lo que introduce un riesgo latente de mismatch de hidratación cerca de un cambio de día.
  evidence: Hallazgo de `verification-gap` en la revisión de la Historia 4.5, confirmado leyendo el componente. Es un efecto secundario real del enfoque elegido en el spec (documentado en sus Design Notes como el diff mínimo sin reestructurar rutas), no un bug introducido por error — pero vale revisarlo si se reestructura el layout compartido más adelante.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-5-minimal-login-and-signup-ui.md`
  summary: Al alternar entre "iniciar sesión" y "registrarse" en `/login`, el campo de contraseña no se limpia — un valor tipeado para signup queda cargado si el usuario vuelve a login (o viceversa).
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 4.5. Bajo impacto (el usuario solo reescribe el campo), pero podría causar un intento de login/signup confuso con la contraseña "equivocada" aún cargada.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-5-minimal-login-and-signup-ui.md`
  summary: El mensaje de error inline en `/login` (`<p role="alert">`) no está conectado a los inputs de email/password vía `aria-invalid`/`aria-describedby`, así que un usuario de lector de pantalla es notificado de que hubo un error pero no de a qué campo corresponde.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 4.5. Mejora de accesibilidad no exigida por el spec de esta historia (que no menciona ARIA); vale resolverlo si se hace una pasada de accesibilidad sobre los formularios de la app.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: Varios gaps de accesibilidad en `/accounts`: el `Label htmlFor="type"` en `account-form-modal.tsx` no tiene un `id="type"` correspondiente en el `SelectTrigger`; el `<select>` de filtro por tipo y el `<input>` de búsqueda en `page.tsx` no tienen `<label>`/`id` asociado; los botones de Editar/Eliminar dependen solo de `title` (no `aria-label`) para su nombre accesible.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6. Mismo patrón de gap de accesibilidad ya aceptado y diferido para el formulario de `/login` (Historia 4.5); vale resolver ambos juntos en una pasada de accesibilidad.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: `mapServerError` en `account-form-modal.tsx` mapea errores de servidor a campos por substring-matching de palabras en español (`'nombre'`, `'saldo'`, `'moneda'`) separadas por `'; '` hardcodeado — el mismo patrón frágil ya presente en `create-category-modal.tsx`. Un cambio de redacción en cualquier mensaje Zod de `actions.ts` rompe silenciosamente el mapeo campo-a-campo en toda la app.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6. No es una regresión de esta historia (reproduce un patrón ya aceptado), pero el riesgo crece con cada nuevo modal que lo copia; vale resolver con un mecanismo tipado (ej. Zod `flatten()` con field paths) cuando se toque cualquiera de estos modales de nuevo.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: `formatAccountBalance` en `accounts/page.tsx` formatea siempre con el locale `'es-PE'` sin importar la `currency` real de la cuenta, así que cuentas en USD/EUR/etc. se muestran con las convenciones de agrupación/decimales peruanas en vez de una apropiada a su moneda.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6. Bajo impacto mientras la mayoría de usuarios use PEN; vale resolver si se prioriza soporte multi-moneda real.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: El campo `currency` en el formulario de cuenta es un `Input` de texto libre sin validación de formato ISO-4217 (longitud, mayúsculas) en ninguna capa (cliente, Zod schema en `actions.ts`, ni la DB) — se puede guardar cualquier string como moneda de una cuenta.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6. Consistente con el resto del stack de cuentas, que tampoco lo valida; vale resolver junto con soporte multi-moneda real.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: No existe forma de reactivar una cuenta soft-deleted (`isActive: false`) ni de filtrar la lista de `/accounts` para ver solo activas o solo inactivas — la página solo muestra un badge "Inactiva".
  evidence: Explícitamente fuera de alcance del spec de la Historia 5.6 (sección "Never"). Necesitará una historia futura que agregue la acción de reactivar y/o el filtro.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: Editar `currency` o `initialBalance` de una cuenta existente no tiene ninguna advertencia ni restricción hoy, aunque una vez que la Historia 5.2 (`account_id` en `transactions`) enlace transacciones reales a cuentas, cambiar cualquiera de los dos después de que existan transacciones podría producir balances calculados inconsistentes o datos mixtos de moneda.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6, relevante recién cuando aterrice la Historia 5.2 — hoy no hay forma de que una cuenta tenga transacciones asociadas por `account_id` todavía.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: El nav mobile (`mobile-nav.tsx`) pasó de 4 a 5 items con esta historia; no se verificó visualmente el comportamiento en viewports muy angostos (posible amontonamiento de labels/íconos).
  evidence: Riesgo señalado por el propio subagente implementador durante la Historia 5.6; no se pudo hacer una pasada visual en navegador real en este entorno (sin Playwright/chromium-cli instalado). Vale una revisión visual rápida en un emulador de pantalla angosta.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: La búsqueda por nombre en `/accounts` es un substring match case-insensitive simple, sin normalización de acentos/diacríticos — buscar "ahorros" no necesariamente encuentra nombres con tildes escritos de forma distinta.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6. Impacto bajo dado el volumen de cuentas esperado por usuario; vale resolver si se generaliza un helper de búsqueda normalizada para toda la app.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-accounts-management-page.md`
  summary: Rechazar cualquier `initialBalance` negativo (incluso para cuentas `credit_card`) es correcto para el alcance de esta historia, pero cuando el roadmap aborde el modelado de deuda de tarjetas de crédito (balance inicial negativo = deuda ya existente), esta restricción tendrá que revisarse.
  evidence: Hallazgo de `blind-hunter` en la revisión de la Historia 5.6, consistente con la restricción "Always" ya congelada en el spec; anotado para cuando se diseñe esa historia futura de tarjetas de crédito.
