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
export declare class MCPTester {
    private client;
    private validator;
    private options;
    constructor(options: TestOptions);
    runTests(): Promise<TestResult>;
    private startServer;
    private runSchemaValidationTests;
    private runContractTests;
    private runPerformanceTests;
}
//# sourceMappingURL=test-runner.d.ts.map