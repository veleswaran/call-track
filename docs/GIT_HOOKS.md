# Git Hooks Setup

## Pre-commit Hook

A pre-commit hook is available that automatically runs quality checks before each commit:

### Backend (PHP)
- **Laravel Pint** - Code style validation
- **PHPStan** - Static analysis

### Frontend (Next.js Admin)
- **ESLint** - TypeScript/React linting
- **Vitest** - Unit tests

---

## Installation

Copy the pre-commit script to your local git hooks:

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## What Happens on Commit

The hook intelligently detects which files are staged:

| Staged Files | Checks Run |
|--------------|------------|
| `*.php` | Pint + PHPStan |
| `admin/*` | ESLint + Vitest |
| Both | All checks |

If any check fails, the commit will be blocked.

---

## Bypassing the Hook

If you need to commit without running checks (not recommended):

```bash
git commit --no-verify
```

---

## GitHub Actions CI

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs:

**Backend Job (`quality-checks`)**
- Laravel Pint
- PHPStan
- PHPUnit tests

**Frontend Job (`frontend-checks`)**
- ESLint
- Vitest with coverage
- Production build

Both jobs run in parallel on push/PR to `master` or `develop` branches.
