#!/bin/bash

# Pre-commit hook script for CallTrack AI
# Copy this to .git/hooks/pre-commit and make it executable:
# cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

echo "🔍 Running pre-commit checks..."

# Check if PHP files are staged
if git diff --cached --name-only | grep -q '\.php$'; then
    echo "📝 Running Laravel Pint on staged PHP files..."
    ./vendor/bin/pint --test
    
    echo "🔬 Running PHPStan..."
    ./vendor/bin/phpstan analyse
fi

# Check if frontend files are staged
if git diff --cached --name-only | grep -q '^admin/'; then
    echo "📝 Running ESLint on staged frontend files..."
    cd admin
    npm run lint
    
    echo "🧪 Running frontend tests..."
    npm run test -- --run
    cd ..
fi

echo "✅ Pre-commit checks passed!"
