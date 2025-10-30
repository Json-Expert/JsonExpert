import { Globe, Plus, X, Shield, Info } from 'lucide-react';
import { useState } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createError, ErrorCodes } from '@/lib/error-handler';
import { enhancedFetchJSON, EnhancedURLFetchOptions } from '../../lib/enhanced-url-fetcher';
import { stringifyJSON } from '../../lib/json-parser';
import { fetchJSON, testURLAccessibility, URLFetchOptions } from '../../lib/url-fetcher';
import { useJsonStore } from '../../stores/json-store';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';


interface Header {
  key: string;
  value: string;
}

export const URLFetch: React.FC = () => {
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useCorsProxy, setUseCorsProxy] = useState(false);
  const [authType, setAuthType] = useState<EnhancedURLFetchOptions['authType']>('none');
  const [authValue, setAuthValue] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeout, setTimeout] = useState(30000);
  const [followRedirects, setFollowRedirects] = useState(true);
  const [validateSSL, setValidateSSL] = useState(true);
  const [oauth2Token, setOauth2Token] = useState('');
  const [oauth2Type, setOauth2Type] = useState<'header' | 'query'>('header');
  const { setJsonData, setInputMethod, setError, addToHistory } = useJsonStore();
  const { handleError, showSuccess, showToast } = useErrorHandler();

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    const header = newHeaders[index];
    if (header) {
      header[field] = value;
      setHeaders(newHeaders);
    }
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleTestURL = async () => {
    if (!url) return;

    setIsLoading(true);
    try {
      const result = await testURLAccessibility(url);
      if (result.accessible) {
        showToast({
          title: 'URL is accessible',
          description: result.requiresCorsProxy
            ? 'CORS proxy will be required for this URL'
            : 'Direct access is available',
          variant: result.requiresCorsProxy ? 'warning' : 'success',
        });
        if (result.requiresCorsProxy) {
          setUseCorsProxy(true);
        }
      } else {
        const accessError = createError(
          result.error?.includes('CORS') ? ErrorCodes.CORS_ERROR : ErrorCodes.NETWORK_ERROR,
          result.error ?? 'Please check the URL and try again'
        );
        handleError(accessError, {
          context: 'URLFetch',
          toastTitle: 'URL not accessible',
        });
      }
    } catch (error) {
      handleError(error, {
        context: 'URLFetch',
        toastTitle: 'Test failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = async () => {
    try {
      const headersObject = headers.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const fetchOptions: EnhancedURLFetchOptions = {
        url,
        headers: headersObject,
        timeout,
        useCorsProxy,
        authType: authType || 'none',
        authValue,
        apiKeyHeader,
        username,
        password,
        oauth2Token,
        oauth2Type,
        followRedirects,
        validateSSL,
        retryAttempts: 3,
        retryDelay: 1000,
        responseType: 'auto',
      };

      setIsLoading(true);
      setError(null);

      // Try enhanced fetcher first, fallback to standard if needed
      let result = await enhancedFetchJSON(fetchOptions);
      
      if (!result.success && !result.data) {
        showToast({
          title: 'Trying alternative fetcher',
          description: 'Enhanced fetch failed, trying standard fetcher...',
          variant: 'info',
        });
        
        // Fallback to standard fetcher
        const standardOptions: URLFetchOptions = {
          url,
          headers: headersObject,
          timeout,
          useCorsProxy,
          authType: authType === 'oauth2' ? 'bearer' : authType as any,
          authValue: authType === 'oauth2' ? oauth2Token : authValue,
          apiKeyHeader,
          username,
          password,
          retryAttempts: 2,
          retryDelay: 1000,
        };
        result = await fetchJSON(standardOptions) as any;
      }
      
      if (result.success && result.data) {
        const jsonString = stringifyJSON(result.data);
        setJsonData(result.data, jsonString);
        setInputMethod('url');
        addToHistory('url', jsonString);

        // Show metadata with success toast
        const metadataDesc = result.metadata
          ? `Response time: ${result.metadata.responseTime.toFixed(0)}ms, Size: ${(result.metadata.size / 1024).toFixed(2)}KB`
          : undefined;
        showSuccess('Fetch successful', metadataDesc);

        // Show warnings
        if (result.warnings) {
          result.warnings.forEach(warning => {
            showToast({
              title: 'Warning',
              description: warning,
              variant: 'warning',
            });
          });
        }

        // Reset form
        setUrl('');
        setHeaders([]);
        setAuthType('none');
        setAuthValue('');
        setUsername('');
        setPassword('');
      } else {
        // Determine error type based on the error message
        const errorMsg = result.error ?? 'Failed to fetch JSON';
        let errorCode: keyof typeof ErrorCodes = 'NETWORK_ERROR';

        if (errorMsg.includes('CORS') || errorMsg.includes('cors')) {
          errorCode = 'CORS_ERROR';
        } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          errorCode = 'TIMEOUT_ERROR';
        } else if (errorMsg.includes('auth') || errorMsg.includes('401') || errorMsg.includes('403')) {
          errorCode = 'AUTH_ERROR';
        } else if (errorMsg.includes('JSON') || errorMsg.includes('parse')) {
          errorCode = 'JSON_PARSE_ERROR';
        }

        const fetchError = createError(errorCode, errorMsg);
        handleError(fetchError, { context: 'URLFetch' });
        setError(errorMsg);
      }
    } catch (error) {
      handleError(error, {
        context: 'URLFetch',
        toastTitle: 'Failed to fetch URL',
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch URL';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          Fetch from URL
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="url-input" className="text-sm font-medium">URL</label>
          <div className="flex gap-2 mt-1">
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/data.json"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestURL}
              disabled={!url || isLoading}
              title="Test URL accessibility"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Authentication</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Shield className="mr-1 h-3 w-3" />
                  {authType === 'none' ? 'None' : 
                   authType === 'bearer' ? 'Bearer' : 
                   authType === 'apikey' ? 'API Key' : 
                   authType === 'basic' ? 'Basic' : 
                   authType === 'oauth2' ? 'OAuth 2.0' :
                   'Custom'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setAuthType('none')}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAuthType('bearer')}>Bearer Token</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAuthType('apikey')}>API Key</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAuthType('basic')}>Basic Auth</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAuthType('oauth2')}>OAuth 2.0</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAuthType('custom')}>Custom Headers</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {authType === 'bearer' && (
            <div>
              <input
                type="password"
                value={authValue}
                onChange={(e) => setAuthValue(e.target.value)}
                placeholder="Bearer token"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          
          {authType === 'apikey' && (
            <div className="space-y-2">
              <input
                type="text"
                value={apiKeyHeader}
                onChange={(e) => setApiKeyHeader(e.target.value)}
                placeholder="Header name (e.g., X-API-Key)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={authValue}
                onChange={(e) => setAuthValue(e.target.value)}
                placeholder="API key value"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          
          {authType === 'basic' && (
            <div className="space-y-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          
          {authType === 'oauth2' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={oauth2Type}
                  onChange={(e) => setOauth2Type(e.target.value as 'header' | 'query')}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="header">Authorization Header</option>
                  <option value="query">Query Parameter</option>
                </select>
              </div>
              <input
                type="password"
                value={oauth2Token}
                onChange={(e) => setOauth2Token(e.target.value)}
                placeholder="OAuth 2.0 Access Token"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Headers (Optional)</label>
            <Button
              variant="outline"
              size="sm"
              onClick={addHeader}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Header
            </Button>
          </div>
          
          {headers.map((header, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header name"
                className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Header value"
                className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cors-proxy"
              checked={useCorsProxy}
              onChange={(e) => setUseCorsProxy(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="cors-proxy" className="text-sm text-muted-foreground">
              Use CORS proxy (for cross-origin requests)
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-advanced"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="show-advanced" className="text-sm text-muted-foreground">
              Show advanced options
            </label>
          </div>
        </div>
        
        {showAdvanced && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
            <div>
              <label htmlFor="timeout-input" className="text-sm font-medium">Timeout (ms)</label>
              <input
                id="timeout-input"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                min="1000"
                max="120000"
                step="1000"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Request timeout in milliseconds</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="follow-redirects"
                  checked={followRedirects}
                  onChange={(e) => setFollowRedirects(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="follow-redirects" className="text-sm text-muted-foreground">
                  Follow redirects (3xx responses)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="validate-ssl"
                  checked={validateSSL}
                  onChange={(e) => setValidateSSL(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="validate-ssl" className="text-sm text-muted-foreground">
                  Validate SSL certificates
                </label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleFetch}
          disabled={!url || isLoading}
          className="w-full"
        >
          {isLoading ? 'Fetching...' : 'Fetch JSON'}
        </Button>
      </CardFooter>
    </Card>
  );
};