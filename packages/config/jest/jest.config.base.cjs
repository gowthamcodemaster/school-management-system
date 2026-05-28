/** @type {import('jest').Config} */

module.exports = {
    // Collect coverage from all files in the src directory, except for index.ts and types.ts(shared)
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/coverage/**',
        '!**/.next/**',
        '!**/*.config.{js,ts}',
    ],

    // Coverage Threshold
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },

    //Module Paths
    moduleDirectories: ['node_modules', '<rootDir>/src'],

    // Test match patterns
    testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'],

    // Ignore patterns
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/.next/', '/build/'],

    // Transform ignore patterns
    transformIgnorePatterns: [
        './node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
    ],

    // Verbose output
    verbose: true,

    // Clear mocks after each test    
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,
};