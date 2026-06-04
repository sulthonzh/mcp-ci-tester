import * as Ajv from 'ajv';
import addFormats from 'ajv-formats';
export class SchemaValidator {
    constructor() {
        this.ajv = new Ajv.default({
            allErrors: true,
            strict: true,
            verbose: true
        });
        addFormats(this.ajv);
    }
    validateToolSchema(tool) {
        const schema = {
            type: 'object',
            required: ['name', 'inputSchema'],
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    pattern: '^[a-z][a-z0-9_-]*$'
                },
                description: {
                    type: 'string',
                    maxLength: 1000
                },
                inputSchema: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null']
                        },
                        properties: {
                            type: 'object',
                            additionalProperties: {
                                oneOf: [
                                    { type: 'object' },
                                    { type: 'string' },
                                    { type: 'number' },
                                    { type: 'boolean' },
                                    { type: 'array' }
                                ]
                            }
                        },
                        required: {
                            type: 'array',
                            items: { type: 'string' },
                            uniqueItems: true
                        },
                        additionalProperties: {
                            oneOf: [
                                { type: 'boolean' },
                                { type: 'object' },
                                { type: 'string' },
                                { type: 'number' },
                                { type: 'boolean' }
                            ]
                        },
                        items: {
                            oneOf: [
                                { type: 'object' },
                                { type: 'string' },
                                { type: 'number' },
                                { type: 'boolean' }
                            ]
                        },
                        enum: {
                            type: 'array',
                            items: true
                        },
                        const: true,
                        multipleOf: {
                            type: 'number',
                            exclusiveMinimum: 0
                        },
                        maximum: { type: 'number' },
                        exclusiveMaximum: { type: 'number' },
                        minimum: { type: 'number' },
                        exclusiveMinimum: { type: 'number' },
                        minLength: { type: 'integer', minimum: 0 },
                        maxLength: { type: 'integer', minimum: 0 },
                        pattern: { type: 'string' },
                        format: { type: 'string' },
                        default: true,
                        deprecated: { type: 'boolean' },
                        description: { type: 'string' },
                        title: { type: 'string' },
                        examples: { type: 'array' }
                    }
                }
            }
        };
        const validate = this.ajv.compile(schema);
        const valid = validate(tool);
        if (!valid) {
            const errors = validate.errors?.map(error => {
                const instancePath = error.instancePath || 'root';
                const message = error.message || 'Unknown error';
                return `${instancePath}: ${message}`;
            }) || [];
            return {
                valid: false,
                errors,
                warnings: []
            };
        }
        return {
            valid: true,
            errors: [],
            warnings: []
        };
    }
    validateInitializeResponse(response) {
        const schema = {
            type: 'object',
            required: ['jsonrpc', 'id', 'result'],
            properties: {
                jsonrpc: {
                    type: 'string',
                    const: '2.0'
                },
                id: {
                    oneOf: [
                        { type: 'string' },
                        { type: 'number' }
                    ]
                },
                result: {
                    type: 'object',
                    required: ['protocolVersion', 'capabilities', 'serverInfo'],
                    properties: {
                        protocolVersion: {
                            type: 'string',
                            pattern: '^2024-11-05$'
                        },
                        capabilities: {
                            type: 'object',
                            properties: {
                                tools: { type: 'object' },
                                resources: { type: 'object' },
                                prompts: { type: 'object' },
                                logging: { type: 'object' }
                            },
                            additionalProperties: false
                        },
                        serverInfo: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: { type: 'string' },
                                version: { type: 'string' }
                            }
                        }
                    }
                }
            }
        };
        const validate = this.ajv.compile(schema);
        const valid = validate(response);
        if (!valid) {
            const errors = validate.errors?.map(error => {
                const instancePath = error.instancePath || 'root';
                const message = error.message || 'Unknown error';
                return `${instancePath}: ${message}`;
            }) || [];
            return {
                valid: false,
                errors,
                warnings: []
            };
        }
        return {
            valid: true,
            errors: [],
            warnings: []
        };
    }
    validateCallToolResponse(response) {
        const schema = {
            type: 'object',
            required: ['jsonrpc', 'id', 'result'],
            properties: {
                jsonrpc: {
                    type: 'string',
                    const: '2.0'
                },
                id: {
                    oneOf: [
                        { type: 'string' },
                        { type: 'number' }
                    ]
                },
                result: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        content: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['type', 'text'],
                                properties: {
                                    type: { type: 'string', const: 'text' },
                                    text: { type: 'string' }
                                }
                            }
                        },
                        isError: { type: 'boolean' }
                    }
                },
                error: {
                    type: 'object',
                    required: ['code', 'message'],
                    properties: {
                        code: { type: 'number' },
                        message: { type: 'string' },
                        data: true
                    }
                }
            }
        };
        const validate = this.ajv.compile(schema);
        const valid = validate(response);
        if (!valid) {
            const errors = validate.errors?.map(error => {
                const instancePath = error.instancePath || 'root';
                const message = error.message || 'Unknown error';
                return `${instancePath}: ${message}`;
            }) || [];
            return {
                valid: false,
                errors,
                warnings: []
            };
        }
        return {
            valid: true,
            errors: [],
            warnings: []
        };
    }
}
//# sourceMappingURL=schema-validator.js.map