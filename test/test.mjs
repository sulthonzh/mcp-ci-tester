import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SchemaValidator } from '../dist/schema-validator.js';
import { MCPClient } from '../dist/mcp-client.js';

// ─── SchemaValidator ────────────────────────────────────────────

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  describe('validateToolSchema', () => {
    it('accepts a valid tool definition', () => {
      const result = validator.validateToolSchema({
        name: 'get-weather',
        description: 'Get weather for a city',
        inputSchema: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city']
        }
      });
      assert.equal(result.valid, true);
      assert.deepEqual(result.errors, []);
    });

    it('rejects a tool without name', () => {
      const result = validator.validateToolSchema({
        inputSchema: { type: 'object' }
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('rejects a tool without inputSchema', () => {
      const result = validator.validateToolSchema({
        name: 'my-tool'
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('rejects a tool with invalid name pattern', () => {
      const result = validator.validateToolSchema({
        name: 'MyTool!',
        inputSchema: { type: 'object' }
      });
      assert.equal(result.valid, false);
    });

    it('accepts a tool with array inputSchema type', () => {
      const result = validator.validateToolSchema({
        name: 'list-items',
        inputSchema: { type: 'array', items: { type: 'string' } }
      });
      assert.equal(result.valid, true);
    });

    it('accepts a tool with enum in inputSchema', () => {
      const result = validator.validateToolSchema({
        name: 'pick-color',
        inputSchema: {
          type: 'object',
          properties: {
            color: { type: 'string', enum: ['red', 'green', 'blue'] }
          }
        }
      });
      assert.equal(result.valid, true);
    });
  });

  describe('validateInitializeResponse', () => {
    it('accepts a valid initialize response', () => {
      const result = validator.validateInitializeResponse({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'test-server', version: '1.0.0' }
        }
      });
      assert.equal(result.valid, true);
    });

    it('rejects wrong jsonrpc version', () => {
      const result = validator.validateInitializeResponse({
        jsonrpc: '1.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: { name: 'test' }
        }
      });
      assert.equal(result.valid, false);
    });

    it('rejects wrong protocol version', () => {
      const result = validator.validateInitializeResponse({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2023-01-01',
          capabilities: {},
          serverInfo: { name: 'test' }
        }
      });
      assert.equal(result.valid, false);
    });

    it('rejects missing serverInfo', () => {
      const result = validator.validateInitializeResponse({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {}
        }
      });
      assert.equal(result.valid, false);
    });

    it('accepts string id', () => {
      const result = validator.validateInitializeResponse({
        jsonrpc: '2.0',
        id: 'abc-123',
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: { name: 'test' }
        }
      });
      assert.equal(result.valid, true);
    });
  });

  describe('validateCallToolResponse', () => {
    it('accepts a valid tool call response', () => {
      const result = validator.validateCallToolResponse({
        jsonrpc: '2.0',
        id: 2,
        result: {
          content: [{ type: 'text', text: 'Hello world' }]
        }
      });
      assert.equal(result.valid, true);
    });

    it('accepts a response with isError flag', () => {
      const result = validator.validateCallToolResponse({
        jsonrpc: '2.0',
        id: 2,
        result: {
          content: [{ type: 'text', text: 'Something went wrong' }],
          isError: true
        }
      });
      assert.equal(result.valid, true);
    });

    it('rejects a response without content', () => {
      const result = validator.validateCallToolResponse({
        jsonrpc: '2.0',
        id: 2,
        result: {}
      });
      assert.equal(result.valid, false);
    });

    it('rejects a response with wrong content type', () => {
      const result = validator.validateCallToolResponse({
        jsonrpc: '2.0',
        id: 2,
        result: {
          content: [{ type: 'image', text: 'data:...' }]
        }
      });
      assert.equal(result.valid, false);
    });
  });
});

// ─── MCPClient (unit, no spawning) ──────────────────────────────

describe('MCPClient', () => {
  it('starts with no tools', () => {
    const client = new MCPClient();
    assert.deepEqual(client.getAvailableTools(), []);
  });

  it('emits events (is an EventEmitter)', () => {
    const client = new MCPClient();
    let received = false;
    client.on('test-event', () => { received = true; });
    client.emit('test-event');
    assert.equal(received, true);
  });

  it('stop() is safe to call without starting', () => {
    const client = new MCPClient();
    // Should not throw
    client.stop();
    assert.ok(true, 'stop() did not throw');
  });
});
