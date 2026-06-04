#!/usr/bin/env node

import { Command } from 'commander';
import { MCPTester } from './test-runner';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('mcp-ci-tester')
  .description('Automated MCP server contract testing for CI')
  .version('1.0.0');

program
  .command('test')
  .description('Test an MCP server')
  .argument('<command>', 'Command to start the MCP server')
  .option('-a, --args <args...>', 'Arguments for the MCP server command')
  .option('-t, --timeout <timeout>', 'Test timeout in milliseconds', '10000')
  .option('--no-schema-validation', 'Disable schema validation')
  .option('--no-contract-testing', 'Disable contract testing')
  .option('--no-performance-testing', 'Disable performance testing')
  .option('--performance-threshold <threshold>', 'Performance threshold in milliseconds', '5000')
  .option('--json', 'Output results in JSON format')
  .option('--junit', 'Output JUnit XML format')
  .option('--github-annotations', 'Output GitHub Actions annotations')
  .option('--output <file>', 'Write results to file')
  .action(async (command: string, options) => {
    try {
      const testOptions = {
        command,
        args: options.args,
        timeout: parseInt(options.timeout),
        schemaValidation: options.schemaValidation,
        contractTesting: options.contractTesting,
        performanceTesting: options.performanceTesting,
        performanceThreshold: parseInt(options.performanceThreshold)
      };

      const tester = new MCPTester(testOptions);
      const result = await tester.runTests();

      // Output based on format options
      let output = '';
      
      if (options.json) {
        output = JSON.stringify(result, null, 2);
      } else if (options.junit) {
        output = generateJUnitXML(result);
      } else if (options.githubAnnotations) {
        output = generateGitHubAnnotations(result);
      } else {
        output = generateTextOutput(result);
      }

      // Write to file if specified
      if (options.output) {
        const outputDir = join(process.cwd(), options.output);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }
        writeFileSync(join(process.cwd(), options.output), output);
        console.log(`Results written to: ${options.output}`);
      } else {
        console.log(output);
      }

      // Exit with appropriate code
      process.exit(result.passed ? 0 : 1);
    } catch (error) {
      console.error('Error running tests:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function generateTextOutput(result: any): string {
  let output = '';

  if (result.passed) {
    output += '✅ MCP server tests passed\n\n';
  } else {
    output += '❌ MCP server tests failed\n\n';
  }

  output += `Summary:\n`;
  output += `  Total tests: ${result.totalTests}\n`;
  output += `  Passed: ${result.passedTests}\n`;
  output += `  Failed: ${result.failedTests}\n`;
  output += `  Duration: ${result.duration}ms\n\n`;

  if (result.errors.length > 0) {
    output += 'Errors:\n';
    result.errors.forEach((error: any) => {
      output += `  ❌ ${error}\n`;
    });
    output += '\n';
  }

  if (!result.passed) {
    output += 'Failed tests:\n';
    result.tests
      .filter((test: any) => !test.passed)
      .forEach((test: any) => {
        output += `  ❌ ${test.name}: ${test.message}\n`;
      });
    output += '\n';
  }

  output += 'All tests:\n';
  result.tests.forEach((test: any) => {
    const status = test.passed ? '✅' : '❌';
    output += `  ${status} ${test.name} (${test.duration ? test.duration + 'ms' : 'quick'})\n`;
    if (test.message && test.message !== '✅') {
      output += `    ${test.message}\n`;
    }
  });

  return output;
}

function generateJUnitXML(result: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<testsuites>\n';
  xml += `  <testsuite name="mcp-ci-tester" tests="${result.totalTests}" failures="${result.failedTests}" time="${result.duration / 1000}">\n`;

  result.tests.forEach((test: any) => {
    xml += `    <testcase name="${test.name}" time="${(test.duration || 0) / 1000}">\n`;
    if (!(test as any).passed) {
      xml += `      <failure message="${test.message}" />\n`;
    }
    xml += `    </testcase>\n`;
  });

  xml += '  </testsuite>\n';
  xml += '</testsuites>\n';

  return xml;
}

function generateGitHubAnnotations(result: any): string {
  let output = '';

  result.tests
    .filter((test: any) => !test.passed)
    .forEach((test: any) => {
      output += `::error file=mcp-ci-tester.md,line=1,title=${test.name}::${test.message}\n`;
    });

  result.errors.forEach((error: any) => {
    output += `::error file=mcp-ci-tester.md,line=1,title=Test Error::${error}\n`;
  });

  return output;
}

program.parse();