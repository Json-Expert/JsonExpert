import { Shield, CheckCircle, XCircle, FileJson, X } from 'lucide-react';
import { useState } from 'react';

import { schemaValidator, commonSchemas, JsonSchema, ValidationError } from '../../lib/schema-validator';
import { cn } from '../../lib/utils';
import { useJsonStore } from '../../stores/json-store';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface SchemaValidatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaValidatorComponent: React.FC<SchemaValidatorProps> = ({ isOpen, onClose }) => {
  const { data } = useJsonStore();
  const [selectedSchema, setSelectedSchema] = useState<string>('custom');
  const [customSchema, setCustomSchema] = useState<string>('{}');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: ValidationError[] } | null>(null);

  const handleSchemaChange = (schemaName: string) => {
    setSelectedSchema(schemaName);
    if (schemaName !== 'custom') {
      const schema = commonSchemas[schemaName as keyof typeof commonSchemas];
      setCustomSchema(JSON.stringify(schema, null, 2));
    }
  };

  const generateSchema = () => {
    if (data) {
      const generatedSchema = schemaValidator.generateSchemaFromData(data);
      setCustomSchema(JSON.stringify(generatedSchema, null, 2));
      setSelectedSchema('custom');
    }
  };

  const validateData = () => {
    if (!data) return;

    try {
      const schema: JsonSchema = JSON.parse(customSchema);
      const result = schemaValidator.validateAgainstSchema(data, schema);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [{
          path: 'schema',
          message: 'Invalid JSON schema format',
          value: customSchema,
        }],
      });
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      
      <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            JSON Schema Validation
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 overflow-auto">
          {!data && (
            <div className="text-center text-muted-foreground">
              Load JSON data first to validate against a schema
            </div>
          )}
          
          {data && (
            <>
              <div>
                <div className="text-sm font-medium mb-2 block">Schema Template</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    variant={selectedSchema === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSchemaChange('custom')}
                  >
                    Custom
                  </Button>
                  {Object.keys(commonSchemas).map((schemaName) => (
                    <Button
                      key={schemaName}
                      variant={selectedSchema === schemaName ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSchemaChange(schemaName)}
                    >
                      {schemaName.charAt(0).toUpperCase() + schemaName.slice(1)}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSchema}
                  >
                    <FileJson className="h-3 w-3 mr-1" />
                    Generate from Data
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="json-schema" className="text-sm font-medium mb-2 block">JSON Schema</label>
                  <textarea
                    id="json-schema"
                    value={customSchema}
                    onChange={(e) => setCustomSchema(e.target.value)}
                    className="w-full h-64 p-3 border border-input rounded-md font-mono text-sm bg-background"
                    placeholder="Enter JSON Schema..."
                  />
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2 block">Validation Result</div>
                  <div className="h-64 border border-input rounded-md p-3 overflow-auto bg-muted/20">
                    {!validationResult && (
                      <div className="text-center text-muted-foreground mt-20">
                        Click &quot;Validate&quot; to check your data against the schema
                      </div>
                    )}
                    
                    {validationResult && (
                      <div className="space-y-2">
                        <div className={cn(
                          'flex items-center gap-2 p-2 rounded text-sm font-medium',
                          validationResult.isValid 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        )}>
                          {validationResult.isValid ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Valid - JSON matches schema
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Invalid - {validationResult.errors.length} error(s) found
                            </>
                          )}
                        </div>
                        
                        {validationResult.errors.map((error, index) => (
                          <div key={index} className="border-l-2 border-red-500 pl-3 py-1">
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">
                              {error.path || 'root'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {error.message}
                            </div>
                            {error.value !== undefined && (
                              <div className="text-xs font-mono bg-muted p-1 mt-1 rounded">
                                Value: {JSON.stringify(error.value)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Schema validation helps ensure your JSON data follows expected structure and constraints
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={validateData}>
                    Validate
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};