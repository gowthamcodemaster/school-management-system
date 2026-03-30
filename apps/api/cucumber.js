// apps/api/cucumber.js
const common = {
  paths: ['e2e/features/**/*.feature'],
  import: [
    'e2e/support/hooks.ts',
    'e2e/support/world.ts',
    'e2e/step-definitions/**/*.steps.ts',
  ],
  loader: ['tsx'],
  format: [
    '@cucumber/pretty-formatter',
    'json:e2e/reports/cucumber-report.json',
    'html:e2e/reports/cucumber-report.html',
  ],
  failFast: false,
  retry: 1,
  timeout: 30000,
  parallel: 1,
};

export default {
  default: common,

  smoke: {
    ...common,
    format: ['@cucumber/pretty-formatter'],
    tags: '@smoke',
    timeout: 15000,
  },
};