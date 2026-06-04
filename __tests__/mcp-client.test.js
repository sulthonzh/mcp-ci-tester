import { MCPClient } from '../src/mcp-client';
describe('MCPClient', () => {
    let client;
    beforeEach(() => {
        client = new MCPClient();
    });
    afterEach(() => {
        client.stop();
    });
    test('should validate tool schema', async () => {
        const mockTool = {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'A message to echo'
                    }
                },
                required: ['message']
            }
        };
        const result = await client.testToolSchema(mockTool);
        expect(result.passed).toBe(true);
        expect(result.tool).toBe('test-tool');
    });
    test('should handle invalid tool schema', async () => {
        const invalidTool = {
            name: '',
            inputSchema: {
                type: 'invalid'
            }
        };
        const result = await client.testToolSchema(invalidTool);
        expect(result.passed).toBe(false);
        expect(result.tool).toBe('');
    });
    test('should test tool with invalid arguments', async () => {
        const mockTool = {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {
                    requiredParam: {
                        type: 'string'
                    }
                },
                required: ['requiredParam']
            }
        };
        const result = await client.testToolWithInvalidArguments(mockTool);
        expect(result.passed).toBe(true);
        expect(result.tool).toBe('test-tool');
    });
});
//# sourceMappingURL=mcp-client.test.js.map