# Upgrade Profile Tools

## Overview

Upgrade Profile tools manage automated maintenance schedules for Netskope infrastructure components. These tools enable centralized control over when and how publishers, brokers, and other components receive software updates.

## Tool Summary

| Tool | Method | Description | Parameters |
|------|--------|-------------|------------|
| `createUpgradeProfile` | POST | Create automated maintenance schedule | Profile configuration |
| `getUpgradeProfiles` | GET | List all upgrade profiles | None |
| `getUpgradeProfile` | GET | Get specific profile details | profile_id |
| `updateUpgradeProfile` | PUT | Modify maintenance schedule | profile_id, updates |
| `deleteUpgradeProfile` | DELETE | Remove upgrade profile | profile_id |
| `assignUpgradeProfile` | POST | Link profile to resources | profile_id, resource_ids |
| `getUpgradeHistory` | GET | View upgrade execution history | profile_id |

## Core Concepts

### Maintenance Windows

Upgrade profiles define maintenance windows using cron expressions for precise scheduling:
- **Flexible Scheduling**: Support for complex schedules (weekly, monthly, quarterly)
- **Timezone Awareness**: Schedules respect local business hours
- **Holiday Integration**: Skip upgrades during business holidays
- **Rollback Capability**: Automatic rollback on failure detection

### Resource Management

Profiles can be applied to different resource types:
- **Publishers**: Software version upgrades
- **Local Brokers**: Security patches and feature updates  
- **Applications**: Configuration updates and optimizations
- **Policies**: Automated compliance updates

## Tool Reference

### createUpgradeProfile

**Purpose**: Create an automated maintenance schedule for infrastructure components.

**Parameters**:
```typescript
{
  name: string,                        // Profile display name
  description?: string,                // Profile purpose/notes
  
  // Schedule configuration  
  schedule: {
    cron_expression: string,           // Cron format schedule
    timezone: string,                  // IANA timezone identifier
    maintenance_window_hours: number,  // Max duration (1-24 hours)
    retry_attempts: number,            // Retry count on failure (1-5)
    retry_delay_minutes: number        // Delay between retries (5-60)
  },
  
  // Upgrade behavior
  upgrade_settings: {
    target_version: 'latest' | 'stable' | string, // Version strategy
    pre_upgrade_checks: boolean,       // Run compatibility checks
    rollback_on_failure: boolean,      // Auto-rollback on errors
    notification_enabled: boolean,     // Send status notifications
    parallel_upgrades: number,         // Concurrent upgrade limit (1-10)
    canary_percentage?: number         // Gradual rollout percentage
  },
  
  // Resource targeting
  resource_filters: {
    resource_types: ('publisher' | 'local_broker' | 'application')[],
    tags?: { key: string, value: string }[],  // Tag-based filtering
    regions?: string[],                // Geographic targeting
    exclude_critical?: boolean         // Skip mission-critical resources
  }
}
```

**Returns**:
```typescript
{
  id: string,
  name: string,
  status: 'active' | 'inactive' | 'error',
  next_execution: string,              // ISO timestamp of next run
  affected_resources: number,          // Count of matching resources
  validation_results: {
    schedule_valid: boolean,
    timezone_recognized: boolean,
    cron_next_runs: string[]          // Next 5 scheduled executions
  }
}
```

**Usage Examples**:

1. **Weekly Maintenance Windows**:
```typescript
createUpgradeProfile({
  name: "Weekly-Production-Maintenance",
  schedule: {
    cron_expression: "0 2 * * 0",     // Sundays at 2 AM
    timezone: "America/New_York",
    maintenance_window_hours: 4,
    retry_attempts: 2,
    retry_delay_minutes: 15
  },
  upgrade_settings: {
    target_version: "stable",
    pre_upgrade_checks: true,
    rollback_on_failure: true,
    notification_enabled: true,
    parallel_upgrades: 3
  },
  resource_filters: {
    resource_types: ["publisher", "local_broker"],
    regions: ["us-east-1", "us-west-2"],
    exclude_critical: true
  }
})
```

2. **Monthly Security Updates**:
```typescript
createUpgradeProfile({
  name: "Monthly-Security-Patches",
  schedule: {
    cron_expression: "0 1 1 * *",     // First of month at 1 AM
    timezone: "UTC",
    maintenance_window_hours: 6,
    retry_attempts: 3,
    retry_delay_minutes: 30
  },
  upgrade_settings: {
    target_version: "latest",
    pre_upgrade_checks: true,
    rollback_on_failure: true,
    parallel_upgrades: 5,
    canary_percentage: 10             // Start with 10% of resources
  },
  resource_filters: {
    resource_types: ["publisher", "local_broker", "application"],
    tags: [{ key: "environment", value: "production" }]
  }
})
```

### getUpgradeProfiles

**Purpose**: List all upgrade profiles with schedule and status information.

**Parameters**: None

**Returns**:
```typescript
{
  profiles: [
    {
      id: string,
      name: string,
      description?: string,
      status: 'active' | 'inactive' | 'error',
      
      // Schedule info
      next_execution: string,          // ISO timestamp
      last_execution?: string,         // ISO timestamp
      execution_count: number,         // Total executions
      
      // Resource targeting
      affected_resources: number,      // Current matching resources
      resource_types: string[],        // Target types
      
      // Success metrics
      success_rate: number,            // Percentage (0-100)
      average_duration_minutes: number,
      
      // Metadata
      created_at: string,
      updated_at: string,
      created_by: string
    }
  ]
}
```

**Common Analysis**:
1. **Schedule Overview**: View all maintenance windows
2. **Success Monitoring**: Track upgrade success rates
3. **Resource Impact**: Understand affected infrastructure

### getUpgradeProfile

**Purpose**: Get detailed configuration and execution history for a specific upgrade profile.

**Parameters**:
```typescript
{
  profile_id: string
}
```

**Returns**:
```typescript
{
  id: string,
  name: string,
  description?: string,
  status: 'active' | 'inactive' | 'error',
  
  // Complete schedule configuration
  schedule: {
    cron_expression: string,
    timezone: string,
    maintenance_window_hours: number,
    retry_attempts: number,
    retry_delay_minutes: number,
    next_runs: string[],              // Next 10 scheduled executions
    human_readable: string            // "Every Sunday at 2:00 AM EST"
  },
  
  // Upgrade settings
  upgrade_settings: {
    target_version: string,
    pre_upgrade_checks: boolean,
    rollback_on_failure: boolean,
    notification_enabled: boolean,
    parallel_upgrades: number,
    canary_percentage?: number
  },
  
  // Resource targeting
  resource_filters: object,
  current_resources: [               // Currently matching resources
    {
      id: string,
      name: string,
      type: string,
      current_version: string,
      location: string,
      last_upgraded: string
    }
  ],
  
  // Execution statistics
  statistics: {
    total_executions: number,
    successful_executions: number,
    failed_executions: number,
    average_duration_minutes: number,
    total_resources_upgraded: number,
    last_execution_date: string,
    next_execution_date: string
  },
  
  // Recent executions
  recent_executions: [
    {
      execution_id: string,
      started_at: string,
      completed_at?: string,
      status: 'running' | 'completed' | 'failed' | 'cancelled',
      resources_processed: number,
      resources_successful: number,
      resources_failed: number,
      error_summary?: string
    }
  ]
}
```

**Monitoring Workflows**:
1. **Health Checks**: Review execution success rates
2. **Capacity Planning**: Analyze resource upgrade patterns  
3. **Troubleshooting**: Investigate failed executions

### updateUpgradeProfile

**Purpose**: Modify existing upgrade profile configuration and schedule.

**Parameters**:
```typescript
{
  profile_id: string,
  updates: {
    name?: string,
    description?: string,
    status?: 'active' | 'inactive',   // Enable/disable profile
    
    schedule?: {
      cron_expression?: string,
      timezone?: string,
      maintenance_window_hours?: number,
      retry_attempts?: number,
      retry_delay_minutes?: number
    },
    
    upgrade_settings?: {
      target_version?: 'latest' | 'stable' | string,
      pre_upgrade_checks?: boolean,
      rollback_on_failure?: boolean,
      notification_enabled?: boolean,
      parallel_upgrades?: number,
      canary_percentage?: number
    },
    
    resource_filters?: {
      resource_types?: string[],
      tags?: { key: string, value: string }[],
      regions?: string[],
      exclude_critical?: boolean
    }
  }
}
```

**Returns**:
```typescript
{
  id: string,
  status: 'updated' | 'validation_error' | 'error',
  changes_applied: string[],          // List of modified fields
  next_execution: string,             // Updated next run time
  affected_resources_change: number,  // Change in resource count
  validation_warnings: string[]       // Non-blocking warnings
}
```

**Example Updates**:
```typescript
// Change maintenance window
updateUpgradeProfile("prof-123", {
  schedule: {
    cron_expression: "0 3 * * 0",    // Move from 2 AM to 3 AM
    maintenance_window_hours: 6       // Extend window to 6 hours
  }
})

// Add canary deployment
updateUpgradeProfile("prof-123", {
  upgrade_settings: {
    canary_percentage: 20,            // Start with 20% rollout
    parallel_upgrades: 2              // Reduce concurrent upgrades
  }
})
```

### deleteUpgradeProfile

**Purpose**: Remove upgrade profile and stop all scheduled executions.

**Parameters**:
```typescript
{
  profile_id: string,
  force?: boolean                     // Skip safety checks
}
```

**Returns**:
```typescript
{
  id: string,
  status: 'deleted' | 'error',
  affected_resources: number,         // Resources that were using profile
  pending_executions_cancelled: number,
  cleanup_tasks: string[]            // List of cleanup operations performed
}
```

**Safety Considerations**:
- Cancels any running upgrade executions
- Removes profile assignments from all resources
- Preserves execution history for audit purposes

### assignUpgradeProfile  

**Purpose**: Link upgrade profile to specific infrastructure resources.

**Parameters**:
```typescript
{
  profile_id: string,
  resource_assignments: [
    {
      resource_id: string,
      resource_type: 'publisher' | 'local_broker' | 'application',
      priority?: number,              // Assignment priority (1-10)
      override_settings?: {           // Resource-specific overrides
        maintenance_window_hours?: number,
        rollback_on_failure?: boolean
      }
    }
  ]
}
```

**Returns**:
```typescript
{
  profile_id: string,
  assignments_created: number,
  assignments_failed: number,
  assignment_results: [
    {
      resource_id: string,
      status: 'assigned' | 'failed' | 'already_assigned',
      next_upgrade_window: string,    // When resource will be upgraded
      error_message?: string
    }
  ]
}
```

**Bulk Assignment Example**:
```typescript
// Assign all production publishers to maintenance profile
const publishers = await getPublishers({ 
  tags: [{ key: "environment", value: "production" }] 
});

assignUpgradeProfile("prof-weekly-maint", {
  resource_assignments: publishers.map(pub => ({
    resource_id: pub.id,
    resource_type: "publisher",
    priority: pub.criticality === "high" ? 1 : 2
  }))
})
```

### getUpgradeHistory

**Purpose**: View detailed execution history and audit trail for upgrade profile.

**Parameters**:
```typescript
{
  profile_id: string,
  limit?: number,                     // Max records (default 50)
  start_date?: string,                // Filter from date
  end_date?: string,                  // Filter to date
  status?: 'completed' | 'failed' | 'cancelled'
}
```

**Returns**:
```typescript
{
  profile_id: string,
  profile_name: string,
  executions: [
    {
      execution_id: string,
      started_at: string,
      completed_at?: string,
      duration_minutes?: number,
      status: 'running' | 'completed' | 'failed' | 'cancelled',
      
      // Execution details
      target_version: string,
      resources_targeted: number,
      resources_processed: number,
      resources_successful: number,
      resources_failed: number,
      resources_skipped: number,
      
      // Failure analysis
      failure_reasons: [
        {
          reason: string,
          affected_resources: number,
          error_code: string
        }
      ],
      
      // Resource-level results
      resource_results: [
        {
          resource_id: string,
          resource_name: string,
          resource_type: string,
          status: 'success' | 'failed' | 'skipped' | 'rollback',
          previous_version: string,
          target_version: string,
          actual_version?: string,
          duration_minutes: number,
          error_message?: string
        }
      ],
      
      // Performance metrics
      metrics: {
        average_upgrade_time: number,
        peak_concurrent_upgrades: number,
        network_utilization: number,
        rollback_count: number
      }
    }
  ],
  
  // Summary statistics
  summary: {
    total_executions: number,
    success_rate: number,
    average_duration: number,
    total_resources_upgraded: number,
    most_common_failure: string
  }
}
```

## Advanced Workflows

### Staged Rollout Strategy

**Scenario**: Implement gradual rollouts with canary deployments for critical updates.

**Implementation**:
```typescript
// 1. Create canary profile (5% of resources)
const canaryProfile = await createUpgradeProfile({
  name: "Critical-Update-Canary",
  schedule: {
    cron_expression: "0 1 * * 1",     // Mondays at 1 AM
    timezone: "UTC",
    maintenance_window_hours: 2
  },
  upgrade_settings: {
    target_version: "4.2.1",
    pre_upgrade_checks: true,
    rollback_on_failure: true,
    parallel_upgrades: 2,
    canary_percentage: 5
  },
  resource_filters: {
    resource_types: ["publisher"],
    tags: [{ key: "environment", value: "production" }]
  }
});

// 2. Create main rollout profile (remaining 95%)
const mainProfile = await createUpgradeProfile({
  name: "Critical-Update-Main",
  schedule: {
    cron_expression: "0 1 * * 3",     // Wednesdays at 1 AM (2 days later)
    timezone: "UTC", 
    maintenance_window_hours: 4
  },
  upgrade_settings: {
    target_version: "4.2.1",
    pre_upgrade_checks: true,
    rollback_on_failure: true,
    parallel_upgrades: 5
  },
  resource_filters: {
    resource_types: ["publisher"],
    tags: [{ key: "environment", value: "production" }],
    exclude_canary_resources: true
  }
});

// 3. Monitor canary results before main rollout
const canaryHistory = await getUpgradeHistory(canaryProfile.id);
const canarySuccess = canaryHistory.summary.success_rate;

if (canarySuccess < 95) {
  // Pause main rollout and investigate
  await updateUpgradeProfile(mainProfile.id, { status: "inactive" });
}
```

### Multi-Region Coordination

**Scenario**: Coordinate upgrades across different geographic regions to maintain global availability.

**Implementation**:
```typescript
// Regional profiles with staggered timing
const regions = [
  { name: "APAC", timezone: "Asia/Singapore", cron: "0 2 * * 0" },      // Sunday 2 AM SGT
  { name: "EMEA", timezone: "Europe/London", cron: "0 2 * * 0" },        // Sunday 2 AM GMT  
  { name: "Americas", timezone: "America/New_York", cron: "0 2 * * 0" }   // Sunday 2 AM EST
];

for (const region of regions) {
  const profile = await createUpgradeProfile({
    name: `${region.name}-Weekly-Maintenance`,
    schedule: {
      cron_expression: region.cron,
      timezone: region.timezone,
      maintenance_window_hours: 4
    },
    upgrade_settings: {
      target_version: "stable",
      pre_upgrade_checks: true,
      rollback_on_failure: true,
      parallel_upgrades: 3
    },
    resource_filters: {
      resource_types: ["publisher", "local_broker"],
      regions: [region.name.toLowerCase()],
      exclude_critical: false
    }
  });
  
  // Assign region-specific resources
  const regionalResources = await getInfrastructureResources({ 
    region: region.name.toLowerCase() 
  });
  
  await assignUpgradeProfile(profile.id, {
    resource_assignments: regionalResources.map(resource => ({
      resource_id: resource.id,
      resource_type: resource.type
    }))
  });
}
```

### Emergency Patch Deployment

**Scenario**: Rapidly deploy critical security patches outside normal maintenance windows.

**Implementation**:
```typescript
// 1. Create emergency profile
const emergencyProfile = await createUpgradeProfile({
  name: "Emergency-Security-Patch",
  description: "CVE-2024-XXXX critical security patch",
  schedule: {
    cron_expression: "*/30 * * * *",  // Every 30 minutes for rapid deployment
    timezone: "UTC",
    maintenance_window_hours: 1,
    retry_attempts: 5,
    retry_delay_minutes: 5
  },
  upgrade_settings: {
    target_version: "4.1.3-security",
    pre_upgrade_checks: false,        // Skip checks for speed
    rollback_on_failure: true,
    parallel_upgrades: 10,            // High parallelism
    notification_enabled: true
  },
  resource_filters: {
    resource_types: ["publisher", "local_broker"],
    exclude_critical: false           // Include all resources
  }
});

// 2. Monitor deployment progress
const monitorDeployment = async (profileId: string) => {
  let inProgress = true;
  
  while (inProgress) {
    const profile = await getUpgradeProfile(profileId);
    const recentExecution = profile.recent_executions[0];
    
    if (recentExecution?.status === 'completed') {
      console.log(`Emergency patch deployed to ${recentExecution.resources_successful} resources`);
      inProgress = false;
    } else if (recentExecution?.status === 'failed') {
      console.error(`Emergency patch failed: ${recentExecution.error_summary}`);
      // Trigger manual intervention
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  }
};

monitorDeployment(emergencyProfile.id);

// 3. Clean up emergency profile after completion
setTimeout(async () => {
  await updateUpgradeProfile(emergencyProfile.id, { status: "inactive" });
}, 24 * 60 * 60 * 1000); // Deactivate after 24 hours
```

## Error Handling

### Schedule Validation

```typescript
// Cron expression validation
const validateCronExpression = (cron: string): boolean => {
  const cronRegex = /^(\*|([0-9]|[1-5][0-9])|\*\/[0-9]+) (\*|([0-9]|1[0-9]|2[0-3])|\*\/[0-9]+) (\*|([1-9]|[12][0-9]|3[01])|\*\/[0-9]+) (\*|([1-9]|1[0-2])|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$/;
  
  if (!cronRegex.test(cron)) {
    return false;
  }
  
  // Additional validation for logical constraints
  const parts = cron.split(' ');
  const minute = parseInt(parts[0]);
  const hour = parseInt(parts[1]);
  const dayOfMonth = parseInt(parts[2]);
  const month = parseInt(parts[3]);
  const dayOfWeek = parseInt(parts[4]);
  
  // Validate ranges
  return (
    minute >= 0 && minute <= 59 &&
    hour >= 0 && hour <= 23 &&
    dayOfMonth >= 1 && dayOfMonth <= 31 &&
    month >= 1 && month <= 12 &&
    dayOfWeek >= 0 && dayOfWeek <= 6
  );
};
```

### Execution Failure Recovery

```typescript
// Automatic retry with exponential backoff
const handleUpgradeFailure = async (
  profileId: string, 
  executionId: string
): Promise<void> => {
  const execution = await getUpgradeExecution(executionId);
  
  if (execution.status === 'failed') {
    // Analyze failure reasons
    const criticalFailures = execution.failure_reasons.filter(
      reason => reason.error_code.startsWith('CRITICAL_')
    );
    
    if (criticalFailures.length > 0) {
      // Disable profile and alert administrators
      await updateUpgradeProfile(profileId, { status: 'inactive' });
      await sendAlert('upgrade_profile_disabled', {
        profileId,
        reason: 'Critical failures detected',
        failures: criticalFailures
      });
    } else {
      // Schedule retry with modified settings
      const retryProfile = await updateUpgradeProfile(profileId, {
        upgrade_settings: {
          parallel_upgrades: Math.max(1, execution.metrics.peak_concurrent_upgrades - 2),
          retry_attempts: execution.retry_attempts + 1,
          retry_delay_minutes: execution.retry_delay_minutes * 2
        }
      });
    }
  }
};
```

## Best Practices

### Scheduling Guidelines

1. **Business Hours Awareness**: Schedule outside peak usage times
2. **Geographic Considerations**: Respect local time zones and holidays
3. **Dependency Management**: Coordinate upgrades of interdependent components
4. **Resource Grouping**: Batch similar resources for efficiency
5. **Rollback Planning**: Always enable automatic rollback capabilities

### Performance Optimization  

1. **Parallel Execution**: Balance speed vs. system stability
2. **Network Bandwidth**: Consider upgrade package sizes and network capacity
3. **Resource Monitoring**: Monitor system resources during upgrades
4. **Canary Deployments**: Test with small subsets before full rollout
5. **Maintenance Windows**: Size windows appropriately for workload

### Security Considerations

1. **Version Validation**: Verify upgrade package authenticity
2. **Access Control**: Restrict profile management to authorized users
3. **Audit Logging**: Maintain detailed execution logs
4. **Rollback Security**: Ensure rollback doesn't introduce vulnerabilities
5. **Emergency Procedures**: Have rapid deployment capabilities for security patches

---

Upgrade Profile tools provide enterprise-grade automation for maintaining secure, up-to-date Netskope infrastructure with minimal operational overhead.
