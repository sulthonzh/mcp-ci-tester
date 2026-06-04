import { spawn } from 'child_process';
import { EventEmitter } from 'events';
export class MCPClient extends EventEmitter {
    constructor() {
        super();
        this.process = null;
        this.requestQueue = new Map();
        this.nextId = 1;
        this.inputBuffer = '';
        this.tools = [];
    }
    async start(command, args = []) {
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
    async initialize() {
        const request = {
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
    async listTools() {
        const request = {
            jsonrpc: '2.0',
            id: this.nextId++,
            method: 'tools/list',
            params: {}
        };
        const response = await this.sendRequest(request);
        return response.result.tools || [];
    }
    sendRequest(request) {
        return new Promise((resolve, reject) => {
            const id = request.id;
            this.requestQueue.set(id, { resolve, reject });
            const message = JSON.stringify(request) + '\n';
            if (this.process?.stdin) {
                this.process.stdin.write(message);
            }
        });
    }
    processBuffer() {
        if (!this.process)
            return;
        const lines = this.inputBuffer.split('\n');
        this.inputBuffer = lines.pop() || '';
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const response = JSON.parse(line);
                    this.handleResponse(response);
                }
                catch (error) {
                    this.emit('error', new Error(`Failed to parse JSON: ${line}`));
                }
            }
        }
    }
    handleResponse(response) {
        const { id, result, error } = response;
        if (id !== null && id !== undefined) {
            const request = this.requestQueue.get(id);
            if (request) {
                this.requestQueue.delete(id);
                if (error) {
                    request.reject(new Error(error.message));
                }
                else {
                    request.resolve(response);
                }
            }
        }
    }
    async callTool(name, arguments_ = {}) {
        const request = {
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
    async testToolSchema(tool) {
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
            }
            else {
                return {
                    passed: false,
                    tool: tool.name,
                    message: 'Tool returned invalid response'
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                tool: tool.name,
                message: `Tool test failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    async testToolWithInvalidArguments(tool) {
        try {
            // Test with invalid arguments (missing required fields)
            const response = await this.callTool(tool.name, {});
            if (response.result?.isError === true) {
                return {
                    passed: true,
                    tool: tool.name,
                    message: 'Tool correctly handled invalid arguments with error'
                };
            }
            else {
                return {
                    passed: false,
                    tool: tool.name,
                    message: 'Tool should have returned an error for invalid arguments'
                };
            }
        }
        catch (error) {
            // This is expected behavior
            return {
                passed: true,
                tool: tool.name,
                message: 'Tool correctly rejected invalid arguments'
            };
        }
    }
    getAvailableTools() {
        return this.tools;
    }
    stop() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
//# sourceMappingURL=mcp-client.js.map