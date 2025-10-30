export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

export interface ParsedJson {
  data: JsonValue;
  raw: string;
  size: number;
  lineCount: number;
  isValid: boolean;
  error?: string;
}

export interface JsonPath {
  path: string[];
  value: JsonValue;
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
}