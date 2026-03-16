/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest');
const sharedConfig = require('@school/config/jest/jest.config.react');

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    ...sharedConfig,

    //Override or extend share components config here
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    //App Specific Settings
    displayName: '@school/web',
};

module.exports = createJestConfig(customJestConfig);