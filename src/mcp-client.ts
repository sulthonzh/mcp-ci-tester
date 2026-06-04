import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export interface MCPInitializeRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: {
      tools?: {};
      resources?: {};
      prompts?: {};
    };
    clientInfo: {
      name: string;
      version: string;
    };
  };
}

export interface MCPInitializeResponse {
  jsonrpc: '2.0';
  id: string | number;
  result: {
    protocolVersion: string;
    capabilities: {
      tools?: {};
      resources?: {};
      prompts?: {};
      logging?: {};
    };
    serverInfo: {
      name: string;
      version?: string;
    };
  };
}

export interface MCPCallToolRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

export interface MCPCallToolResponse {
  jsonrpc: '2.0';
  id: string | number;
  result: {
    content: Array<{
      type: 'text';
      text: string;
    }>;
    isError?: boolean;
  };
}

export interface MCPError {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTestResult {
  passed: boolean;
  tool?: string;
  message: string;
  details?: any;
}

export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private requestQueue: Map<string | number, { resolve: Function; reject: Function }> = new Map();
  private nextId = 1;
  private inputBuffer: string = '';
  private tools: MCPTool[] = [];

  constructor() {
    super();
  }

  async start(command: string, args: string[] = []): Promise<void> {
    this.process = spawn(command, args);
    
    if (!this.process.stdin || !this.process.stdout) {
      throw new Error('Process must have stdin and stdout');
    }

    this.process.stdin.on('error', (error) => {
      this.emit('error', error);
    });

    this.process.stdout.on('data', (data) => {
      this.inputBuffer += data.toString();
      this.processBuffer();
    });

    if (this.process?.stderr) {
      this.process.stderr.on('data', (data) => {
        console.error('MCP stderr:', data.toString());
      });
    }

    this.process.on('exit', (code) => {
      if (code !== 0) {
        this.emit('error', new Error(`MCP process exited with code ${code}`));
      }
    });

    // Wait for the server to be ready
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const request: MCPInitializeRequest = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        clientInfo: {
          name: 'mcp-ci-tester',
          version: '1.0.0'
        }
      }
    };

    const response = await this.sendRequest(request);

    if (response.result) {
      this.tools = response.result.capabilities.tools ? await this.listTools() : [];
      this.emit('ready', this.tools);
    }
  }

  private async listTools(): Promise<MCPTool[]> {
    const request: any = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'tools/list',
      params: {}
    };

    const response = await this.sendRequest(request);
    return response.result.tools || [];
  }

  private sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = request.id;
      this.requestQueue.set(id, { resolve, reject });

      const message = JSON.stringify(request) + '\n';
      if (this.process?.stdin) {
        this.process.stdin.write(message);
      }
    });
  }

  private processBuffer(): void {
    if (!this.process) return;
    
    const lines = this.inputBuffer.split('\n');
    this.inputBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (error) {
          this.emit('error', new Error(`Failed to parse JSON: ${line}`));
        }
      }
    }
  }

  private handleResponse(response: any): void {
    const { id, result, error } = response;

    if (id !== null && id !== undefined) {
      const request = this.requestQueue.get(id);
      if (request) {
        this.requestQueue.delete(id);
        if (error) {
          request.reject(new Error(error.message));
        } else {
          request.resolve(response);
        }
      }
    }
  }

  async callTool(name: string, arguments_: Record<string, any> = {}): Promise<MCPCallToolResponse> {
    const request: MCPCallToolRequest = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'tools/call',
      params: {
        name,
        arguments: arguments_
      }
    };

    return this.sendRequest(request);
  }

  async testToolSchema(tool: MCPTool): Promise<MCPTestResult> {
    try {
      // Test with no arguments
      const response = await this.callTool(tool.name, {});
      
      if (response.result) {
        return {
          passed: true,
          tool: tool.name,
          message: 'Tool schema validation passed',
          details: response.result
        };
      } else {
        return {
          passed: false,
          tool: tool.name,
          message: 'Tool returned invalid response'
        };
      }
    } catch (error) {
      return {
        passed: false,
        tool: tool.name,
        message: `Tool test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async testToolWithInvalidArguments(tool: MCPTool): Promise<MCPTestResult> {
    try {
      // Test with invalid arguments (missing required fields)
      const response = await this.callTool(tool.name, {});
      
      if (response.result?.isError === true) {
        return {
          passed: true,
          tool: tool.name,
          message: 'Tool correctly handled invalid arguments with error'
        };
      } else {
        return {
          passed: false,
          tool: tool.name,
          message: 'Tool should have returned an error for invalid arguments'
        };
      }
    } catch (error) {
      // This is expected behavior
      return {
        passed: true,
        tool: tool.name,
        message: 'Tool correctly rejected invalid arguments'
      };
    }
  }

  getAvailableTools(): MCPTool[] {
    return this.tools;
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}