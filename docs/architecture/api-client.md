# API Client Architecture

## Overview

The Netskope API Client provides a robust, production-ready interface to the Netskope NPA API with built-in retry logic, rate limiting, and comprehensive error handling.

## Required API Permissions

### REST API v2 Token Configuration

The MCP server requires specific REST API v2 token permissions to function properly. Below are the required endpoints and their permissions, along with the business justification for each:

#### Read-Only Permissions

| Endpoint | Permission | Tools Using | Justification |
|----------|------------|-------------|---------------|
| `/api/v2/platform/administration/scim/Users` | Read | SCIM Tools | Read organizational user directory for policy validation and user resolution |
| `/api/v2/infrastructure/npa/search` | Read | Search Tools | Discover and inventory existing NPA resources for management operations |
| `/api/v2/scim/Users` | Read | SCIM Tools, Policy Tools | Resolve user identities and validate policy assignments |
| `/api/v2/infrastructure/publishers/releases` | Read | Publisher Tools, Upgrade Tools | Check available publisher software versions for upgrade planning |
| `/api/v2/infrastructure/npa/namevalidation` | Read | Validation Tools | Validate resource naming conventions and prevent conflicts |
| `/api/v2/scim/Groups` | Read | SCIM Tools, Policy Tools | Resolve group memberships for access control policy creation |

#### Read + Write Permissions

| Endpoint | Permission | Tools Using | Justification |
|----------|------------|-------------|---------------|
| `/api/v2/infrastructure/lbrokers` | Read + Write | Local Broker Tools | Full lifecycle management of local broker deployments |
| `/api/v2/steering/apps/private/getpolicyinuse` | Read + Write | Private App Tools, Steering Tools | Query and update policy associations for applications |
| `/api/v2/infrastructure/lbrokers/brokerconfig` | Read + Write | Local Broker Tools | Configure broker settings and deployment parameters |
| `/api/v2/steering/apps/private/publishers` | Read + Write | Private App Tools, Publisher Tools | Manage publisher assignments and load balancing |
| `/api/v2/policy/npa/policygroups` | Read + Write | Policy Tools | Create and manage policy groups for access control |
| `/api/v2/infrastructure/publishers` | Read + Write | Publisher Tools | Full publisher lifecycle management and configuration |
| `/api/v2/steering/apps/private` | Read + Write | Private App Tools | Complete private application management |
| `/api/v2/infrastructure/publisherupgradeprofiles` | Read + Write | Upgrade Profile Tools | Manage automated maintenance schedules |
| `/api/v2/steering/apps/private/tags` | Read + Write | Private App Tools | Tag management for application organization |
| `/api/v2/policy/npa/rules` | Read + Write | Policy Tools | Create and manage access control rules |
| `/api/v2/infrastructure/publishers/alertsconfiguration` | Read + Write | Alert Tools, Publisher Tools | Configure monitoring and alerting for publishers |
| `/api/v2/steering/apps/private/discoverysettings` | Read + Write | Private App Tools | Manage application discovery and auto-onboarding |
| `/api/v2/infrastructure/publisherupgradeprofiles/bulk` | Read + Write | Upgrade Profile Tools | Bulk operations for maintenance scheduling |
| `/api/v2/infrastructure/npa/resource/validation` | Read + Write | Validation Tools | Perform resource validation and compliance checking |
| `/api/v2/steering/apps/private/tags/getpolicyinuse` | Read + Write | Private App Tools, Policy Tools | Validate tag usage in policy assignments |
| `/api/v2/infrastructure/publishers/bulk` | Read + Write | Publisher Tools | Bulk publisher operations for scalable management |

### Permission Categories by Function

#### Infrastructure Management
- **Publishers**: Full CRUD operations, bulk management, alerting configuration
- **Local Brokers**: Complete lifecycle management and configuration
- **Upgrade Profiles**: Automated maintenance scheduling and bulk operations

#### Application & Policy Management  
- **Private Applications**: Full application lifecycle, publisher assignments, tagging
- **Policy Groups & Rules**: Access control policy creation and management
- **Steering & Traffic Management**: Publisher associations and load balancing

#### Identity & Validation
- **SCIM Integration**: User and group resolution for policy validation
- **Resource Validation**: Name validation and configuration compliance
- **Search & Discovery**: Resource inventory and discovery operations

### Security Considerations

1. **Principle of Least Privilege**: Each permission is granted only for specific functional requirements
2. **Read vs Write Separation**: Read permissions for discovery/validation, Write for management operations
3. **Bulk Operations**: Separate endpoints for bulk operations to enable efficient large-scale management
4. **Policy Validation**: Cross-reference permissions ensure policy integrity before changes
5. **Audit Trail**: All write operations are logged for compliance and troubleshooting

### Token Configuration Best Practices

1. **Dedicated Service Token**: Use a dedicated service account token, not a user token
2. **Token Rotation**: Implement regular token rotation (recommended: 90 days)
3. **Environment Separation**: Use separate tokens for development, staging, and production
4. **Monitoring**: Monitor token usage and expiration dates
5. **Backup Tokens**: Maintain backup tokens for business continuity

## Core Components

### NetskopeClient Class

```typescript
export class NetskopeClient {
  private baseUrl: string;
  private token: string;
  private rateLimiter: RateLimiter;
  private retryConfig: RetryConfig;
  
  constructor(config: NetskopeClientConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.retryConfig = config.retry || DEFAULT_RETRY_CONFIG;
  }
}
```

### Configuration Schema

```typescript
const NetskopeClientConfigSchema = z.object({
  baseUrl: z.string().url(),
  token: z.string().min(1),
  rateLimit: z.object({
    requestsPerSecond: z.number().default(10),
    burstLimit: z.number().default(50)
  }).optional(),
  retry: z.object({
    maxAttempts: z.number().default(3),
    backoffMs: z.number().default(1000),
    backoffMultiplier: z.number().default(2)
  }).optional(),
  timeout: z.number().default(30000)
});
```

## Request Flow

### 1. Request Preparation

```typescript
async makeRequest<T>(
  method: HttpMethod,
  path: string,
  data?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  // 1. Validate input parameters
  const url = this.buildUrl(path);
  const headers = this.buildHeaders(options?.headers);
  
  // 2. Apply rate limiting
  await this.rateLimiter.acquire();
  
  // 3. Execute with retry logic
  return this.executeWithRetry(() => 
    this.httpClient.request({ method, url, headers, data })
  );
}
```

### 2. Rate Limiting

```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  
  async acquire(): Promise<void> {
    await this.waitForToken();
    this.tokens--;
  }
  
  private async waitForToken(): Promise<void> {
    while (this.tokens <= 0) {
      await this.refillTokens();
      if (this.tokens <= 0) {
        await this.sleep(100); // Wait 100ms
      }
    }
  }
}
```

### 3. Retry Logic

```typescript
async executeWithRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Calculate backoff delay
      const delay = this.retryConfig.backoffMs * 
                   Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
      
      await this.sleep(delay);
    }
  }
  
  throw lastError;
}
```

## API Endpoint Categories

### Infrastructure Endpoints

```typescript
// Publisher management
GET    /api/v2/infrastructure/publishers
POST   /api/v2/infrastructure/publishers
PUT    /api/v2/infrastructure/publishers/{id}
DELETE /api/v2/infrastructure/publishers/{id}

// Publisher upgrades
GET    /api/v2/infrastructure/publishers/{id}/upgrade
POST   /api/v2/infrastructure/publishers/{id}/upgrade
GET    /api/v2/infrastructure/publishers/releases

// Local brokers
GET    /api/v2/infrastructure/localbrokers
POST   /api/v2/infrastructure/localbrokers
PUT    /api/v2/infrastructure/localbrokers/{id}
```

### Steering Endpoints

```typescript
// Private applications
GET    /api/v2/steering/apps/private
POST   /api/v2/steering/apps/private
PUT    /api/v2/steering/apps/private/{id}
DELETE /api/v2/steering/apps/private/{id}

// Application tags
GET    /api/v2/steering/apps/private/tags
PATCH  /api/v2/steering/apps/private/tags

// Discovery settings
POST   /api/v2/steering/apps/private/discoverysettings
```

### Policy Endpoints

```typescript
// Policy groups
GET    /api/v1/policygroups
POST   /api/v1/policygroups
PUT    /api/v1/policygroups/{id}

// Policy rules
GET    /api/v1/policy/npa
POST   /api/v1/policy/npa
PUT    /api/v1/policy/npa/{id}
```

## Error Handling

### Error Types

```typescript
export class NetskopeApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NetskopeApiError';
  }
}

export class RateLimitError extends NetskopeApiError {
  constructor(retryAfter?: number) {
    super(429, 'RATE_LIMITED', 'Rate limit exceeded', { retryAfter });
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Response Handling

```typescript
private handleErrorResponse(response: HttpResponse): never {
  const { status, data } = response;
  
  switch (status) {
    case 400:
      throw new ValidationError(
        data.message || 'Invalid request parameters',
        data.field,
        data.value
      );
      
    case 401:
      throw new NetskopeApiError(401, 'UNAUTHORIZED', 'Invalid API token');
      
    case 403:
      throw new NetskopeApiError(403, 'FORBIDDEN', 'Insufficient permissions');
      
    case 404:
      throw new NetskopeApiError(404, 'NOT_FOUND', 'Resource not found');
      
    case 429:
      const retryAfter = parseInt(response.headers['retry-after'] || '60');
      throw new RateLimitError(retryAfter);
      
    case 500:
      throw new NetskopeApiError(500, 'SERVER_ERROR', 'Internal server error');
      
    default:
      throw new NetskopeApiError(
        status,
        'UNKNOWN_ERROR',
        `Unexpected error: ${status}`
      );
  }
}
```

## Response Processing

### Data Transformation

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  metadata?: {
    requestId: string;
    timestamp: string;
    rateLimit?: RateLimitInfo;
  };
}

interface RateLimitInfo {
  remaining: number;
  resetTime: string;
  limit: number;
}
```

### Response Validation

```typescript
private validateResponse<T>(
  response: HttpResponse,
  schema: z.ZodSchema<T>
): ApiResponse<T> {
  try {
    const data = schema.parse(response.data);
    return {
      data,
      status: response.status,
      headers: response.headers,
      metadata: this.extractMetadata(response)
    };
  } catch (error) {
    throw new ValidationError(
      'Invalid response format',
      'response',
      response.data
    );
  }
}
```

## Caching Strategy

### Response Caching

```typescript
class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttl = 300000; // 5 minutes
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }
  
  set<T>(key: string, data: T, customTtl?: number): void {
    const expires = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { data, expires });
  }
}
```

### Cache Keys

```typescript
private buildCacheKey(method: string, path: string, params?: object): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${method}:${path}:${this.hashParams(paramString)}`;
}

private shouldCache(method: string, path: string): boolean {
  // Only cache GET requests for specific endpoints
  return method === 'GET' && (
    path.includes('/publishers') ||
    path.includes('/releases') ||
    path.includes('/apps/private') ||
    path.includes('/policygroups')
  );
}
```

## Usage Examples

### Basic Usage

```typescript
const client = new NetskopeClient({
  baseUrl: 'https://tenant.goskope.com',
  token: process.env.NETSKOPE_TOKEN
});

// Get all publishers
const publishers = await client.get('/api/v2/infrastructure/publishers');

// Create a private app
const newApp = await client.post('/api/v2/steering/apps/private', {
  app_name: 'Internal CRM',
  host: 'crm.company.com',
  protocols: [{ type: 'tcp', port: '443' }]
});
```

### Advanced Configuration

```typescript
const client = new NetskopeClient({
  baseUrl: 'https://tenant.goskope.com',
  token: process.env.NETSKOPE_TOKEN,
  rateLimit: {
    requestsPerSecond: 5,
    burstLimit: 20
  },
  retry: {
    maxAttempts: 5,
    backoffMs: 2000,
    backoffMultiplier: 1.5
  },
  timeout: 45000
});
```

### Error Handling

```typescript
try {
  const result = await client.post('/api/v2/steering/apps/private', appData);
  console.log('App created:', result.data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid data:', error.field, error.value);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.details.retryAfter);
  } else if (error instanceof NetskopeApiError) {
    console.error('API error:', error.status, error.code, error.message);
  }
}
```

## Testing

### Mock Client

```typescript
export class MockNetskopeClient extends NetskopeClient {
  private responses = new Map<string, any>();
  
  setMockResponse(method: string, path: string, response: any): void {
    const key = `${method}:${path}`;
    this.responses.set(key, response);
  }
  
  async makeRequest<T>(method: string, path: string, data?: unknown): Promise<ApiResponse<T>> {
    const key = `${method}:${path}`;
    const mockResponse = this.responses.get(key);
    
    if (!mockResponse) {
      throw new Error(`No mock response for ${key}`);
    }
    
    return {
      data: mockResponse,
      status: 200,
      headers: {},
      metadata: { requestId: 'mock-123', timestamp: new Date().toISOString() }
    };
  }
}
```

## Performance Monitoring

### Metrics Collection

```typescript
interface ClientMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  rateLimitHits: number;
  cacheHitRate: number;
}

class MetricsCollector {
  private metrics: ClientMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    rateLimitHits: 0,
    cacheHitRate: 0
  };
  
  recordRequest(duration: number): void {
    this.metrics.requestCount++;
    this.updateAverageResponseTime(duration);
  }
  
  recordError(): void {
    this.metrics.errorCount++;
  }
  
  recordRateLimit(): void {
    this.metrics.rateLimitHits++;
  }
}
```

---

This API client architecture ensures reliable, efficient communication with the Netskope NPA API while providing comprehensive error handling and performance optimization.
