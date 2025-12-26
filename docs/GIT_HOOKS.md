# Git Hooks Setup

## Pre-commit Hook

A pre-commit hook has been installed that automatically runs quality checks before each commit:

1. **Laravel Pint** - Code style validation
2. **PHPStan** - Static analysis
3. **Tests** - Full test suite

### Installation

The hook is already installed at `.git/hooks/pre-commit` and is executable.

### Manual Installation (if needed)

If you need to reinstall the hook:

```bash
chmod +x .git/hooks/pre-commit
```

### Bypassing the Hook

If you need to commit without running checks (not recommended):

```bash
git commit --no-verify
```

### What Happens on Commit

When you run `git commit`, the hook will:
- ✅ Check code style with Pint
- ✅ Run static analysis with PHPStan
- ✅ Execute all tests

If any check fails, the commit will be blocked and you'll see which check failed.

## GitHub Actions CI

The repository also includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs the same checks on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

This ensures code quality is maintained even if local hooks are bypassed.
