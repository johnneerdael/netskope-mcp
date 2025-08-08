# SCIM Tools

## Overview

SCIM (System for Cross-domain Identity Management) tools provide identity and access management integration with Netskope NPA. These tools enable user and group validation, display name resolution, and automated identity synchronization for policy enforcement.

## Tool Summary

| Tool | Method | Description | Parameters |
|------|--------|-------------|------------|
| `validateScimEntities` | POST | Validate user and group names | user_names, group_names |
| `resolveScimDisplayNames` | POST | Convert display names to UUIDs | user_names, group_names |
| `getScimUsers` | GET | List SCIM users with filtering | filter, attributes |
| `getScimGroups` | GET | List SCIM groups with membership | filter, attributes |
| `getAdminUsers` | GET | Get users with admin privileges | None |

## Core Integration

### Identity Resolution Pipeline

The SCIM integration provides critical identity resolution for policy enforcement:

1. **Display Name Validation**: Verify user/group names exist in directory
2. **UUID Resolution**: Convert human-readable names to system identifiers
3. **Membership Tracking**: Maintain group membership relationships
4. **Admin Identification**: Identify users with administrative privileges

### Policy Integration

SCIM tools integrate seamlessly with policy management:
- Policy rules use display names (human-readable)
- SCIM tools resolve to UUIDs (system identifiers)
- Automatic validation prevents orphaned policy references
- Real-time synchronization maintains policy accuracy

## Tool Reference

### validateScimEntities

**Purpose**: Validate that user and group display names exist in the SCIM directory before creating policy rules.

**Parameters**:
```typescript
{
  user_names?: string[],              // User display names to validate
  group_names?: string[]              // Group display names to validate
}
```

**Returns**:
```typescript
{
  validation_results: {
    users: {
      valid: [
        {
          display_name: string,
          id: string,                 // SCIM UUID
          email: string,
          status: 'active' | 'inactive'
        }
      ],
      invalid: [
        {
          display_name: string,
          reason: string              // Why validation failed
        }
      ]
    },
    groups: {
      valid: [
        {
          display_name: string,
          id: string,                 // SCIM UUID  
          member_count: number
        }
      ],
      invalid: [
        {
          display_name: string,
          reason: string
        }
      ]
    }
  },
  summary: {
    total_entities: number,
    valid_entities: number,
    invalid_entities: number,
    success_rate: number
  }
}
```

**Integration Example**:
```typescript
// Before creating a policy rule
const validation = await validateScimEntities({
  user_names: ["john.doe", "jane.smith"],
  group_names: ["Engineering", "Security-Team"]
});

// Only proceed if all entities are valid
if (validation.summary.success_rate === 100) {
  await createPolicyRule({
    name: "Development-Access-Rule",
    private_app_names: ["dev-server"],
    user_names: ["john.doe", "jane.smith"],
    group_names: ["Engineering", "Security-Team"]
  });
} else {
  // Handle invalid entities
  console.error("Invalid entities found:", validation.validation_results);
}
```

**Common Validation Patterns**:
1. **Pre-Policy Creation**: Validate before creating policy rules
2. **Bulk Import Validation**: Check imported user/group lists
3. **Cleanup Operations**: Identify orphaned references

### resolveScimDisplayNames

**Purpose**: Convert user and group display names to SCIM UUIDs for internal system operations.

**Parameters**:
```typescript
{
  user_names?: string[],
  group_names?: string[]
}
```

**Returns**:
```typescript
{
  resolution_results: {
    users: Map<string, {              // display_name -> details
      id: string,                     // SCIM UUID
      display_name: string,
      email: string,
      department?: string,
      manager?: string,
      groups: string[]                // Group UUIDs user belongs to
    }>,
    groups: Map<string, {             // display_name -> details
      id: string,                     // SCIM UUID
      display_name: string,
      description?: string,
      member_count: number,
      members: string[]               // User UUIDs in group
    }>
  },
  unresolved: {
    users: string[],                  // Display names not found
    groups: string[]                  // Display names not found
  }
}
```

**Usage in Policy Management**:
```typescript
// Resolve names for API calls that require UUIDs
const resolution = await resolveScimDisplayNames({
  user_names: ["alice.admin", "bob.developer"],
  group_names: ["DevOps-Team"]
});

// Extract UUIDs for system operations
const userIds = Array.from(resolution.resolution_results.users.values())
  .map(user => user.id);
const groupIds = Array.from(resolution.resolution_results.groups.values())
  .map(group => group.id);

// Use in internal API calls
await updatePolicyMembership({
  policy_id: "pol-123",
  user_ids: userIds,
  group_ids: groupIds
});
```

### getScimUsers

**Purpose**: Query SCIM directory for users with filtering and attribute selection.

**Parameters**:
```typescript
{
  filter?: {
    department?: string,              // Filter by department
    active?: boolean,                 // Filter by active status
    email_domain?: string,            // Filter by email domain
    group_membership?: string,        // Filter by group membership
    search_term?: string              // General search term
  },
  attributes?: string[],              // Specific attributes to return
  limit?: number,                     // Max results (default 100)
  offset?: number                     // Pagination offset
}
```

**Returns**:
```typescript
{
  users: [
    {
      id: string,                     // SCIM UUID
      user_name: string,              // Username/login
      display_name: string,           // Full display name
      emails: [
        {
          value: string,              // Email address
          primary: boolean            // Primary email flag
        }
      ],
      active: boolean,
      department?: string,
      title?: string,
      manager?: {
        id: string,
        display_name: string
      },
      groups: [
        {
          id: string,
          display_name: string,
          type: 'direct' | 'inherited'
        }
      ],
      created: string,                // ISO timestamp
      last_modified: string           // ISO timestamp
    }
  ],
  pagination: {
    total: number,
    limit: number,
    offset: number,
    has_more: boolean
  }
}
```

**Query Examples**:
```typescript
// Get all active users in Engineering department
const engineers = await getScimUsers({
  filter: {
    department: "Engineering",
    active: true
  },
  attributes: ["id", "display_name", "emails", "groups"]
});

// Search for users by name
const searchResults = await getScimUsers({
  filter: {
    search_term: "john"
  },
  limit: 20
});

// Get users with admin privileges
const adminUsers = await getScimUsers({
  filter: {
    group_membership: "Administrators"
  }
});
```

### getScimGroups

**Purpose**: Query SCIM directory for groups with membership information and filtering.

**Parameters**:
```typescript
{
  filter?: {
    name_pattern?: string,            // Group name pattern matching
    type?: 'security' | 'distribution' | 'role',
    member_count_min?: number,        // Minimum member count
    member_count_max?: number,        // Maximum member count
    search_term?: string              // General search term
  },
  include_members?: boolean,          // Include member details
  attributes?: string[],              // Specific attributes to return
  limit?: number,
  offset?: number
}
```

**Returns**:
```typescript
{
  groups: [
    {
      id: string,                     // SCIM UUID
      display_name: string,           // Group display name
      description?: string,
      type?: 'security' | 'distribution' | 'role',
      member_count: number,
      members?: [                     // If include_members: true
        {
          id: string,
          display_name: string,
          type: 'User' | 'Group',
          email?: string              // For users
        }
      ],
      created: string,
      last_modified: string
    }
  ],
  pagination: {
    total: number,
    limit: number, 
    offset: number,
    has_more: boolean
  }
}
```

**Organizational Queries**:
```typescript
// Get all security groups
const securityGroups = await getScimGroups({
  filter: {
    type: "security",
    member_count_min: 1
  },
  include_members: true
});

// Find groups by name pattern
const devGroups = await getScimGroups({
  filter: {
    name_pattern: "*-Dev-*"
  }
});

// Get large groups for policy targeting
const largeGroups = await getScimGroups({
  filter: {
    member_count_min: 50
  },
  attributes: ["id", "display_name", "member_count"]
});
```

### getAdminUsers

**Purpose**: Retrieve users with administrative privileges across the Netskope platform.

**Parameters**: None

**Returns**:
```typescript
{
  admin_users: [
    {
      id: string,                     // SCIM UUID
      display_name: string,
      email: string,
      admin_roles: [
        {
          role: string,               // Admin role name
          scope: 'global' | 'tenant' | 'application',
          granted_date: string,       // ISO timestamp
          granted_by: string          // Admin who granted role
        }
      ],
      permissions: string[],          // Specific permissions
      last_login: string,             // ISO timestamp
      mfa_enabled: boolean,
      account_status: 'active' | 'inactive' | 'locked'
    }
  ],
  summary: {
    total_admin_users: number,
    active_admin_users: number,
    global_admins: number,
    tenant_admins: number,
    mfa_compliance_rate: number       // Percentage with MFA enabled
  }
}
```

**Security Monitoring**:
```typescript
// Regular admin access review
const adminUsers = await getAdminUsers();

// Check MFA compliance
const nonMfaAdmins = adminUsers.admin_users.filter(user => !user.mfa_enabled);
if (nonMfaAdmins.length > 0) {
  console.warn(`${nonMfaAdmins.length} admin users without MFA:`, 
               nonMfaAdmins.map(u => u.display_name));
}

// Identify inactive admin accounts
const inactiveThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const staleAdmins = adminUsers.admin_users.filter(user => 
  new Date(user.last_login) < inactiveThreshold
);
```

## Advanced Integration Patterns

### Policy Rule Creation with SCIM Validation

**Complete workflow for creating validated policy rules**:

```typescript
async function createValidatedPolicyRule(ruleConfig: {
  name: string,
  private_app_names: string[],
  user_names: string[],
  group_names: string[],
  action: 'allow' | 'block'
}): Promise<PolicyRule> {
  
  // 1. Validate all SCIM entities
  console.log("Validating SCIM entities...");
  const validation = await validateScimEntities({
    user_names: ruleConfig.user_names,
    group_names: ruleConfig.group_names
  });
  
  if (validation.summary.success_rate !== 100) {
    const errors = [
      ...validation.validation_results.users.invalid,
      ...validation.validation_results.groups.invalid
    ];
    throw new Error(`SCIM validation failed: ${JSON.stringify(errors)}`);
  }
  
  // 2. Resolve display names to UUIDs for internal operations
  console.log("Resolving display names...");
  const resolution = await resolveScimDisplayNames({
    user_names: ruleConfig.user_names,
    group_names: ruleConfig.group_names
  });
  
  // 3. Create policy rule (Netskope API uses display names)
  console.log("Creating policy rule...");
  const policyRule = await createPolicyRule({
    name: ruleConfig.name,
    private_app_names: ruleConfig.private_app_names,
    user_names: ruleConfig.user_names,        // Display names for Netskope API
    group_names: ruleConfig.group_names,      // Display names for Netskope API
    action: ruleConfig.action
  });
  
  // 4. Store UUID mappings for internal tracking
  await storePolicyRuleMetadata(policyRule.id, {
    user_mappings: resolution.resolution_results.users,
    group_mappings: resolution.resolution_results.groups,
    created_with_scim_validation: true
  });
  
  console.log(`Policy rule '${ruleConfig.name}' created successfully`);
  return policyRule;
}
```

### Bulk Identity Synchronization

**Synchronize large numbers of users and groups**:

```typescript
async function syncIdentitiesFromDirectory(): Promise<SyncResult> {
  console.log("Starting bulk identity synchronization...");
  
  // 1. Get all active users from directory
  const allUsers = await getScimUsers({
    filter: { active: true },
    attributes: ["id", "display_name", "emails", "department", "groups"],
    limit: 1000  // Process in batches
  });
  
  // 2. Get all groups with significant membership
  const allGroups = await getScimGroups({
    filter: { member_count_min: 5 },
    include_members: true,
    limit: 500
  });
  
  // 3. Build identity mapping cache
  const identityCache = {
    users: new Map(),
    groups: new Map(),
    userToGroups: new Map(),
    groupToUsers: new Map()
  };
  
  // Cache user information
  for (const user of allUsers.users) {
    identityCache.users.set(user.display_name, {
      id: user.id,
      email: user.emails[0]?.value,
      department: user.department,
      groups: user.groups.map(g => g.display_name)
    });
    
    // Build user -> groups mapping
    identityCache.userToGroups.set(user.display_name, 
                                   user.groups.map(g => g.display_name));
  }
  
  // Cache group information
  for (const group of allGroups.groups) {
    identityCache.groups.set(group.display_name, {
      id: group.id,
      description: group.description,
      member_count: group.member_count,
      members: group.members?.map(m => m.display_name) || []
    });
    
    // Build group -> users mapping
    const userMembers = group.members?.filter(m => m.type === 'User')
                                     .map(m => m.display_name) || [];
    identityCache.groupToUsers.set(group.display_name, userMembers);
  }
  
  // 4. Validate existing policy references
  const policies = await getPolicyRules();
  const validationResults = [];
  
  for (const policy of policies) {
    const validation = await validateScimEntities({
      user_names: policy.user_names,
      group_names: policy.group_names
    });
    
    if (validation.summary.success_rate !== 100) {
      validationResults.push({
        policy_id: policy.id,
        policy_name: policy.name,
        invalid_references: [
          ...validation.validation_results.users.invalid,
          ...validation.validation_results.groups.invalid
        ]
      });
    }
  }
  
  return {
    sync_timestamp: new Date().toISOString(),
    users_synced: allUsers.users.length,
    groups_synced: allGroups.groups.length,
    identity_cache: identityCache,
    policy_validation_issues: validationResults,
    summary: {
      total_identities: allUsers.users.length + allGroups.groups.length,
      cache_size_mb: JSON.stringify(identityCache).length / (1024 * 1024),
      policies_validated: policies.length,
      policies_with_issues: validationResults.length
    }
  };
}
```

### Real-time Identity Change Detection

**Monitor identity changes and update policies accordingly**:

```typescript
class IdentityChangeMonitor {
  private lastSyncTime: Date;
  private knownUsers: Set<string>;
  private knownGroups: Set<string>;
  
  constructor() {
    this.lastSyncTime = new Date();
    this.knownUsers = new Set();
    this.knownGroups = new Set();
  }
  
  async detectChanges(): Promise<IdentityChanges> {
    // Get current state
    const currentUsers = await getScimUsers({
      filter: { active: true },
      attributes: ["display_name", "last_modified"]
    });
    
    const currentGroups = await getScimGroups({
      attributes: ["display_name", "last_modified"]
    });
    
    // Detect new, modified, and deleted entities
    const changes = {
      users: {
        added: [],
        modified: [],
        removed: []
      },
      groups: {
        added: [],
        modified: [],
        removed: []
      },
      policy_impacts: []
    };
    
    // Check for user changes
    const currentUserNames = new Set(currentUsers.users.map(u => u.display_name));
    
    for (const user of currentUsers.users) {
      if (!this.knownUsers.has(user.display_name)) {
        changes.users.added.push(user.display_name);
      } else if (new Date(user.last_modified) > this.lastSyncTime) {
        changes.users.modified.push(user.display_name);
      }
    }
    
    for (const knownUser of this.knownUsers) {
      if (!currentUserNames.has(knownUser)) {
        changes.users.removed.push(knownUser);
      }
    }
    
    // Check for group changes (similar logic)
    const currentGroupNames = new Set(currentGroups.groups.map(g => g.display_name));
    
    for (const group of currentGroups.groups) {
      if (!this.knownGroups.has(group.display_name)) {
        changes.groups.added.push(group.display_name);
      } else if (new Date(group.last_modified) > this.lastSyncTime) {
        changes.groups.modified.push(group.display_name);
      }
    }
    
    for (const knownGroup of this.knownGroups) {
      if (!currentGroupNames.has(knownGroup)) {
        changes.groups.removed.push(knownGroup);
      }
    }
    
    // Analyze policy impacts
    const allChangedEntities = [
      ...changes.users.removed,
      ...changes.groups.removed
    ];
    
    if (allChangedEntities.length > 0) {
      const policies = await getPolicyRules();
      
      for (const policy of policies) {
        const impactedEntities = [
          ...policy.user_names.filter(name => allChangedEntities.includes(name)),
          ...policy.group_names.filter(name => allChangedEntities.includes(name))
        ];
        
        if (impactedEntities.length > 0) {
          changes.policy_impacts.push({
            policy_id: policy.id,
            policy_name: policy.name,
            impacted_entities: impactedEntities,
            action_required: 'review_and_update'
          });
        }
      }
    }
    
    // Update known state
    this.knownUsers = currentUserNames;
    this.knownGroups = currentGroupNames;
    this.lastSyncTime = new Date();
    
    return changes;
  }
  
  async handlePolicyImpacts(changes: IdentityChanges): Promise<void> {
    for (const impact of changes.policy_impacts) {
      console.warn(`Policy '${impact.policy_name}' has orphaned references:`, 
                   impact.impacted_entities);
      
      // Option 1: Disable affected policy
      await updatePolicyRule(impact.policy_id, { enabled: false });
      
      // Option 2: Remove orphaned references
      const policy = await getPolicyRule(impact.policy_id);
      const cleanedUserNames = policy.user_names.filter(
        name => !changes.users.removed.includes(name)
      );
      const cleanedGroupNames = policy.group_names.filter(
        name => !changes.groups.removed.includes(name)
      );
      
      if (cleanedUserNames.length > 0 || cleanedGroupNames.length > 0) {
        await updatePolicyRule(impact.policy_id, {
          user_names: cleanedUserNames,
          group_names: cleanedGroupNames,
          enabled: true
        });
        console.log(`Cleaned orphaned references from policy '${impact.policy_name}'`);
      } else {
        console.warn(`Policy '${impact.policy_name}' has no valid references - disabling`);
      }
    }
  }
}

// Usage
const monitor = new IdentityChangeMonitor();
setInterval(async () => {
  const changes = await monitor.detectChanges();
  if (changes.policy_impacts.length > 0) {
    await monitor.handlePolicyImpacts(changes);
  }
}, 300000); // Check every 5 minutes
```

## Error Handling

### SCIM Service Unavailability

```typescript
class ScimServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public errorCode: string
  ) {
    super(message);
    this.name = 'ScimServiceError';
  }
}

const withScimRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error instanceof ScimServiceError) {
        // Log SCIM-specific error details
        console.error(`SCIM service error (attempt ${attempt}):`, {
          service: error.service,
          code: error.errorCode,
          message: error.message
        });
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Non-SCIM errors shouldn't be retried
        throw error;
      }
    }
  }
  
  throw new Error(`SCIM operation failed after ${maxRetries} attempts: ${lastError.message}`);
};
```

### Identity Resolution Failures

```typescript
const safeResolveIdentities = async (
  userNames: string[],
  groupNames: string[]
): Promise<SafeResolutionResult> => {
  try {
    // Attempt standard resolution
    const result = await resolveScimDisplayNames({
      user_names: userNames,
      group_names: groupNames
    });
    
    return {
      success: true,
      resolved: result.resolution_results,
      unresolved: result.unresolved,
      fallback_used: false
    };
    
  } catch (error) {
    console.warn('SCIM resolution failed, using cache fallback:', error.message);
    
    // Fallback to cached identity data
    const cachedResult = await getCachedIdentityResolution(userNames, groupNames);
    
    return {
      success: false,
      resolved: cachedResult.resolved,
      unresolved: cachedResult.unresolved,
      fallback_used: true,
      error: error.message
    };
  }
};
```

## Performance Optimization

### Batch Processing

```typescript
// Process large identity lists in batches
const batchValidateIdentities = async (
  userNames: string[],
  groupNames: string[],
  batchSize: number = 100
): Promise<ValidationResult[]> => {
  const allResults = [];
  
  // Process users in batches
  for (let i = 0; i < userNames.length; i += batchSize) {
    const userBatch = userNames.slice(i, i + batchSize);
    const result = await validateScimEntities({
      user_names: userBatch,
      group_names: []
    });
    allResults.push(result);
  }
  
  // Process groups in batches
  for (let i = 0; i < groupNames.length; i += batchSize) {
    const groupBatch = groupNames.slice(i, i + batchSize);
    const result = await validateScimEntities({
      user_names: [],
      group_names: groupBatch
    });
    allResults.push(result);
  }
  
  return allResults;
};
```

### Caching Strategy

```typescript
class IdentityCache {
  private cache = new Map();
  private readonly ttl = 15 * 60 * 1000; // 15 minutes
  
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    });
    
    return data;
  }
  
  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const identityCache = new IdentityCache();

const getCachedUsers = (filter: UserFilter) => 
  identityCache.getOrFetch(
    `users:${JSON.stringify(filter)}`,
    () => getScimUsers(filter)
  );
```

---

SCIM tools provide essential identity management capabilities that ensure policy accuracy and organizational alignment in Netskope NPA deployments.
