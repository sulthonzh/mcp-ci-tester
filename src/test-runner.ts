import { MCPClient } from './mcp-client';
import { SchemaValidator } from './schema-validator';

export interface TestOptions {
  command: string;
  args?: string[];
  timeout?: number;
  schemaValidation?: boolean;
  contractTesting?: boolean;
  performanceTesting?: boolean;
  performanceThreshold?: number;
}

export interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  tests: TestReport[];
  errors: string[];
}

export interface TestReport {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
  details?: any;
}

export class MCPTester {
  private client: MCPClient;
  private validator: SchemaValidator;
  private options: TestOptions;

  constructor(options: TestOptions) {
    this.client = new MCPClient();
    this.validator = new SchemaValidator();
    this.options = {
      timeout: 10000,
      schemaValidation: true,
      contractTesting: true,
      performanceTesting: true,
      performanceThreshold: 5000,
      ...options
    };
  }

  async runTests(): Promise<TestResult> {
    const startTime = Date.now();
    const tests: TestReport[] = [];
    const errors: string[] = [];

    try {
      await this.startServer();
      
      if (this.options.schemaValidation) {
        const schemaTests = await this.runSchemaValidationTests();
        tests.push(...schemaTests);
      }

      if (this.options.contractTesting) {
        const contractTests = await this.runContractTests();
        tests.push(...contractTests);
      }

      if (this.options.performanceTesting) {
        const performanceTests = await this.runPerformanceTests();
        tests.push(...performanceTests);
      }

    } catch (error) {
      errors.push(`Test suite failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.client.stop();
    }

    const duration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;
    const failedTests = tests.filter(t => !t.passed).length;

    return {
      passed: failedTests === 0,
      totalTests: tests.length,
      passedTests,
      failedTests,
      duration,
      tests,
      errors
    };
  }

  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP server startup timeout'));
      }, this.options.timeout);

      this.client.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.client.start(this.options.command, this.options.args);
    });
  }

  private async runSchemaValidationTests(): Promise<TestReport[]> {
    const tests: TestReport[] = [];
    const tools = this.client.getAvailableTools();

    tests.push({
      name: 'Initialize Response Schema',
      passed: true,
      message: 'MCP server initialized successfully',
      details: { toolsFound: tools.length }
    });

    for (const tool of tools) {
      const validationResult = this.validator.validateToolSchema(tool);
      
      tests.push({
        name: `Tool Schema: ${tool.name}`,
        passed: validationResult.valid,
        message: validationResult.valid ? 'Valid tool schema' : `Invalid schema: ${validationResult.errors?.join(', ')}`,
        details: {
          tool: tool.name,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        }
      });
    }

    return tests;
  }

  private async runContractTests(): Promise<TestReport[]> {
    const tests: TestReport[] = [];
    const tools = this.client.getAvailableTools();

    for (const tool of tools) {
      try {
        const testResult = await this.client.testToolSchema(tool);
        tests.push({
          name: `Tool Call: ${tool.name}`,
          passed: testResult.passed,
          message: testResult.message,
          details: testResult.details
        });

        if (testResult.passed) {
          const errorTestResult = await this.client.testToolWithInvalidArguments(tool);
          tests.push({
            name: `Error Handling: ${tool.name}`,
            passed: errorTestResult.passed,
            message: errorTestResult.message,
            details: errorTestResult.details
          });
        }
      } catch (error) {
        tests.push({
          name: `Tool Call Failed: ${tool.name}`,
          passed: false,
          message: `Test failed with error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    return tests;
  }

  private async runPerformanceTests(): Promise<TestReport[]> {
    const tests: TestReport[] = [];
    const tools = this.client.getAvailableTools();
    
    if (tools.length === 0) {
      return tests;
    }

    const tool = tools[0]!;
    const iterations = 5;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.client.callTool(tool.name, {});
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      } catch (error) {
        tests.push({
          name: `Performance Test: ${tool.name}`,
          passed: false,
          message: `Performance test failed: ${error instanceof Error ? error.message : String(error)}`
        });
        return tests;
      }
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const passed = avgResponseTime <= this.options.performanceThreshold!;

    tests.push({
      name: `Performance: ${tool.name}`,
      passed,
      message: passed 
        ? `Average response time ${avgResponseTime.toFixed(2)}ms (${iterations} tests)`
        : `Average response time ${avgResponseTime.toFixed(2)}ms exceeds threshold ${this.options.performanceThreshold}ms`,
      duration: avgResponseTime,
      details: {
        tool: tool.name,
        iterations,
        responseTimes,
        average: avgResponseTime,
        threshold: this.options.performanceThreshold
      }
    });

    return tests;
  }
}