const baseConfig = require('./jest.config.base');

/** @type {import('jest').Config} */
module.exports = {
    ...baseConfig,

    displayName: 'node',

    // Preset for Node.js environment with TypeScript support
    preset: 'ts-jest',

    // Test environment for Node.js
    testEnvironment: 'node',

    // Module name mapper for NestJs
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@/common/(.*)$' : '<rootDir>/src/common/$1',
    },

    //Disable coverage collection from below
    collectCoverageFrom: [
        ...baseConfig.collectCoverageFrom,
        '!**/main.ts',
        '!**/*.module.ts',
        '!**/*.entity.ts',
        '!**/*.dto.ts',
    ],

    // Roots
    roots: ['<rootDir>/src', '<rootDir>/tests'],

    // Transform for TypeScript files
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
    },

    //Typescript Jest configuration
    globals: {
        'ts-jest': {
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        },
    },
};