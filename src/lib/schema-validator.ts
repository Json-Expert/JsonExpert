import { JsonValue } from '../types/json.types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
  schema?: any;
}

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  additionalProperties?: boolean | JsonSchema;
  description?: string;
  title?: string;
}

class SchemaValidator {
  validateAgainstSchema(data: JsonValue, schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    
    this.validateRecursive(data, schema, '', errors);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateRecursive(
    data: JsonValue,
    schema: JsonSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    // Type validation
    if (schema.type) {
      const actualType = this.getValueType(data);
      const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
      
      if (!expectedTypes.includes(actualType)) {
        errors.push({
          path,
          message: `Expected type ${expectedTypes.join(' or ')}, got ${actualType}`,
          value: data,
          schema,
        });
        return; // Skip further validation if type is wrong
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value: data,
        schema,
      });
    }

    // String validations
    if (typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push({
          path,
          message: `String length must be at least ${schema.minLength}`,
          value: data,
          schema,
        });
      }
      
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push({
          path,
          message: `String length must be at most ${schema.maxLength}`,
          value: data,
          schema,
        });
      }
      
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({
            path,
            message: `String does not match pattern: ${schema.pattern}`,
            value: data,
            schema,
          });
        }
      }
    }

    // Number validations
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({
          path,
          message: `Value must be at least ${schema.minimum}`,
          value: data,
          schema,
        });
      }
      
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({
          path,
          message: `Value must be at most ${schema.maximum}`,
          value: data,
          schema,
        });
      }
    }

    // Object validations
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, JsonValue>;
      
      // Required properties
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (!(requiredProp in obj)) {
            errors.push({
              path: path ? `${path}.${requiredProp}` : requiredProp,
              message: `Required property '${requiredProp}' is missing`,
              value: data,
              schema,
            });
          }
        }
      }
      
      // Property validations
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in obj) {
            const propPath = path ? `${path}.${prop}` : prop;
            const propValue = obj[prop];
            if (propValue !== undefined) {
              this.validateRecursive(propValue, propSchema, propPath, errors);
            }
          }
        }
      }
      
      // Additional properties
      if (schema.additionalProperties === false && schema.properties) {
        const allowedProps = Object.keys(schema.properties);
        for (const prop of Object.keys(obj)) {
          if (!allowedProps.includes(prop)) {
            const propValue = obj[prop];
            errors.push({
              path: path ? `${path}.${prop}` : prop,
              message: `Additional property '${prop}' is not allowed`,
              value: propValue,
              schema,
            });
          }
        }
      }
    }

    // Array validations
    if (Array.isArray(data)) {
      if (schema.items) {
        data.forEach((item, index) => {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`;
          this.validateRecursive(item, schema.items!, itemPath, errors);
        });
      }
    }
  }

  private getValueType(value: JsonValue): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  // Common schema generators
  generateSchemaFromData(data: JsonValue): JsonSchema {
    if (data === null) {
      return { type: 'null' };
    }
    
    if (Array.isArray(data)) {
      const itemSchemas = data.map(item => this.generateSchemaFromData(item));
      // Merge schemas if all items have similar structure
      return {
        type: 'array',
        items: itemSchemas[0] ?? { type: 'null' },
      };
    }
    
    if (typeof data === 'object') {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(data)) {
        properties[key] = this.generateSchemaFromData(value);
        required.push(key);
      }
      
      return {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      };
    }
    
    if (typeof data === 'string') {
      return {
        type: 'string',
        minLength: 1,
      };
    }
    
    if (typeof data === 'number') {
      return {
        type: 'number',
      };
    }
    
    if (typeof data === 'boolean') {
      return {
        type: 'boolean',
      };
    }
    
    return { type: 'string' };
  }
}

export const schemaValidator = new SchemaValidator();

// Predefined common schemas
export const commonSchemas = {
  user: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      age: { type: 'number', minimum: 0, maximum: 150 },
      active: { type: 'boolean' },
    },
    required: ['id', 'name', 'email'],
    additionalProperties: false,
  },
  
  apiResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {},
      message: { type: 'string' },
      errors: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['success'],
    additionalProperties: true,
  },
  
  config: {
    type: 'object',
    properties: {
      environment: { 
        type: 'string', 
        enum: ['development', 'staging', 'production'] 
      },
      debug: { type: 'boolean' },
      timeout: { type: 'number', minimum: 0 },
      retries: { type: 'number', minimum: 0, maximum: 10 },
    },
    required: ['environment'],
    additionalProperties: true,
  },
} as const;