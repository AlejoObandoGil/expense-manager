# Git Workflow - expense-manager

## Ramas Principales

### `main` — Producción
- **Solo recibe merges desde `develop`**
- **Requiere:** CI pass + 1 review + conventional commits
- Despliegues automáticos a GitHub Pages
- Versioning con semantic release (próximo)

### `develop` — Desarrollo
- **Rama por defecto para desarrollo**
- Recibe merges de:
  - `feature/*` — nuevas funcionalidades
  - `fix/*` — correcciones de bugs
- **Requiere:** CI pass + conventional commits

## Flujo de Trabajo

### 1. Crear Feature/Fix desde `develop`

```bash
git checkout develop
git pull origin develop

# Para nueva funcionalidad
git checkout -b feature/nombre-descriptivo

# Para bug fix
git checkout -b fix/nombre-descriptivo
```

### 2. Hacer Commits con Conventional Commits

```bash
# Formato: <tipo>(<scope>): <descripción>
git commit -m "feat(dashboard): agregar gráfico de gastos mensuales"
git commit -m "fix(auth): resolver error de sesión expirada"
git commit -m "docs: actualizar README"
git commit -m "refactor(components): simplificar lógica de DashboardStats"
```

**Tipos válidos:**
- `feat` — Nueva funcionalidad
- `fix` — Corrección de bug
- `docs` — Cambios de documentación
- `style` — Cambios de formato (sin lógica)
- `refactor` — Refactorización (sin cambios funcionales)
- `perf` — Mejoras de performance
- `test` — Agregar/actualizar tests
- `chore` — Tareas administrativas
- `ci` — Cambios en CI/CD

### 3. Push y Crear PR hacia `develop`

```bash
git push origin feature/nombre-descriptivo

# GitHub te sugerirá crear un PR
# Base: develop
# Compare: feature/nombre-descriptivo
```

### 4. Review y Merge

- ✅ CI debe pasar (tests, lint, build)
- ✅ Commits deben cumplir conventional commits
- ✅ Preferir "Squash and merge" para mantener limpio el historial

### 5. Release a `main`

Cuando `develop` está lista para producción:

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

O crear un PR `develop` → `main` con:
- Base: `main`
- Compare: `develop`

## Verificación Automática

### CI/CD en `develop`
- ✅ Lint
- ✅ Type check (tsc)
- ✅ Build
- ✅ Tests (cuando estén configurados)

### CI/CD en `main`
- ✅ Todos los checks de develop
- ✅ Deploy automático a GitHub Pages

## Reglas Branch Protection

### `main`
- ✅ Requiere PR review antes de merge
- ✅ Requiere CI pass
- ✅ Requiere conventional commits
- ✅ Solo merges desde `develop`

### `develop`
- ✅ Requiere CI pass
- ✅ Requiere conventional commits

## Comandos Útiles

```bash
# Ver ramas
git branch -a

# Listar commits en develop desde main
git log main..develop --oneline

# Cambiar a develop
git checkout develop

# Actualizar develop local
git pull origin develop

# Ver estado de feature
git log feature/mi-rama --oneline -5
```

## Troubleshooting

**"Mi rama tiene conflictos con develop"**
```bash
git fetch origin develop
git rebase origin/develop
# Resolver conflictos...
git rebase --continue
git push origin feature/mi-rama --force-with-lease
```

**"Cometí sin conventional commit"**
```bash
# Amend último commit
git commit --amend -m "feat: descripción correcta"
git push --force-with-lease
```

**"Quiero descartar cambios locales"**
```bash
git reset --hard origin/develop
```
