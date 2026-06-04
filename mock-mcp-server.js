#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.error('Mock MCP Server started');

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    
    if (request.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'mock-mcp-server',
            version: '1.0.0'
          }
        }
      };
      
      console.log(JSON.stringify(response));
      
      // After initialize, send tool list automatically
      setTimeout(() => {
        const toolsResponse = {
          jsonrpc: '2.0',
          id: 2,
          result: {
            tools: [
              {
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
              },
              {
                name: 'add',
                description: 'Add two numbers',
                inputSchema: {
                  type: 'object',
                  properties: {
                    a: { type: 'number' },
                    b: { type: 'number' }
                  },
                  required: ['a', 'b']
                }
              }
            ]
          }
        };
        
        console.log(JSON.stringify(toolsResponse));
      }, 100);
      
    } else if (request.method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
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
            },
            {
              name: 'add',
              description: 'Add two numbers',
              inputSchema: {
                type: 'object',
                properties: {
                  a: { type: 'number' },
                  b: { type: 'number' }
                },
                required: ['a', 'b']
              }
            }
          ]
        }
      };
      
      console.log(JSON.stringify(response));
      
    } else if (request.method === 'tools/call') {
      const toolName = request.params.name;
      const args = request.params.arguments || {};
      
      let result;
      
      if (toolName === 'echo') {
        result = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: args.message || 'Echo'
              }
            ]
          }
        };
      } else if (toolName === 'add') {
        const sum = (args.a || 0) + (args.b || 0);
        result = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: sum.toString()
              }
            ]
          }
        };
      } else {
        result = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${toolName}`
              }
            ],
            isError: true
          }
        };
      }
      
      console.log(JSON.stringify(result));
    } else {
      // Unknown method
      const error = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      
      console.log(JSON.stringify(error));
    }
  } catch (error) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error'
      }
    };
    
    console.log(JSON.stringify(errorResponse));
  }
});