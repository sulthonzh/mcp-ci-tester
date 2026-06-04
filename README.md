# mcp-ci-tester

**Automated MCP server contract testing for CI - validate your MCP server protocol compliance**

[![npm version](https://img.shields.io/npm/v/mcp-ci-tester.svg)](https://www.npmjs.com/package/mcp-ci-tester)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why This Exists

Everyone's building MCP servers (the new "npm packages" for AI agents), but there's no automated way to validate that your MCP server actually conforms to the protocol spec in CI. Developers ship broken servers that:
- Return malformed tool schemas
- Don't handle edge cases in parameter validation
- Have inconsistent error responses
- Break silently when the protocol spec updates

## Existing Tools (and why they're not enough)

1. **MCP Inspector** (modelcontextprotocol/inspector) — Interactive visual debugger. Great for dev-time exploration, but NOT automatable in CI. No programmatic assertions, no pass/fail output.

2. **mcp-test-runner** (privsim) — Runs YOUR test suites (Jest, Pytest, etc.) via MCP protocol. This is a MCP server that runs tests, NOT a tool that tests your MCP server.

3. **Testomat.io** — Test management platform that added MCP support. Commercial, not a standalone CLI tool.

**The gap:** No tool does what ESLint does for code, but for MCP server protocol compliance — run in CI, assert contracts, fail the build.

## What mcp-ci-tester Does

```bash
npx mcp-ci-tester --server ./my-mcp-server.js
```

- ✅ **Schema validation**: Tool definitions match JSON Schema spec
- ✅ **Protocol compliance**: Initialize → list tools → call tool flow works
- ✅ **Response contract**: Responses match declared schemas
- ✅ **Error handling**: Graceful errors for invalid inputs
- ✅ **Performance**: Response time thresholds (configurable)
- ✅ **CI integration**: JUnit XML + GitHub Actions annotations

## Installation

```bash
npm install -g mcp-ci-tester
```

## Usage

### Basic Test

```bash
# Test an MCP server
mcp-ci-tester test ./my-mcp-server.js

# With custom arguments
mcp-ci-tester test ./my-mcp-server --args --port=8080 --config=production.yaml

# Timeout customization
mcp-ci-tester test ./my-mcp-server --timeout 15000

# Disable specific test types
mcp-ci-tester test ./my-mcp-server --no-performance-testing --no-schema-validation
```

### CI Integration

#### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test MCP Server
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test MCP server
        run: npx mcp-ci-tester test ./src/server.ts --github-annotations --junit --output test-results.xml
      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results.xml
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  script:
    - npx mcp-ci-tester test ./server.js --junit --output test-results.xml
  artifacts:
    reports:
      junit: test-results.xml
```

#### Jenkins

```groovy
// Jenkinsfile
pipeline {
  agent any
  stages {
    stage('Test') {
      steps {
        sh 'npx mcp-ci-tester test ./server.js --junit --output test-results.xml'
        junit 'test-results.xml'
      }
    }
  }
}
```

### Output Formats

#### Default Text Output
```bash
mcp-ci-tester test ./my-mcp-server.js
```

```
✅ MCP server tests passed

Summary:
  Total tests: 15
  Passed: 15
  Failed: 0
  Duration: 2345ms

All tests:
  ✅ Initialize Response Schema (quick)
  ✅ Tool Schema: echo-user (quick)
  ✅ Tool Call: echo-user (quick)
  ✅ Error Handling: echo-user (quick)
  ✅ Performance: echo-user (1.2ms average, 5 tests)
```

#### JSON Output
```bash
mcp-ci-tester test ./my-mcp-server.js --json
```

```json
{
  "passed": true,
  "totalTests": 15,
  "passedTests": 15,
  "failedTests": 0,
  "duration": 2345,
  "tests": [
    {
      "name": "Initialize Response Schema",
      "passed": true,
      "message": "MCP server initialized successfully",
      "details": {
        "toolsFound": 3
      }
    }
  ],
  "errors": []
}
```

#### JUnit XML Output
```bash
mcp-ci-tester test ./my-mcp-server.js --junit
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="mcp-ci-tester" tests="15" failures="0" time="2.345">
    <testcase name="Initialize Response Schema" time="0.001"/>
    <testcase name="Tool Schema: echo-user" time="0.002"/>
    <testcase name="Tool Call: echo-user" time="0.1"/>
    <testcase name="Error Handling: echo-user" time="0.05"/>
    <testcase name="Performance: echo-user" time="1.2"/>
  </testsuite>
</testsuites>
```

#### GitHub Actions Annotations
```bash
mcp-ci-tester test ./my-mcp-server.js --github-annotations
```

Outputs annotations that appear in the GitHub Actions UI:
```
::error file=mcp-ci-tester.md,line=1,title=Tool Schema: invalid-tool::Invalid schema: root.name: must match pattern "^[a-z][a-z0-9_-]*$"
::error file=mcp-ci-tester.md,line=1,title=Tool Call Failed: broken-tool::Test failed with error: Connection refused
```

## Test Types

### Schema Validation
Validates that each tool's schema conforms to the MCP JSON Schema specification:
- Tool name validation (alphanumeric + underscore/hyphen)
- Input/output schema structure
- Required properties
- Type constraints
- Format validation (email, URI, etc.)

### Contract Testing
Tests the actual MCP protocol implementation:
- Server initialization handshake
- Tool listing functionality
- Tool execution with valid/invalid arguments
- Error response handling
- Response schema matching

### Performance Testing
Measures response times and ensures they meet thresholds:
- Average response time over 5 iterations
- Configurable performance threshold
- Fails if average response time exceeds threshold

## Programmatic Usage

```javascript
const { MCPTester } = require('mcp-ci-tester');

const tester = new MCPTester({
  command: 'node',
  args: ['./my-mcp-server.js'],
  timeout: 10000,
  schemaValidation: true,
  contractTesting: true,
  performanceTesting: true,
  performanceThreshold: 5000
});

async function runTests() {
  const result = await tester.runTests();
  
  if (result.passed) {
    console.log('All tests passed!');
  } else {
    console.error(`${result.failedTests} tests failed`);
    process.exit(1);
  }
}

runTests();
```

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Roadmap

- [ ] OpenAPI 3.1 support
- [ ] Advanced error scenario testing
- [ ] Protocol version detection and compatibility testing
- [ ] Custom test suite support
- [ ] Performance benchmarking
- [ ] WebSocket support for real-time updates

## Contributing

This tool exists because MCP server quality should be automated and enforced in CI. Contributions welcome!

## License

MIT - feel free to use in your projects!