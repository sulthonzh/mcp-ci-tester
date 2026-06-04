import { EventEmitter } from 'events';
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
export declare class MCPClient extends EventEmitter {
    private process;
    private requestQueue;
    private nextId;
    private inputBuffer;
    private tools;
    constructor();
    start(command: string, args?: string[]): Promise<void>;
    private initialize;
    private listTools;
    private sendRequest;
    private processBuffer;
    private handleResponse;
    callTool(name: string, arguments_?: Record<string, any>): Promise<MCPCallToolResponse>;
    testToolSchema(tool: MCPTool): Promise<MCPTestResult>;
    testToolWithInvalidArguments(tool: MCPTool): Promise<MCPTestResult>;
    getAvailableTools(): MCPTool[];
    stop(): void;
}
//# sourceMappingURL=mcp-client.d.ts.map