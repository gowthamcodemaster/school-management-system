# Dev Tooling Setup Guide

# Monorepo | pnpm | Next.js + NestJS + Prisma

## Step 1 — Copy files into your repo root

Place these files at your monorepo root:
.gitignore
.gitleaks.toml
lint-staged.config.cjs
eslint-security.config.js → merge into apps/api/.eslintrc.js

Place these in a /k6 folder:
k6/auth-load-test.js
k6/results/ → (create empty folder, add .gitkeep)

## Step 2 — Run the setup script

chmod +x setup-dev-tools.sh
./setup-dev-tools.sh

## Step 3 — Update root package.json

Add/merge these into your root package.json:

{
"scripts": {
"prepare": "husky",
"lint": "pnpm -r run lint",
"lint:fix": "pnpm -r run lint --fix",
"format": "prettier --write \"\*_/_.{ts,tsx,json,md,prisma}\"",
"security:scan":"snyk test",
"load:test": "k6 run k6/auth-load-test.js"
},
"lint-staged": "See lint-staged.config.js"
}

## Step 4 — Install gitleaks (one time)

macOS: brew install gitleaks
Linux: https://github.com/gitleaks/gitleaks/releases

Then verify it works:
gitleaks detect --source . -v

## Step 5 — Authenticate Snyk (one time)

pnpm exec snyk auth
pnpm exec snyk test # run a manual scan

## Step 6 — Install k6 (one time)

macOS: brew install k6
Linux: https://k6.io/docs/get-started/installation

Create results folder so k6 can write output:
mkdir -p k6/results
echo "" > k6/results/.gitkeep

Run auth load test:
API_URL=http://localhost:3001 k6 run k6/auth-load-test.js

## Step 7 — Merge ESLint security rules

In apps/api/.eslintrc.js, add:
plugins: ['security', 'no-secrets']

And copy the rules from eslint-security.config.js into your rules block.

## What happens on every git commit now

1. lint-staged runs ESLint + Prettier on staged files only (fast)
2. Prisma format runs if .prisma files are staged
3. gitleaks scans staged files for secrets
4. commitlint checks your commit message format

Conventional commit format required:
feat: add super admin login
fix: token refresh race condition
chore: update dependencies
docs: add auth flow diagram

## Snyk weekly habit

Run this weekly or before any dependency update:
pnpm exec snyk test
pnpm exec snyk monitor # sends snapshot to Snyk dashboard (free tier)
