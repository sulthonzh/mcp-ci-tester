import { MCPTester } from './dist/test-runner';

async function testBasic() {
  console.log('Testing basic functionality...');
  
  const tester = new MCPTester({
    command: 'echo',
    args: ['test'],
    schemaValidation: true,
    contractTesting: false,
    performanceTesting: false,
    timeout: 5000
  });

  try {
    const result = await tester.runTests();
    console.log('Basic test passed:', result);
  } catch (error: any) {
    console.log('Basic test error:', error.message);
  }
}

testBasic();