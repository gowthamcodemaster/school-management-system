const baseConfig = require('./jest.config.base');

/** @type {import('jest').Config} */
module.exports = {
    ...baseConfig,

    displayName: 'react',

    // Use next-js preset for React projects
    preset: undefined,

    // Additional configuration specific to React projects can be added here
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Test environment for browser
    testEnvironment: 'jest-environment-jsdom',

    // Module Name mapper for next.js
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
         // Handle CSS imports (if using CSS modules)
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
         // Handle static imports
        '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    },

    // Non-coverage files specific to React projects
    collectCoverageFrom: [
        ...baseConfig.collectCoverageFrom,
        '!**/*.stories.{js,jsx,ts,tsx}', // Exclude storybook files
        '!**/app/layout.{js,jsx,ts,tsx}', // Exclude layout files
        '!**/app/**/layout.tsx'
    ],

    // Transform files
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$':[ '@swc/jest', {
            jsc: {
                parser: {
                    syntax: 'typescript',
                    tsx: true,
                },
                transform: {
                    react: {
                        runtime: 'automatic',
                    },
                },
            },
        }],
    },
};