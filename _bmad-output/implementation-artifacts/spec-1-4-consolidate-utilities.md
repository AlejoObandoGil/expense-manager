---
status: done
story_id: 1.4
epic: 1
implemented_by: john.obando.dev@gmail.com
completion_date: 2026-08-16
git_hash: 9adf8eb
---

# Story 1.4: Consolidate Utilities & Remove Duplicate Design System

## Summary
Centralizar utilidades compartidas (formatCurrency) y eliminar duplicados de diseño, dejando un único origen de verdad para tokens de diseño y formatos de moneda.

## Acceptance Criteria

### AC1: Crear utilidad centralizada de formatCurrency
- **Given** formatCurrency está duplicado en 3 componentes (dashboard-stats.tsx, monthly-chart.tsx, category-chart.tsx)
- **When** se crea `src/lib/format.ts` con función formatCurrency centralizada
- **Then** exporta: `formatCurrency(amount: number, locale: 'es-PE'): string`
- **And** todos los 3 archivos de componente importan y usan esta función en lugar de sus implementaciones locales

### AC2: Eliminar source de tokens duplicado
- **Given** existen dos sources de tokens de diseño competidores (app/globals.css y presentation/styles/theme.css)
- **When** se auditan todos los componentes
- **Then** se encuentra que componentes referencian tokens de ambos archivos (sistema de diseño roto)

### AC3: Verificar fuente única de autoridad
- **Given** app/globals.css es el sistema de diseño autoritativo
- **When** se elimina `src/presentation/styles/theme.css`
- **And** se verifica que todas las clases CSS semánticas están definidas en app/globals.css
- **Then** ningún componente importa desde archivo eliminado (validado por build)

### AC4: Consolidación completa
- **Given** todas las utilidades están centralizadas
- **When** un componente necesita formatear moneda, importa desde src/lib/format.ts
- **And** cuando un componente necesita un token de diseño, referencia una clase CSS semántica de app/globals.css
- **Then** el proyecto tiene un único origen de verdad para ambos

## Implementation Notes
- Archivo creado: `src/lib/format.ts`
  - Export `formatCurrency(amount: number): string` usando `Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })`
  - Incluye jsdoc con ejemplos
- 3 archivos de componente actualizados para importar formatCurrency desde src/lib/format.ts
- Archivo `src/presentation/styles/theme.css` eliminado completamente
- Build verificado: sin importaciones remanentes del archivo eliminado
- Búsqueda completada: sin valores de color hardcodeados remanentes

## Auto Run Result

Status: done
Completion Date: 2026-08-16
Git Commit: 9adf8eb
