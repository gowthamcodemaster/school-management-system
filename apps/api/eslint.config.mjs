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
      allowDefaultProject: ['src/*.spec.ts', 'test/*.spec.ts'],
    },
    tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
