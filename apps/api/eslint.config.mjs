// apps/api/eslint.config.mjs
import { nestjs, ignores } from '@school/config/eslint-preset';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  
{ ignores: ['eslint.config.mjs', '**/*.js', ...ignores] },
  // Spread the shared nestjs preset (includes base + security + prettier)
  ...nestjs,

  // NestJS-specific typed linting — keep this here as it needs local tsconfig
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
       projectService: {
      allowDefaultProject: ['src/*.spec.ts', 'test/*.spec.ts', 'e2e/*.ts',
    'e2e/support/*.ts',
    'e2e/step-definitions/*.ts',
    'e2e/step-definitions/auth/*.ts'],
    },
    tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
