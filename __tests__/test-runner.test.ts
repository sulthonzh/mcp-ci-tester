import { MCPTester } from '../src/test-runner';

describe('MCPTester', () => {
  let tester: MCPTester;

  beforeEach(() => {
    tester = new MCPTester({
      command: 'echo',
      args: ['test'],
      schemaValidation: true,
      contractTesting: false,
      performanceTesting: false
    });
  });

  test('should initialize with correct options', () => {
    expect(tester).toBeDefined();
  });

  test('should handle missing command gracefully', async () => {
    tester = new MCPTester({
      command: 'nonexistent-command-12345',
      args: [],
      timeout: 1000
    });

    await expect(tester.runTests()).rejects.toThrow();
  });
});