# Private Application Tools

Private Application tools manage the complete lifecycle of applications in the Netskope NPA environment, from creation and configuration to policy enforcement and monitoring.

## Tool Overview

| Tool Name | HTTP Method | Purpose | Dependencies |
|-----------|-------------|---------|--------------|
| `createPrivateApp` | POST | Create new private applications | `validateName`, `searchPublishers` |
| `updatePrivateApp` | PATCH | Partial application updates | `getPrivateApp` |
| `replacePrivateApp` | PUT | Complete application replacement | `getPrivateApp` |
| `deletePrivateApp` | DELETE | Remove applications permanently | Cascade validation |
| `getPrivateApp` | GET | Retrieve detailed app information | None |
| `listPrivateApps` | GET | Query applications with filtering | None |
| `listPrivateAppTags` | GET | List available application tags | None |
| `createPrivateAppTags` | POST | Associate tags with apps | `getPrivateApp` |
| `updatePrivateAppTags` | PUT | Bulk replace tags on multiple apps | `listPrivateApps` |
| `patchPrivateAppTags` | PATCH | Update tags for specific app | `getPrivateApp` |
| `deleteTags` | DELETE | Remove tags from apps | Tag validation |
| `getPolicyInUse` | GET | Check policy associations | None |
| `getTagPolicyInUse` | GET | Find policies using specific tags | None |
| `updateDiscoverySettings` | POST | Configure application discovery | Validation |

## Application Lifecycle Tools

### 1. createPrivateApp

**Purpose**: Create new private applications with support for both clientless (web) and client-based (network) access patterns.

**Schema**:
```typescript
{
  app_name: string,              // Unique application name (1-64 chars)
  host: string,                  // Target hostname or IP address
  protocols: Array<{             // Application protocols and ports
    type: 'tcp' | 'udp' | 'http' | 'https',
    port: string                 // Single port, range (8000-8080), or list (80,443,8080)
  }>,
  description?: string,          // Optional application description
  clientless_access?: boolean,   // Enable web-based access (default: false)
  use_publisher_dns?: boolean,   // Use publisher DNS resolution (default: false)
  trust_self_signed_certs?: boolean, // Accept self-signed certificates (default: false)
  publisher_ids?: number[],      // Associated publisher IDs
  tags?: Array<{                 // Application tags for organization
    tag_name: string,
    tag_value?: string
  }>
}
```

**API Endpoint**: `POST /api/v2/steering/apps/private`

**Application Types**:

1. **Clientless Applications** (Web-based access):
   ```typescript
   {
     app_name: "internal-wiki",
     host: "wiki.internal.com", 
     protocols: [{type: 'https', port: '443'}],
     clientless_access: true,     // Enables web interface
     trust_self_signed_certs: false
   }
   ```

2. **Client Applications** (Network-based access):
   ```typescript
   {
     app_name: "database-cluster",
     host: "db.internal.com",
     protocols: [
       {type: 'tcp', port: '3306'},     // MySQL
       {type: 'tcp', port: '5432'}      // PostgreSQL
     ],
     clientless_access: false,    // Requires client software
     use_publisher_dns: true      // Use internal DNS
   }
   ```

**Port Format Support**:

- **Single Port**: `"80"`, `"443"`, `"8080"`
- **Port Range**: `"8000-8080"`, `"3000-3010"`  
- **Port List**: `"80,443,8080"`, `"3306,5432,27017"`

**Validation Logic**:
```typescript
// Clientless apps must have clientless_access enabled
if (appType === 'clientless' && !params.clientless_access) {
  throw new Error('Clientless applications must have clientless_access enabled');
}

// Client apps require network protocols
if (appType === 'client') {
  const hasNetworkProtocol = params.protocols.some(p => ['tcp', 'udp'].includes(p.type));
  if (!hasNetworkProtocol) {
    throw new Error('Client applications require network protocols (tcp, udp)');
  }
}
```

**Real-World Creation Workflows**:

1. **Internal Web Application**:
   ```
   User: "Add the company intranet site to NPA"
   Flow:
   1. validateName({resourceType: 'private_app', name: 'company-intranet'})
   2. searchPublishers({name: 'headquarters'}) → Get publisher ID
   3. createPrivateApp({
        app_name: 'company-intranet',
        host: 'intranet.company.com',
        protocols: [{type: 'https', port: '443'}],
        clientless_access: true,
        publisher_ids: [publisherIds],
        tags: [{tag_name: 'department', tag_value: 'IT'}]
      })
   ```

2. **Database Access**:
   ```
   User: "Set up secure access to the production database"
   Flow:
   1. searchPublishers({name: 'production'}) → Get publisher in prod environment
   2. createPrivateApp({
        app_name: 'prod-database',
        host: 'db.prod.internal',
        protocols: [
          {type: 'tcp', port: '5432'},  // PostgreSQL
          {type: 'tcp', port: '6432'}   // Connection pooler
        ],
        clientless_access: false,
        use_publisher_dns: true,
        publisher_ids: [prodPublisherId],
        tags: [
          {tag_name: 'environment', tag_value: 'production'},
          {tag_name: 'data-classification', tag_value: 'confidential'}
        ]
      })
   ```

### 2. updatePrivateApp & replacePrivateApp

**updatePrivateApp (PATCH)**: Partial updates to existing applications
**replacePrivateApp (PUT)**: Complete replacement of application configuration

**Update Schema**:
```typescript
{
  id: string,                    // Application ID (required)
  app_name?: string,             // New application name
  host?: string,                 // Updated hostname
  protocols?: Array<Protocol>,   // Modified protocols
  description?: string,          // Updated description
  clientless_access?: boolean,   // Change access type
  use_publisher_dns?: boolean,   // DNS setting changes
  trust_self_signed_certs?: boolean // Certificate handling
}
```

**Data Transformation**:
The tools automatically transform MCP parameters to Netskope API format:

```typescript
// Transform protocols for API compatibility
const apiPayload = {
  ...params,
  protocols: params.protocols.map(p => ({
    type: p.type,
    ports: [p.port]  // API expects array format
  })),
  // Map boolean fields to API names
  isSelfSignedCert: params.trust_self_signed_certs,
  // Add computed fields
  hostType: determineHostType(params.protocols)
};
```

**Update Scenarios**:

1. **Protocol Changes**:
   ```typescript
   // Add HTTPS support to existing HTTP app
   await updatePrivateApp({
     id: "12345",
     protocols: [
       {type: 'http', port: '80'},
       {type: 'https', port: '443'}  // Added HTTPS
     ]
   });
   ```

2. **Enable Clientless Access**:
   ```typescript
   // Convert client app to support web access
   await updatePrivateApp({
     id: "12345", 
     clientless_access: true,
     protocols: [{type: 'https', port: '443'}]
   });
   ```

### 3. getPrivateApp & listPrivateApps

**getPrivateApp**: Retrieve detailed information about a specific application.

**Schema**:
```typescript
{
  id: string  // Application ID or name
}
```

**Response Structure**:
```typescript
{
  status: 'success' | 'not found',
  data: {
    app_id: number,
    app_name: string,
    host: string,
    protocols: Array<{
      type: string,
      ports: number[]
    }>,
    description?: string,
    clientless_access: boolean,
    use_publisher_dns: boolean,
    trust_self_signed_certs: boolean,
    status: 'reachable' | 'unreachable',
    publisher_ids: number[],
    tags: Array<{
      tag_id: number,
      tag_name: string,
      tag_value?: string
    }>,
    health_check: {
      last_check: string,
      status: 'healthy' | 'warning' | 'critical',
      response_time_ms: number
    },
    usage_stats: {
      active_connections: number,
      total_connections_today: number,
      data_transferred_mb: number
    }
  }
}
```

**listPrivateApps**: Query applications with advanced filtering capabilities.

**Schema**:
```typescript
{
  limit?: number,                    // Results per page (default: 100)
  offset?: number,                   // Pagination offset
  query?: string,                    // General search query
  app_name?: string,                 // Filter by application name
  publisher_name?: string,           // Filter by publisher name  
  reachable?: boolean,               // Filter by reachability status
  clientless_access?: boolean,       // Filter by access type
  use_publisher_dns?: boolean,       // Filter by DNS setting
  host?: string,                     // Filter by hostname
  in_steering?: boolean,             // Filter by steering policy presence
  in_policy?: boolean,               // Filter by access policy presence
  private_app_protocol?: string      // Filter by protocol type
}
```

**Query Building**:
The tool automatically constructs search queries:

```typescript
// Simple name search
await listPrivateApps({query: 'database'});
// Becomes: "app_name has database"

// Complex filtering
await listPrivateApps({
  clientless_access: true,
  reachable: true,
  publisher_name: 'production'
});
```

**Real-World Query Examples**:

1. **Find Unhealthy Applications**:
   ```typescript
   const unhealthyApps = await listPrivateApps({
     reachable: false
   });
   ```

2. **Audit Clientless Applications**:
   ```typescript
   const webApps = await listPrivateApps({
     clientless_access: true,
     in_policy: true  // Ensure they have access policies
   });
   ```

3. **Publisher-Specific Applications**:
   ```typescript
   const publisherApps = await listPrivateApps({
     publisher_name: 'london-office',
     limit: 50
   });
   ```

## Tag Management Tools

### 4. Tag Operations

**listPrivateAppTags**: List all available application tags.

**Schema**:
```typescript
{
  query?: string,    // Search tag names
  limit?: number,    // Results limit
  offset?: number    // Pagination offset
}
```

**createPrivateAppTags**: Associate tags with a specific application.

**Schema**:
```typescript
{
  id: string,        // Application ID
  tags: Array<{      // Tags to add
    tag_name: string,
    tag_value?: string
  }>
}
```

**updatePrivateAppTags**: Bulk replace tags on multiple applications.

**Schema**:
```typescript
{
  ids: string[],     // Application IDs
  tags: Array<{      // Replacement tags
    tag_name: string,
    tag_value?: string  
  }>
}
```

**patchPrivateAppTags**: Update tags for a specific application using PATCH method.

**Schema**:
```typescript
{
  appId: string,     // Application ID
  tags: Array<{      // Tags to update
    tag_name: string,
    tag_value?: string
  }>
}
```

**API Endpoint**: `PATCH /api/v2/steering/apps/private/tags`

**Tag Management Workflow**:

```typescript
async function organizeApplicationsByEnvironment() {
  // 1. Get all applications without environment tags
  const apps = await listPrivateApps();
  const untaggedApps = apps.data.private_apps.filter(app => 
    !app.tags.some(tag => tag.tag_name === 'environment')
  );
  
  // 2. Group by naming pattern or publisher
  const prodApps = untaggedApps.filter(app => 
    app.app_name.includes('prod') || 
    app.publisher_name.includes('production')
  );
  
  // 3. Apply environment tags
  if (prodApps.length > 0) {
    await updatePrivateAppTags({
      ids: prodApps.map(app => app.app_id.toString()),
      tags: [
        {tag_name: 'environment', tag_value: 'production'},
        {tag_name: 'criticality', tag_value: 'high'}
      ]
    });
  }
  
  return {
    tagged_applications: prodApps.length,
    environment: 'production'
  };
}
```

## Policy Integration Tools

### 5. Policy Association Tools

**getPolicyInUse**: Check if an application is referenced in any access policies.

**Schema**:
```typescript
{
  appId: string  // Application ID to check
}
```

**API Endpoint**: `GET /api/v2/steering/apps/private/policy/inuse`

**getTagPolicyInUse**: Find policies that reference applications with specific tags.

**Schema**:
```typescript
{
  tagName: string,   // Tag name to search for
  tagValue?: string  // Optional tag value filter
}
```

**Policy Integration Workflow**:

```typescript
async function verifyPolicyCompliance(appId: string) {
  // 1. Check if app is in any policies
  const policyUsage = await getPolicyInUse({appId});
  
  if (!policyUsage.data.in_use) {
    // 2. Get app details to suggest policy creation
    const app = await getPrivateApp({id: appId});
    
    // 3. Look for similar apps with policies
    const similarApps = await listPrivateApps({
      query: app.data.app_name.split('-')[0] // Base name pattern
    });
    
    return {
      compliance_status: 'non-compliant',
      reason: 'Application not referenced in any access policy',
      recommendation: 'Create access policy or add to existing policy group',
      similar_apps_with_policies: similarApps.data.private_apps
        .filter(similarApp => similarApp.in_policy)
    };
  }
  
  return {
    compliance_status: 'compliant',
    policies: policyUsage.data.policies
  };
}
```

## Discovery and Monitoring Tools

### 6. updateDiscoverySettings

**Purpose**: Configure automatic discovery of applications in the network environment.

**Schema**:
```typescript
{
  enabled: boolean,              // Enable/disable discovery
  scan_frequency: 'daily' | 'weekly' | 'monthly', // Scan schedule
  network_ranges: string[],      // CIDR ranges to scan
  port_ranges: Array<{           // Ports to probe
    start_port: number,
    end_port: number,
    protocol: 'tcp' | 'udp'
  }>,
  auto_create_apps?: boolean,    // Automatically create discovered apps
  notification_settings: {       // Discovery notifications
    enabled: boolean,
    admin_emails: string[],      // Must be valid admin user emails
    notify_on: 'all' | 'new' | 'changes'
  }
}
```

**API Endpoint**: `POST /api/v2/steering/apps/private/discoverysettings`

**Pre-Validation Required**:
```typescript
// Validate admin emails exist before configuring
const adminUsers = await getAdminUsers();
const validEmails = adminUsers.data.Resources
  .map(user => user.emails?.[0]?.value)
  .filter(email => email);

// Only use validated emails in discovery settings
const validatedEmails = discoveryEmails.filter(email => 
  validEmails.includes(email)
);
```

**Discovery Configuration Example**:
```
User: "Set up automatic discovery of internal web applications"
Flow:
1. getAdminUsers() → Get valid admin email addresses
2. updateDiscoverySettings({
     enabled: true,
     scan_frequency: 'daily',
     network_ranges: ['10.0.0.0/8', '192.168.0.0/16'],
     port_ranges: [
       {start_port: 80, end_port: 80, protocol: 'tcp'},
       {start_port: 443, end_port: 443, protocol: 'tcp'},
       {start_port: 8080, end_port: 8090, protocol: 'tcp'}
     ],
     auto_create_apps: false,  // Manual review required
     notification_settings: {
       enabled: true,
       admin_emails: validatedEmails,
       notify_on: 'new'
     }
   })
```

## Advanced Integration Patterns

### Application Deployment Pipeline

Complete workflow for deploying a new application:

```typescript
async function deployApplicationToNPA(params: {
  appName: string,
  host: string,
  protocols: Protocol[],
  environment: 'dev' | 'staging' | 'production',
  publisherLocation: string,
  requiresPolicy: boolean
}) {
  // 1. Validation phase
  await validateName({
    resourceType: 'private_app',
    name: params.appName
  });
  
  // 2. Publisher discovery
  const publishers = await searchPublishers({
    name: params.publisherLocation
  });
  
  if (publishers.data.length === 0) {
    throw new Error(`No publishers found for location: ${params.publisherLocation}`);
  }
  
  // 3. Create application
  const app = await createPrivateApp({
    app_name: params.appName,
    host: params.host,
    protocols: params.protocols,
    clientless_access: params.protocols.some(p => p.type.startsWith('http')),
    publisher_ids: publishers.data.map(p => p.id),
    tags: [
      {tag_name: 'environment', tag_value: params.environment},
      {tag_name: 'deployment-date', tag_value: new Date().toISOString().split('T')[0]}
    ]
  });
  
  // 4. Policy creation (if required)
  if (params.requiresPolicy) {
    // Create basic allow policy
    await createPolicyRule({
      rule_name: `Allow-${params.appName}`,
      description: `Auto-generated policy for ${params.appName}`,
      privateApps: [params.appName], // Use display name
      userGroups: [`${params.environment}-users`],
      action: 'allow'
    });
  }
  
  // 5. Health verification
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for propagation
  const healthCheck = await getPrivateApp({id: app.data.app_id.toString()});
  
  return {
    application: app.data,
    health_status: healthCheck.data.status,
    policy_created: params.requiresPolicy,
    deployment_time: new Date().toISOString()
  };
}
```

### Bulk Application Management

Mass operations across multiple applications:

```typescript
async function bulkApplicationMaintenance(environment: string) {
  // 1. Find applications by environment
  const apps = await listPrivateApps({
    query: `tags.environment has ${environment}`
  });
  
  const maintenanceResults = [];
  
  for (const app of apps.data.private_apps) {
    // 2. Health check
    const health = await getPrivateApp({id: app.app_id.toString()});
    
    // 3. Policy compliance check
    const policyCheck = await getPolicyInUse({appId: app.app_id.toString()});
    
    // 4. Tag standardization
    const currentTags = app.tags;
    const requiredTags = [
      {tag_name: 'environment', tag_value: environment},
      {tag_name: 'last-audit', tag_value: new Date().toISOString().split('T')[0]}
    ];
    
    // Update tags if missing required ones
    const missingTags = requiredTags.filter(required => 
      !currentTags.some(current => current.tag_name === required.tag_name)
    );
    
    if (missingTags.length > 0) {
      await patchPrivateAppTags({
        appId: app.app_id.toString(),
        tags: [...currentTags, ...missingTags]
      });
    }
    
    maintenanceResults.push({
      app_name: app.app_name,
      health_status: health.data.status,
      policy_compliant: policyCheck.data.in_use,
      tags_updated: missingTags.length > 0
    });
  }
  
  return {
    environment,
    applications_processed: maintenanceResults.length,
    maintenance_results: maintenanceResults
  };
}
```

### Application Migration

Moving applications between environments:

```typescript
async function migrateApplication(params: {
  appId: string,
  targetEnvironment: string,
  targetPublisher: string
}) {
  // 1. Get current application config
  const currentApp = await getPrivateApp({id: params.appId});
  
  // 2. Find target publisher
  const targetPub = await searchPublishers({name: params.targetPublisher});
  
  if (targetPub.data.length === 0) {
    throw new Error(`Target publisher not found: ${params.targetPublisher}`);
  }
  
  // 3. Create new application name for target environment
  const newAppName = `${currentApp.data.app_name}-${params.targetEnvironment}`;
  
  // 4. Validate new name
  await validateName({
    resourceType: 'private_app',
    name: newAppName
  });
  
  // 5. Create application in target environment
  const migratedApp = await createPrivateApp({
    app_name: newAppName,
    host: currentApp.data.host,
    protocols: currentApp.data.protocols.map(p => ({
      type: p.type,
      port: p.ports.join(',')
    })),
    clientless_access: currentApp.data.clientless_access,
    use_publisher_dns: currentApp.data.use_publisher_dns,
    trust_self_signed_certs: currentApp.data.trust_self_signed_certs,
    publisher_ids: targetPub.data.map(p => p.id),
    tags: [
      ...currentApp.data.tags.filter(t => t.tag_name !== 'environment'),
      {tag_name: 'environment', tag_value: params.targetEnvironment},
      {tag_name: 'migrated-from', tag_value: currentApp.data.app_name},
      {tag_name: 'migration-date', tag_value: new Date().toISOString()}
    ]
  });
  
  return {
    source_app: currentApp.data.app_name,
    target_app: migratedApp.data.app_name,
    migration_status: 'completed',
    target_environment: params.targetEnvironment
  };
}
```

## Error Handling Patterns

### Application Not Found
```typescript
try {
  const app = await getPrivateApp({id: "nonexistent"});
} catch (error) {
  // Suggest search by name
  const searchResults = await listPrivateApps({
    query: "partial-name"
  });
  // Present alternatives to user
}
```

### Validation Failures
```typescript
// Handle naming conflicts
const nameCheck = await validateName({
  resourceType: 'private_app',
  name: proposedName
});

if (!nameCheck.data.valid) {
  // Suggest alternative names
  const suggestions = generateNameAlternatives(proposedName);
}
```

### Publisher Association Issues
```typescript
// Verify publishers exist before creating apps
const publisherIds = await Promise.all(
  publisherNames.map(async name => {
    const pub = await searchPublishers({name});
    if (pub.data.length === 0) {
      throw new Error(`Publisher not found: ${name}`);
    }
    return pub.data[0].id;
  })
);
```

---

Private Application tools provide comprehensive lifecycle management for applications in the Netskope NPA environment, supporting everything from basic CRUD operations to complex deployment pipelines and compliance workflows.
