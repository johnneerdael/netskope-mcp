# Policy Tools

Policy tools manage access control rules and policy groups that determine who can access which private applications in the Netskope NPA environment.

## Tool Overview

| Tool Name | HTTP Method | Purpose | Dependencies |
|-----------|-------------|---------|--------------|
| `listPolicyGroups` | GET | List all policy groups | None |
| `getPolicyGroup` | GET | Retrieve specific policy group details | None |
| `createPolicyGroup` | POST | Create new policy group | `validateName` |
| `updatePolicyGroup` | PUT | Update existing policy group | `getPolicyGroup` |
| `deletePolicyGroup` | DELETE | Remove policy group | Cascade validation |
| `createPolicyRule` | POST | Create access control rules | SCIM validation, App resolution |

## Policy Architecture

### Policy Groups vs Policy Rules

**Policy Groups**: Containers that organize related access policies
- Administrative groupings (e.g., "HR Policies", "Engineering Access")
- Environment-based separation (e.g., "Production Access", "Development")
- Geographic or organizational boundaries

**Policy Rules**: Specific access control rules within policy groups
- Define WHO (users/groups) can access WHAT (applications) and HOW (conditions)
- Support allow/deny actions with detailed conditions
- Can reference applications by name (display name resolution)

## Policy Group Management

### 1. listPolicyGroups

**Purpose**: Retrieve all policy groups in the organization for administrative overview.

**Schema**: `{}` (no parameters required)

**API Endpoint**: `GET /api/v2/policy/npa/policygroups`

**Response Structure**:
```typescript
{
  status: 'success',
  data: Array<{
    id: number,
    name: string,
    description?: string,
    created_date: string,
    modified_date: string,
    rule_count: number,
    enabled: boolean,
    policy_order: number
  }>
}
```

**Real-World Usage**:
```
User: "Show me all policy groups and their rule counts"
Flow: listPolicyGroups() → Display formatted table with group details
```

### 2. getPolicyGroup

**Purpose**: Retrieve detailed information about a specific policy group including its rules.

**Schema**:
```typescript
{
  id: number  // Policy group ID
}
```

**API Endpoint**: `GET /api/v2/policy/npa/policygroups/{id}`

**Response Structure**:
```typescript
{
  status: 'success' | 'not found',
  data: {
    id: number,
    name: string,
    description?: string,
    enabled: boolean,
    policy_order: number,
    created_date: string,
    modified_date: string,
    rules: Array<{
      rule_id: number,
      rule_name: string,
      action: 'allow' | 'deny',
      enabled: boolean,
      conditions: {
        users?: string[],
        user_groups?: string[],
        private_apps?: string[],
        app_groups?: string[],
        source_locations?: string[],
        time_restrictions?: object
      }
    }>
  }
}
```

**Integration Example**:
```typescript
// Get policy group details for audit
const policyGroup = await getPolicyGroup({id: 5});
console.log(`Policy Group: ${policyGroup.data.name}`);
console.log(`Rules: ${policyGroup.data.rules.length}`);
console.log(`Last Modified: ${policyGroup.data.modified_date}`);
```

### 3. createPolicyGroup

**Purpose**: Create new policy groups to organize access control rules.

**Schema**:
```typescript
{
  name: string,              // Unique group name (1-100 chars)
  description?: string,      // Optional description
  enabled?: boolean,         // Enable immediately (default: true)
  policy_order?: number      // Evaluation order (lower = higher priority)
}
```

**API Endpoint**: `POST /api/v2/policy/npa/policygroups`

**Validation Requirements**:
- Name must be unique across all policy groups
- Policy order affects evaluation sequence (1 = highest priority)

**Pre-Creation Workflow**:
```typescript
1. validateName({resourceType: 'policy_group', name: groupName})
2. createPolicyGroup({name, description, enabled: true})
3. Optional: createPolicyRule() to add initial rules
```

**Real-World Example**:
```
User: "Create a policy group for the new engineering team"
Flow:
1. validateName({resourceType: 'policy_group', name: 'Engineering-Team-Access'})
2. createPolicyGroup({
     name: 'Engineering-Team-Access',
     description: 'Access policies for engineering team members',
     enabled: true,
     policy_order: 10
   })
```

### 4. updatePolicyGroup & deletePolicyGroup

**updatePolicyGroup**: Modify existing policy group properties.

**Schema**:
```typescript
{
  id: number,                // Policy group ID
  name?: string,             // Updated name
  description?: string,      // Updated description
  enabled?: boolean,         // Enable/disable group
  policy_order?: number      // Change evaluation order
}
```

**deletePolicyGroup**: Remove policy group and all associated rules.

**Schema**:
```typescript
{
  id: number  // Policy group ID to delete
}
```

**Cascade Considerations**:
- All rules within the group are permanently deleted
- Active user sessions may be affected
- Requires confirmation for groups with active rules

## Policy Rule Management

### 5. createPolicyRule

**Purpose**: Create detailed access control rules that define WHO can access WHAT applications under which CONDITIONS.

**Schema**:
```typescript
{
  rule_name: string,             // Unique rule name
  description?: string,          // Rule description
  policy_group_id: number,       // Parent policy group
  action: 'allow' | 'deny',      // Access decision
  enabled?: boolean,             // Rule activation status (default: true)
  
  // WHO - User/Group Specification (at least one required)
  users?: string[],              // Individual user UPNs/email addresses
  userGroups?: string[],         // Group display names or UPNs
  
  // WHAT - Application Specification (at least one required)  
  privateApps?: string[],        // Application display names (NOT IDs)
  appGroups?: string[],          // Application group names
  
  // CONDITIONS - Optional access conditions
  conditions?: {
    source_locations?: string[], // Geographic restrictions
    time_restrictions?: {        // Time-based access
      allowed_hours?: {
        start: string,           // "09:00"
        end: string,             // "17:00"
        timezone: string         // "America/New_York"
      },
      allowed_days?: string[]    // ["monday", "tuesday", ...]
    },
    device_conditions?: {
      managed_devices_only?: boolean,
    },
    risk_conditions?: {
      max_risk_level?: 'low' | 'medium' | 'high'
    }
  }
}
```

**API Endpoint**: `POST /api/v2/policy/npa/policies`

**Critical Schema Requirements**:

1. **Display Name Resolution**: Applications MUST be specified using display names, not IDs
2. **SCIM Integration**: User groups undergo automatic SCIM validation  
3. **Nested Structure**: The API expects a specific nested structure with `privateApps` array

**API Transformation**:
```typescript
// MCP Input (Simple Format)
{
  rule_name: "Allow-Admin-Access-to-Database",
  privateApps: ["prod-database", "backup-database"],
  userGroups: ["Database Administrators"],
  action: "allow"
}

// API Payload (Netskope Format)
{
  rule_name: "Allow-Admin-Access-to-Database",
  policy_action: "allow",
  rule_list: [{
    rule_name: "Allow-Admin-Access-to-Database",
    privateApps: ["prod-database", "backup-database"],  // Display names
    userGroups: ["Database Administrators"],
    action: "allow"
  }]
}
```

**SCIM Validation Workflow**:
```typescript
1. Extract user groups from rule parameters
2. For each group: searchGroups({displayName: groupName})
3. Validate all groups exist in SCIM directory
4. If validation fails: return detailed error with available groups
5. If validation passes: proceed with policy creation
```

**Real-World Policy Creation Examples**:

1. **Database Administrator Access**:
   ```
   User: "Create a policy allowing database admins to access production databases"
   Flow:
   1. searchGroups({displayName: "Database Administrators"}) → Validate group exists
   2. createPolicyRule({
        rule_name: "Allow-DB-Admin-Access",
        description: "Production database access for DBA team",
        policy_group_id: 1,
        action: "allow",
        privateApps: ["prod-database", "backup-database"], // Display names
        userGroups: ["Database Administrators"],
        conditions: {
          time_restrictions: {
            allowed_hours: {start: "06:00", end: "22:00", timezone: "UTC"},
            allowed_days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
          },
          device_conditions: {managed_devices_only: true}
        }
      })
   ```

2. **Emergency Access Rule**:
   ```
   User: "Set up emergency access for IT administrators to all internal applications"
   Flow:
   1. listPrivateApps({query: "internal"}) → Get internal app names
   2. searchGroups({displayName: "IT Administrators"}) → Validate group
   3. createPolicyRule({
        rule_name: "Emergency-IT-Access", 
        description: "Emergency access for IT team - monitor usage",
        policy_group_id: 2,
        action: "allow",
        privateApps: ["internal-wiki", "monitoring-dashboard", "admin-portal"],
        userGroups: ["IT Administrators"],
        enabled: false  // Disabled by default, enable during emergencies
      })
   ```

3. **Conditional Access Based on Risk**:
   ```
   User: "Allow access to HR applications but only from managed devices and low-risk users"
   Flow:
   1. searchGroups({displayName: "HR Department"}) → Validate group
   2. createPolicyRule({
        rule_name: "HR-Conditional-Access",
        policy_group_id: 3,
        action: "allow",
        privateApps: ["hr-portal", "payroll-system"],
        userGroups: ["HR Department"],
        conditions: {
          device_conditions: {managed_devices_only: true},
          risk_conditions: {max_risk_level: "low"},
          source_locations: ["Corporate-HQ", "HR-Branch-Office"]
        }
      })
   ```

## Advanced Policy Workflows

### Policy Deployment Pipeline

Complete workflow for deploying a new policy:

```typescript
async function deployAccessPolicy(params: {
  ruleName: string,
  policyGroupName: string,
  applications: string[],
  userGroups: string[],
  conditions?: PolicyConditions
}) {
  // 1. Validate policy group exists
  const policyGroups = await listPolicyGroups();
  const targetGroup = policyGroups.data.find(g => g.name === params.policyGroupName);
  
  if (!targetGroup) {
    throw new Error(`Policy group not found: ${params.policyGroupName}`);
  }
  
  // 2. Validate all applications exist
  const appValidation = await Promise.all(
    params.applications.map(async appName => {
      const apps = await listPrivateApps({query: appName});
      const exactMatch = apps.data.private_apps.find(app => app.app_name === appName);
      return { appName, exists: !!exactMatch, app: exactMatch };
    })
  );
  
  const missingApps = appValidation.filter(v => !v.exists);
  if (missingApps.length > 0) {
    throw new Error(`Applications not found: ${missingApps.map(a => a.appName).join(', ')}`);
  }
  
  // 3. Validate all user groups exist in SCIM
  const groupValidation = await Promise.all(
    params.userGroups.map(async groupName => {
      const groups = await searchGroups({displayName: groupName});
      return { 
        groupName, 
        exists: groups.data.Resources.length > 0,
        scimId: groups.data.Resources[0]?.id 
      };
    })
  );
  
  const missingGroups = groupValidation.filter(v => !v.exists);
  if (missingGroups.length > 0) {
    // Get available groups for suggestions
    const availableGroups = await listGroups({count: 50});
    throw new Error(
      `User groups not found in SCIM: ${missingGroups.map(g => g.groupName).join(', ')}\n` +
      `Available groups: ${availableGroups.data.Resources.map(g => g.displayName).join(', ')}`
    );
  }
  
  // 4. Create the policy rule
  const policyRule = await createPolicyRule({
    rule_name: params.ruleName,
    description: `Auto-generated policy for ${params.applications.join(', ')}`,
    policy_group_id: targetGroup.id,
    action: 'allow',
    privateApps: params.applications,  // Use display names
    userGroups: params.userGroups,
    conditions: params.conditions,
    enabled: true
  });
  
  // 5. Verify policy was created
  const verification = await getPolicyGroup({id: targetGroup.id});
  const createdRule = verification.data.rules.find(r => r.rule_name === params.ruleName);
  
  return {
    policy_rule: policyRule.data,
    verification: createdRule ? 'success' : 'failed',
    applications_validated: appValidation.length,
    groups_validated: groupValidation.length
  };
}
```

### Policy Compliance Audit

Automated compliance checking across all policies:

```typescript
async function auditPolicyCompliance() {
  // 1. Get all policy groups
  const policyGroups = await listPolicyGroups();
  const auditResults = [];
  
  for (const group of policyGroups.data) {
    // 2. Get detailed group information
    const groupDetails = await getPolicyGroup({id: group.id});
    
    // 3. Audit each rule in the group
    for (const rule of groupDetails.data.rules) {
      const ruleAudit = {
        policy_group: group.name,
        rule_name: rule.rule_name,
        compliance_issues: []
      };
      
      // Check if applications still exist
      if (rule.conditions.private_apps) {
        for (const appName of rule.conditions.private_apps) {
          const appCheck = await listPrivateApps({query: appName});
          const appExists = appCheck.data.private_apps.some(a => a.app_name === appName);
          
          if (!appExists) {
            ruleAudit.compliance_issues.push({
              type: 'missing_application',
              details: `Application '${appName}' no longer exists`
            });
          }
        }
      }
      
      // Check if user groups still exist in SCIM
      if (rule.conditions.user_groups) {
        for (const groupName of rule.conditions.user_groups) {
          const groupCheck = await searchGroups({displayName: groupName});
          
          if (groupCheck.data.Resources.length === 0) {
            ruleAudit.compliance_issues.push({
              type: 'missing_user_group', 
              details: `User group '${groupName}' not found in SCIM directory`
            });
          }
        }
      }
      
      // Check for disabled rules that might be forgotten
      if (!rule.enabled) {
        ruleAudit.compliance_issues.push({
          type: 'disabled_rule',
          details: 'Rule is disabled - verify this is intentional'
        });
      }
      
      auditResults.push(ruleAudit);
    }
  }
  
  return {
    audit_date: new Date().toISOString(),
    total_rules_audited: auditResults.length,
    rules_with_issues: auditResults.filter(r => r.compliance_issues.length > 0).length,
    compliance_issues: auditResults.filter(r => r.compliance_issues.length > 0)
  };
}
```

### Bulk Policy Management

Mass operations across multiple policies:

```typescript
async function bulkUpdatePolicyGroups(updates: {
  groupName: string,
  changes: {
    enabled?: boolean,
    policy_order?: number,
    description?: string
  }
}[]) {
  const results = [];
  
  // Get all current policy groups
  const policyGroups = await listPolicyGroups();
  
  for (const update of updates) {
    const targetGroup = policyGroups.data.find(g => g.name === update.groupName);
    
    if (!targetGroup) {
      results.push({
        group_name: update.groupName,
        status: 'not_found',
        error: 'Policy group not found'
      });
      continue;
    }
    
    try {
      await updatePolicyGroup({
        id: targetGroup.id,
        ...update.changes
      });
      
      results.push({
        group_name: update.groupName,
        status: 'updated',
        changes_applied: Object.keys(update.changes)
      });
    } catch (error) {
      results.push({
        group_name: update.groupName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
  }
  
  return {
    total_updates: updates.length,
    successful_updates: results.filter(r => r.status === 'updated').length,
    failed_updates: results.filter(r => r.status !== 'updated').length,
    results
  };
}
```

## Error Handling and Validation

### SCIM Validation Errors

When user groups don't exist in SCIM directory:

```typescript
// Example error response with suggestions
{
  status: 'error',
  message: 'User groups not found in SCIM directory: Database Administrators, IT Support',
  available_groups: [
    'Database Admin Team',
    'IT Operations', 
    'System Administrators'
  ],
  suggestion: 'Use exact group display names from SCIM directory'
}
```

### Application Resolution Errors

When applications specified by name don't exist:

```typescript
try {
  await createPolicyRule({
    privateApps: ['nonexistent-app'],
    // ... other params
  });
} catch (error) {
  // Suggest similar applications
  const similarApps = await listPrivateApps({query: 'nonexistent'});
  // Present alternatives to user
}
```

### Policy Group Conflicts

Handle policy order and naming conflicts:

```typescript
// Check for policy order conflicts
const existingGroups = await listPolicyGroups();
const conflictingOrder = existingGroups.data.find(g => g.policy_order === newOrder);

if (conflictingOrder) {
  // Suggest available order numbers or auto-increment
}
```

## Integration with Other Tools

### With SCIM Tools
```typescript
// Always validate groups before creating policies
const groupValidation = await searchGroups({displayName: 'HR Department'});
if (groupValidation.data.Resources.length === 0) {
  const availableGroups = await listGroups({count: 20});
  // Show available alternatives
}
```

### With Private App Tools
```typescript
// Verify applications exist before referencing in policies
const appValidation = await listPrivateApps({query: 'hr-portal'});
const exactMatch = appValidation.data.private_apps.find(app => app.app_name === 'hr-portal');
if (!exactMatch) {
  // Application doesn't exist - suggest creating it first
}
```

### With Search Tools
```typescript
// Use search tools to find applications for policy creation
const searchResults = await searchPrivateApps({name: 'database'});
const dbApps = searchResults.data.private_apps.map(app => app.app_name);
// Use discovered app names in policy rules
```

---

Policy tools provide comprehensive access control management for Netskope NPA environments, ensuring that the right users have access to the right applications under the right conditions, with full SCIM integration for identity management and robust validation for reliable policy enforcement.
