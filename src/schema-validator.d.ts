export interface ValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
}
export declare class SchemaValidator {
    private ajv;
    constructor();
    validateToolSchema(tool: any): ValidationResult;
    validateInitializeResponse(response: any): ValidationResult;
    validateCallToolResponse(response: any): ValidationResult;
}
//# sourceMappingURL=schema-validator.d.ts.map