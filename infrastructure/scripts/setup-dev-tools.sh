#!/bin/bash
# Run this once from your monorepo root
# chmod +x setup-dev-tools.sh && ./setup-dev-tools.sh

set -e
echo "🔧 Setting up dev tools for monorepo..."

# ── 1. Husky ──────────────────────────────────────────────────────
pnpm add -Dw husky lint-staged

pnpm exec husky init

# pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
pnpm exec lint-staged
EOF

# commit-msg hook (enforces conventional commits)
cat > .husky/commit-msg << 'EOF'
#!/bin/sh
pnpm exec commitlint --edit "$1"
EOF

chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

echo "✅ Husky installed"

# ── 2. Commitlint ─────────────────────────────────────────────────
pnpm add -Dw @commitlint/cli @commitlint/config-conventional

cat > commitlint.config.js << 'EOF'
module.exports = { extends: ['@commitlint/config-conventional'] };
EOF

echo "✅ Commitlint installed"

# ── 3. ESLint security plugin ─────────────────────────────────────
pnpm add -Dw eslint-plugin-security eslint-plugin-no-secrets

echo "✅ ESLint security plugins installed"

# ── 4. gitleaks (secret scanner) ──────────────────────────────────
if ! command -v gitleaks &> /dev/null; then
  echo "⚠️  gitleaks not found. Install it:"
  echo "   macOS:  brew install gitleaks"
  echo "   Linux:  https://github.com/gitleaks/gitleaks/releases"
else
  # Add gitleaks to pre-commit
  cat >> .husky/pre-commit << 'EOF'

# Scan for secrets before every commit
gitleaks protect --staged --redact -v
EOF
  echo "✅ gitleaks hooked into pre-commit"
fi

# ── 5. Snyk ───────────────────────────────────────────────────────
if ! command -v snyk &> /dev/null; then
  pnpm add -Dw snyk
  echo "⚠️  Run 'pnpm exec snyk auth' to authenticate Snyk"
else
  echo "✅ Snyk already available"
fi

echo ""
echo "🎉 Done! Add the prepare script to your root package.json:"
echo '   "prepare": "husky"'
echo ""
echo "Then run: pnpm install"
