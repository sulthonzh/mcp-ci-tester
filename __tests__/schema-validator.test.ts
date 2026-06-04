import { SchemaValidator } from '../src/schema-validator';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  test('should validate a correct tool schema', () => {
    const tool = {
      name: 'echo',
      description: 'Echo a message',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to echo'
          }
        },
        required: ['message']
      }
    };

    const result = validator.validateToolSchema(tool);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid tool name', () => {
    const tool = {
      name: 'Invalid Tool Name',
      inputSchema: {
        type: 'object'
      }
    };

    const result = validator.validateToolSchema(tool);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('root.name: must match pattern "^[a-z][a-z0-9_-]*$"');
  });

  test('should reject invalid input schema type', () => {
    const tool = {
      name: 'test',
      inputSchema: {
        type: 'invalid'
      }
    };

    const result = validator.validateToolSchema(tool);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('root.inputSchema.type: must be equal to one of the allowed values');
  });

  test('should validate initialize response', () => {
    const response = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'test-server'
        }
      }
    };

    const result = validator.validateInitializeResponse(response);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid initialize response', () => {
    const response = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: 'invalid-version',
        capabilities: {},
        serverInfo: {
          name: ''
        }
      }
    };

    const result = validator.validateInitializeResponse(response);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('root.result.protocolVersion: must match pattern "^2024-11-05$"');
  });
});