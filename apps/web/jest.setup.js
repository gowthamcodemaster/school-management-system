/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-dom';

//Global setup for Jest tests in the web app, can be used to set up any global configurations or mocks needed for testing.

const sharedConfig = require('@school/config/jest/jest.config.react');

/** @type {import('jest').Config} */
module.exports = {
    ...sharedConfig,

    //App-specific settings
    displayName: '@school/api',

    //NestJs specific setup can be added here if needed
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    
    coverageDirectory: '../coverage',
}