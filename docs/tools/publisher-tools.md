# Publisher Tools

Publisher tools manage the lifecycle of Netskope Private Access publishers - the on-premises components that provide secure connectivity between users and private applications.

## Tool Overview

| Tool Name | HTTP Method | Purpose | Dependencies |
|-----------|-------------|---------|--------------|
| `list_publishers` | GET | List all publishers with optional field filtering | None |
| `get_publisher` | GET | Retrieve detailed publisher information | None |
| `create_publisher` | POST | Create a new publisher instance | `validateName` |
| `replace_publisher` | PUT | Complete publisher replacement | `get_publisher` |
| `update_publisher` | PATCH | Partial publisher updates | `get_publisher` |
| `delete_publisher` | DELETE | Remove publisher permanently | Cascade checks |
| `bulk_upgrade_publishers` | PUT | Upgrade multiple publishers simultaneously | `get_releases` |
| `get_releases` | GET | List available publisher software versions | None |
| `get_private_apps` | GET | List apps associated with specific publisher | None |
| `generate_publisher_registration_token` | POST | Generate secure registration token | `get_publisher` |

## Detailed Tool Documentation

### 1. list_publishers

**Purpose**: Retrieve a list of all publishers in the organization with optional field filtering.

**Schema**:
```typescript
{
  fields?: string  // Comma-separated list of fields to include
}
```

**API Endpoint**: `GET /api/v2/infrastructure/publishers`

**Response Structure**:
```typescript
{
  status: 'success' | 'error',
  data: {
    publishers: Array<{
      id: number,
      name: string,
      common_name: string,
      registered: boolean,
      upgrade_status: string,
      upgrade_profile_id?: number,
      status: 'connected' | 'disconnected' | 'unknown',
      version: string,
      platform: string,
      last_seen: string,
      ip_address: string,
      port: number,
      location: string,
      tags: Array<{tag_id: number, tag_name: string}>
    }>
  },
  total: number
}
```

**Real-World Usage Examples**:

1. **Infrastructure Inventory**:
   ```
   User: "Show me all publishers and their current status"
   Flow: list_publishers() → Display formatted list with status indicators
   ```

2. **Health Monitoring**:
   ```
   User: "Which publishers are offline?"
   Flow: list_publishers() → Filter by status !== 'connected'
   ```

3. **Version Audit**:
   ```
   User: "List all publishers that need upgrades"
   Flow: list_publishers() → get_releases() → Compare versions
   ```

### 2. get_publisher

**Purpose**: Retrieve comprehensive details about a specific publisher.

**Schema**:
```typescript
{
  id: number | string  // Publisher ID (handles object parameters)
}
```

**API Endpoint**: `GET /api/v2/infrastructure/publishers/{id}`

**Parameter Extraction Logic**:
The tool includes sophisticated parameter extraction to handle MCP object wrapping:
```typescript
function extractIdFromParams(params: any, idField: string = 'id'): number {
  // Handles: number, string, nested objects, MCP parameter wrapping
  // Returns: validated positive integer ID
}
```

**Response Structure**:
```typescript
{
  status: 'success' | 'not found',
  data: {
    id: number,
    name: string,
    common_name: string,
    registered: boolean,
    upgrade_status: 'up_to_date' | 'upgrade_available' | 'upgrading',
    upgrade_profile_id?: number,
    version: string,
    platform: 'linux' | 'windows',
    status: 'connected' | 'disconnected',
    last_seen: string,
    ip_address: string,
    port: number,
    location?: string,
    config: {
      auto_upgrade: boolean,
      log_level: string,
      max_connections: number
    },
    stats: {
      active_connections: number,
      total_data_transferred: string,
      uptime: string
    }
  }
}
```

**Integration Patterns**:

1. **With Private Apps**:
   ```typescript
   // Find publisher, then get its apps
   const publisher = await get_publisher({id: 105});
   const apps = await get_private_apps({publisherId: 105});
   ```

2. **With Upgrade Profiles**:
   ```typescript
   const publisher = await get_publisher({id: 105});
   if (publisher.data.upgrade_profile_id) {
     const profile = await getUpgradeProfile({id: publisher.data.upgrade_profile_id});
   }
   ```

### 3. create_publisher

**Purpose**: Create a new publisher instance in the infrastructure.

**Schema**:
```typescript
{
  name: string,              // Unique publisher name (1-64 chars)
  common_name: string,       // SSL certificate common name
  upgrade_profile_id?: number, // Optional upgrade automation
  location?: string,         // Deployment location description
  auto_upgrade?: boolean,    // Enable automatic updates
  log_level?: 'debug' | 'info' | 'warn' | 'error'
}
```

**API Endpoint**: `POST /api/v2/infrastructure/publishers`

**Validation Requirements**:
- Name must be unique across organization
- Common name must be valid DNS name or IP
- Upgrade profile must exist if specified

**Pre-Creation Workflow**:
```typescript
1. validateName({resourceType: 'publisher', name: publisherName})
2. If upgrade_profile_id provided: getUpgradeProfile({id: upgrade_profile_id})
3. create_publisher(validatedParams)
4. generate_publisher_registration_token({publisherId: newId})
```

**Real-World Scenarios**:

1. **New Office Setup**:
   ```
   User: "Create publisher for the London office"
   Flow: 
   - validateName({resourceType: 'publisher', name: 'london-office-pub'})
   - create_publisher({name: 'london-office-pub', location: 'London, UK'})
   - generate_publisher_registration_token({publisherId: newId})
   ```

2. **Automated Deployment**:
   ```
   User: "Deploy publisher with automatic upgrades enabled"
   Flow:
   - listUpgradeProfiles() → Find 'Production' profile
   - create_publisher({
       name: 'auto-prod-pub',
       upgrade_profile_id: profileId,
       auto_upgrade: true
     })
   ```

### 4. replace_publisher & update_publisher

**replace_publisher (PUT)**: Complete replacement of publisher configuration
**update_publisher (PATCH)**: Partial updates to specific fields

**Schemas**:
```typescript
// PUT - All fields required except id
{
  id: number,
  name: string,
  common_name: string,
  upgrade_profile_id?: number,
  location?: string,
  auto_upgrade?: boolean,
  log_level?: string
}

// PATCH - Only changed fields required
{
  id: number,
  name?: string,
  common_name?: string,
  upgrade_profile_id?: number,
  location?: string,
  auto_upgrade?: boolean,
  log_level?: string
}
```

**Usage Patterns**:

1. **Configuration Updates**:
   ```typescript
   // Enable auto-upgrade for specific publisher
   await update_publisher({
     id: 105,
     auto_upgrade: true,
     upgrade_profile_id: 2
   });
   ```

2. **Location Changes**:
   ```typescript
   // Office relocation
   await update_publisher({
     id: 105,
     location: 'New York, NY - Primary DC'
   });
   ```

### 5. delete_publisher

**Purpose**: Permanently remove a publisher from the infrastructure.

**Schema**:
```typescript
{
  id: number  // Publisher ID to delete
}
```

**Cascade Considerations**:
- Associated private apps lose this publisher
- Active connections are terminated
- Registration tokens are invalidated

**Pre-Deletion Checks**:
```typescript
1. get_publisher({id}) → Verify exists
2. get_private_apps({publisherId: id}) → Check dependencies  
3. User confirmation for apps that will lose connectivity
4. delete_publisher({id})
```

### 6. bulk_upgrade_publishers

**Purpose**: Upgrade multiple publishers to a specific version simultaneously.

**Schema**:
```typescript
{
  publisher_ids: number[],           // Publishers to upgrade
  version?: string,                  // Target version (latest if omitted)
  schedule?: 'immediate' | 'scheduled', // Upgrade timing
  maintenance_window?: {             // For scheduled upgrades
    start_time: string,              // ISO 8601 timestamp
    duration_minutes: number
  }
}
```

**API Endpoint**: `PUT /api/v2/infrastructure/publishers/bulk`

**Upgrade Workflow**:
```typescript
1. get_releases() → Get available versions
2. Validate publisher_ids exist
3. Check current versions to avoid unnecessary upgrades
4. bulk_upgrade_publishers({publisher_ids, version})
5. Monitor upgrade status through get_publisher() calls
```

**Real-World Example**:
```
User: "Upgrade all publishers in the production environment to the latest version"
Flow:
1. list_publishers() → Filter by environment tag
2. get_releases() → Get latest stable version  
3. bulk_upgrade_publishers({
     publisher_ids: [101, 102, 103],
     version: "3.4.2",
     schedule: "scheduled",
     maintenance_window: {
       start_time: "2025-01-15T02:00:00Z",
       duration_minutes: 120
     }
   })
```

### 7. get_releases

**Purpose**: List available publisher software versions for upgrade planning.

**Schema**: `{}` (no parameters)

**API Endpoint**: `GET /api/v2/infrastructure/publishers/releases`

**Response Structure**:
```typescript
{
  status: 'success',
  data: {
    releases: Array<{
      version: string,         // Semantic version (e.g., "3.4.2")
      release_date: string,    // ISO 8601 timestamp
      stability: 'stable' | 'beta' | 'alpha',
      platform: 'linux' | 'windows' | 'all',
      size_mb: number,         // Download size
      changelog: string[],     // Key features and fixes
      security_fixes: boolean, // Critical security updates
      minimum_requirements: {
        os_version: string,
        memory_mb: number,
        disk_gb: number
      }
    }>
  }
}
```

**Usage in Upgrade Planning**:
```typescript
1. get_releases() → See all available versions
2. list_publishers() → Check current versions
3. Compare and identify upgrade candidates
4. bulk_upgrade_publishers() with selected version
```

### 8. get_private_apps

**Purpose**: List private applications associated with a specific publisher.

**Schema**:
```typescript
{
  publisherId: number  // Publisher ID to query
}
```

**API Endpoint**: `GET /api/v2/infrastructure/publishers/{id}/apps`

**Response Structure**:
```typescript
{
  status: 'success' | 'not found',
  data: {
    publisher_id: number,
    publisher_name: string,
    apps: Array<{
      app_id: number,
      app_name: string,
      host: string,
      protocols: Array<{type: string, ports: number[]}>,
      status: 'reachable' | 'unreachable',
      clientless_access: boolean,
      last_health_check: string
    }>
  },
  total: number
}
```

**Integration Example**:
```
User: "Show me what applications are running through the London publisher"
Flow:
1. searchPublishers({name: 'London'}) → Get publisher ID
2. get_private_apps({publisherId: foundId})
3. Format and display app details with reachability status
```

### 9. generate_publisher_registration_token

**Purpose**: Generate a secure token for publisher registration and authentication.

**Schema**:
```typescript
{
  publisherId: number  // Publisher requiring token
}
```

**API Endpoint**: `POST /api/v2/infrastructure/publishers/{id}/registration_token`

**Response Structure**:
```typescript
{
  status: 'success' | 'not found',
  data: {
    token: string,      // Secure registration token
    expires_at: string, // Token expiration (ISO 8601)
    publisher_id: number,
    instructions: {
      command: string,  // CLI registration command
      config_url: string // Configuration download URL
    }
  }
}
```

**Registration Workflow**:
```typescript
1. create_publisher({name, common_name}) → Create publisher record
2. generate_publisher_registration_token({publisherId: newId})
3. Provide token and instructions to field engineer
4. Engineer runs registration command on target system
5. Publisher appears as 'connected' in list_publishers()
```

## Tool Integration Patterns

### Publisher Lifecycle Management

Complete workflow for deploying a new publisher:

```typescript
async function deployNewPublisher(params: {
  name: string,
  location: string, 
  upgradeProfile?: string,
  autoUpgrade?: boolean
}) {
  // 1. Validate naming
  await validateName({
    resourceType: 'publisher',
    name: params.name
  });
  
  // 2. Resolve upgrade profile if specified
  let upgradeProfileId;
  if (params.upgradeProfile) {
    const profiles = await listUpgradeProfiles();
    const profile = profiles.data.find(p => p.name === params.upgradeProfile);
    upgradeProfileId = profile?.id;
  }
  
  // 3. Create publisher
  const publisher = await create_publisher({
    name: params.name,
    common_name: `${params.name}.company.com`,
    location: params.location,
    upgrade_profile_id: upgradeProfileId,
    auto_upgrade: params.autoUpgrade || false
  });
  
  // 4. Generate registration token
  const token = await generate_publisher_registration_token({
    publisherId: publisher.data.id
  });
  
  return {
    publisher: publisher.data,
    registrationToken: token.data.token,
    setupInstructions: token.data.instructions
  };
}
```

### Health Monitoring Automation

Automated health checks and remediation:

```typescript
async function publisherHealthCheck() {
  // Get all publishers
  const publishers = await list_publishers();
  const unhealthyPublishers = [];
  
  for (const publisher of publishers.data.publishers) {
    if (publisher.status !== 'connected') {
      const details = await get_publisher({id: publisher.id});
      const apps = await get_private_apps({publisherId: publisher.id});
      
      unhealthyPublishers.push({
        ...details.data,
        affected_apps: apps.data.apps.length,
        recommended_action: deriveRecommendedAction(details.data)
      });
    }
  }
  
  return unhealthyPublishers;
}
```

### Upgrade Planning and Execution

Coordinated upgrade workflow:

```typescript
async function planAndExecuteUpgrades(environment: string) {
  // 1. Get current state
  const releases = await get_releases();
  const publishers = await list_publishers();
  const latestVersion = releases.data.releases
    .filter(r => r.stability === 'stable')[0].version;
  
  // 2. Identify upgrade candidates  
  const upgradeNeeded = publishers.data.publishers
    .filter(p => p.version !== latestVersion)
    .filter(p => p.tags.some(t => t.tag_name === environment));
  
  // 3. Check for any blockers
  for (const pub of upgradeNeeded) {
    const apps = await get_private_apps({publisherId: pub.id});
    // Verify no critical apps will be disrupted
  }
  
  // 4. Execute upgrade
  if (upgradeNeeded.length > 0) {
    await bulk_upgrade_publishers({
      publisher_ids: upgradeNeeded.map(p => p.id),
      version: latestVersion,
      schedule: 'scheduled',
      maintenance_window: {
        start_time: calculateMaintenanceWindow(),
        duration_minutes: 60
      }
    });
  }
  
  return {
    planned_upgrades: upgradeNeeded.length,
    target_version: latestVersion,
    estimated_duration: `${upgradeNeeded.length * 10} minutes`
  };
}
```

## Error Handling and Recovery

### Common Error Scenarios

1. **Publisher Not Found (404)**:
   ```typescript
   try {
     await get_publisher({id: 999});
   } catch (error) {
     // Handle missing publisher
     // Suggest searching by name instead
   }
   ```

2. **Registration Token Expired**:
   ```typescript
   // Automatically regenerate token
   await generate_publisher_registration_token({publisherId});
   ```

3. **Upgrade Conflicts**:
   ```typescript
   // Check for active connections before upgrade
   const apps = await get_private_apps({publisherId});
   if (apps.data.apps.some(app => app.status === 'active_connections')) {
     // Schedule for maintenance window
   }
   ```

### Retry and Recovery Patterns

Built into the API client layer:
- **Exponential backoff** for transient failures
- **Circuit breaker** for sustained API issues  
- **Graceful degradation** when partial functionality available

---

Publisher tools form the foundation of Netskope NPA infrastructure management, providing comprehensive lifecycle control from initial deployment through ongoing maintenance and upgrades.
