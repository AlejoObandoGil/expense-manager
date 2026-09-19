---
title: 'Implementar modal para crear nueva categoría'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: '7c94eac' 
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** El botón "Nueva Categoría" en `/categories` solo hace `console.log()`. El usuario no puede crear categorías.

**Enfoque:** Implementar modal con form para capturar nombre, emoji, color, tipo (expense/income/both). Validar con Zod. Persistir via Server Action `createCategory` usando `ApiCategoryRepository`.

## Boundaries & Constraints

**Always:**
- Form validación con Zod (nombre required, emoji required, color hex válido, tipo en enum)
- Server Action verifica auth y persiste a Supabase con RLS
- Modal abre al click del botón "Nueva Categoría"
- Modal se cierra post-create exitoso
- Lista de categorías se actualiza automáticamente (refetch via useTransactions hook o direct state)
- Error handling: mostrar toast error si falla

**Ask First:**
- (Ninguno — alcance aislado, complementa UI existente)

**Never:**
- Cliente-side create sin Server Action
- Permitir crear categoría sin usuario autenticado
- Cambiar estructura de Category entity

## I/O & Edge-Case Matrix

| Escenario | Input | Output Esperado | Error Handling |
|-----------|-------|-----------------|----------------|
| Form vacío | Submit presionado | Validación Zod rechaza, mostrar errores inline | Mensajes de validación por campo |
| Nombre + emoji + color válido | Submit | POST a `createCategory` → insert en Supabase → toast success → modal cierra → categoría aparece en lista | N/A |
| Color hex inválido | "#xyz" | Validación rechaza | Error inline "Color inválido" |
| RLS violation (no auth) | Submit | Server Action falla con auth error | Toast "No autenticado" |

</frozen-after-approval>

## Code Map

- `src/app/categories/page.tsx:76-81` — EmojiButton onClick dummy, reemplazar con modal open
- `src/app/actions/categories.ts` — Archivo canon de Server Actions, agregar `createCategory`
- `src/presentation/components/shared/` — Buscar/crear component Modal reutilizable
- `src/domain/entities/category.ts` — Category entity (no cambiar, ya existe)
- `src/infrastructure/repositories/api-category.repository.ts` — Ya tiene `create()` method (usar)

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/components/shared/create-category-modal.tsx` -- Nuevo component: Modal + Form (nombre, emoji, color, tipo) con Zod validation -- Capturar input del usuario
- [x] `src/app/actions/categories.ts` -- Agregar Server Action `createCategory(input: CreateCategoryInput)` que valida + persiste -- Garantizar auth check + RLS
- [x] `src/app/categories/page.tsx` -- Integrar modal: state para open/close, onClick abre modal, onSuccess cierra + refetch categorías -- Wiring UI ↔ backend
- [x] `npm run build` -- Verificar compile sin errores -- Zero blast radius

**Acceptance Criteria:**
- Dado que hago click en "Nueva Categoría", cuando el modal abre, entonces veo form con campos name, emoji, color, tipo
- Dado que ingreso nombre válido + emoji + color + tipo, cuando presiono "Crear", entonces categoría se inserta en Supabase + modal cierra + aparece en lista
- Dado que dejo nombre vacío, cuando presiono "Crear", entonces validación rechaza con error inline
- Dado que no estoy autenticado, cuando intento crear, entonces recibo error "No autenticado"

## Verification

**Commands:**
- `npm run build` -- esperado: Success

**Manual checks:**
- Abrir `/categories` → click "Nueva Categoría" → confirmar modal abre
- Ingresar datos válidos → click "Crear" → confirmar toast success + modal cierra + categoría aparece
- Dejar campos vacíos → click "Crear" → confirmar mensajes de validación

## Design Notes

**Modal component:** Reutilizar si existe `Dialog`/`Modal` en `src/presentation/components/shared/`. Si no existe, crear simple: overlay + card centrada con form adentro.

**Form fields:**
- `name`: text input, required, min 1 char
- `emoji`: text input, required, single emoji (ej: "🏠")
- `color`: color picker o hex input (ej: "#3b82f6")
- `type`: select (expense | income | both)

**Buttons:** "Cancelar" (cierra modal), "Crear" (submit)

**Error toast:** Use `sonner.toast.error()` (ya importado en proyecto)
