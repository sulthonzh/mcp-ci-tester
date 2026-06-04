// Test setup file
import { jest } from '@jest/globals';
// Mock process.stdout.write to avoid console noise during tests
jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
// Mock console.log to reduce test noise
jest.spyOn(console, 'log').mockImplementation(() => { });
jest.spyOn(console, 'error').mockImplementation(() => { });
//# sourceMappingURL=setup.js.map