# Steering Tools

## Overview

Steering tools manage traffic routing and publisher-application associations within the Netskope NPA infrastructure. These tools control how user traffic is directed through publishers to reach private applications.

## Tool Summary

| Tool | Method | Description | Parameters |
|------|--------|-------------|------------|
| `updatePublisherAssociation` | PUT | Associate publishers with applications | app_id, publisher_ids |
| `getPublisherAssociations` | GET | List publisher-app associations | None |
| `removePublisherAssociation` | DELETE | Remove publisher-app association | app_id, publisher_id |

## Core Concepts

### Traffic Steering Architecture

Traffic steering in Netskope NPA involves:

1. **Publisher Assignment**: Associate publishers with private applications
2. **Load Distribution**: Balance traffic across multiple publishers  
3. **Failover Management**: Automatic failover to backup publishers
4. **Geographic Routing**: Route users to nearest available publisher
5. **Health-based Steering**: Route around unhealthy publishers

### Association Patterns

- **Primary-Backup**: One primary publisher with backup publishers
- **Load Balanced**: Multiple publishers handling traffic equally
- **Geographic**: Publishers assigned by user/app geographic regions
- **Application-Specific**: Dedicated publishers for specific applications

## Tool Reference

### updatePublisherAssociation

**Purpose**: Create or modify publisher-to-application associations for traffic routing.

**Parameters**:
```typescript
{
  app_id: string,                     // Target application UUID
  publisher_associations: [
    {
      publisher_id: string,           // Publisher UUID
      priority: number,               // Routing priority (1=highest)
      weight?: number,                // Load balancing weight (1-100)
      health_check_enabled?: boolean, // Enable health monitoring
      failover_threshold?: number     // Health score threshold (0-100)
    }
  ]
}
```

**Returns**:
```typescript
{
  app_id: string,
  app_name: string,
  associations_updated: number,
  association_results: [
    {
      publisher_id: string,
      publisher_name: string,
      status: 'associated' | 'updated' | 'failed',
      priority: number,
      weight?: number,
      estimated_propagation_time: string, // ISO duration
      error_message?: string
    }
  ],
  routing_summary: {
    total_publishers: number,
    primary_publishers: number,       // Priority 1
    backup_publishers: number,        // Priority > 1
    geographic_regions: string[]      // Covered regions
  }
}
```

**Common Association Patterns**:

1. **High Availability Setup**:
```typescript
// Primary publisher with geographic backup
updatePublisherAssociation("app-crm-prod", {
  publisher_associations: [
    {
      publisher_id: "pub-us-east-1",
      priority: 1,                    // Primary
      weight: 100,
      health_check_enabled: true,
      failover_threshold: 80
    },
    {
      publisher_id: "pub-us-west-2", 
      priority: 2,                    // Backup
      weight: 100,
      health_check_enabled: true,
      failover_threshold: 80
    }
  ]
})
```

2. **Load Balanced Configuration**:
```typescript
// Multiple publishers with equal load distribution
updatePublisherAssociation("app-web-portal", {
  publisher_associations: [
    {
      publisher_id: "pub-lb-1",
      priority: 1,
      weight: 33,                     // 33% of traffic
      health_check_enabled: true
    },
    {
      publisher_id: "pub-lb-2",
      priority: 1,                    // Same priority = load balance
      weight: 33,                     // 33% of traffic
      health_check_enabled: true
    },
    {
      publisher_id: "pub-lb-3",
      priority: 1,
      weight: 34,                     // 34% of traffic (remainder)
      health_check_enabled: true
    }
  ]
})
```

3. **Geographic Routing**:
```typescript
// Regional publisher assignment
const regions = [
  { app_id: "app-global-erp", region: "us", publisher: "pub-us-central" },
  { app_id: "app-global-erp", region: "eu", publisher: "pub-eu-west" },
  { app_id: "app-global-erp", region: "asia", publisher: "pub-asia-southeast" }
];

for (const region of regions) {
  await updatePublisherAssociation(region.app_id, {
    publisher_associations: [{
      publisher_id: region.publisher,
      priority: 1,
      weight: 100,
      health_check_enabled: true
    }]
  });
}
```

### getPublisherAssociations

**Purpose**: List all publisher-to-application associations with routing configuration.

**Parameters**: None

**Returns**:
```typescript
{
  associations: [
    {
      app_id: string,
      app_name: string,
      app_host: string,
      
      // Publisher assignments
      publishers: [
        {
          publisher_id: string,
          publisher_name: string,
          publisher_location: {
            country: string,
            region: string,
            datacenter?: string
          },
          
          // Routing configuration
          priority: number,
          weight?: number,
          health_check_enabled: boolean,
          failover_threshold?: number,
          
          // Current status
          status: 'active' | 'inactive' | 'unhealthy' | 'maintenance',
          health_score?: number,        // 0-100
          current_connections: number,
          last_health_check?: string,   // ISO timestamp
          
          // Performance metrics
          average_latency_ms?: number,
          success_rate_percent?: number,
          bandwidth_utilization_percent?: number
        }
      ],
      
      // Overall routing health
      routing_status: 'healthy' | 'degraded' | 'critical',
      active_publishers: number,
      total_publishers: number,
      current_primary: string,         // Current primary publisher ID
      last_failover?: string,          // ISO timestamp of last failover
      
      // Traffic statistics
      traffic_stats: {
        total_sessions: number,
        sessions_by_publisher: Map<string, number>,
        peak_concurrent_sessions: number,
        average_session_duration_minutes: number
      }
    }
  ],
  
  // Global statistics
  summary: {
    total_applications: number,
    total_associations: number,
    applications_with_multiple_publishers: number,
    applications_without_publishers: number,
    unhealthy_associations: number,
    average_publishers_per_app: number
  }
}
```

**Analysis Use Cases**:
1. **Health Monitoring**: Identify unhealthy publisher associations
2. **Capacity Planning**: Analyze traffic distribution patterns
3. **Failover Analysis**: Track failover events and patterns
4. **Performance Optimization**: Identify bottlenecks and optimization opportunities

### removePublisherAssociation

**Purpose**: Remove a specific publisher-to-application association.

**Parameters**:
```typescript
{
  app_id: string,                     // Application UUID
  publisher_id: string,               // Publisher UUID to remove
  force?: boolean                     // Skip safety checks
}
```

**Returns**:
```typescript
{
  app_id: string,
  app_name: string,
  publisher_id: string,
  publisher_name: string,
  status: 'removed' | 'error' | 'warning',
  
  // Impact analysis
  impact_assessment: {
    active_sessions_affected: number,
    remaining_publishers: number,
    redundancy_maintained: boolean,
    estimated_disruption_minutes: number
  },
  
  // Actions taken
  actions_performed: [
    'session_migration_initiated',
    'dns_records_updated', 
    'health_check_disabled',
    'traffic_rerouted'
  ],
  
  // Warnings or errors
  warnings?: string[],
  error_message?: string
}
```

**Safety Checks**:
```typescript
// Safe removal with impact analysis
const removal = await removePublisherAssociation("app-critical-1", "pub-old-1");

if (!removal.impact_assessment.redundancy_maintained) {
  console.warn("Removing this publisher will eliminate redundancy!");
  
  // Add backup publisher before removal
  await updatePublisherAssociation("app-critical-1", {
    publisher_associations: [{
      publisher_id: "pub-backup-1",
      priority: 2,
      health_check_enabled: true
    }]
  });
  
  // Now safe to remove original
  await removePublisherAssociation("app-critical-1", "pub-old-1");
}
```

## Advanced Workflows

### Automated Failover Configuration

**Scenario**: Configure automatic failover with health monitoring across multiple regions.

```typescript
async function setupGlobalFailover(
  appId: string,
  publishers: Array<{
    id: string,
    region: string, 
    priority: number,
    capacity: number
  }>
): Promise<FailoverConfig> {
  
  // Sort publishers by priority
  const sortedPublishers = publishers.sort((a, b) => a.priority - b.priority);
  
  // Configure association with health monitoring
  const associations = sortedPublishers.map(pub => ({
    publisher_id: pub.id,
    priority: pub.priority,
    weight: Math.floor(100 / pub.capacity), // Inverse weight for capacity
    health_check_enabled: true,
    failover_threshold: pub.priority === 1 ? 90 : 80  // Higher threshold for primary
  }));
  
  const result = await updatePublisherAssociation(appId, {
    publisher_associations: associations
  });
  
  // Monitor failover behavior
  const monitorFailover = async () => {
    const currentAssociations = await getPublisherAssociations();
    const appAssociation = currentAssociations.associations.find(a => a.app_id === appId);
    
    if (appAssociation?.routing_status === 'degraded') {
      console.warn(`Application ${appId} experiencing degraded routing:`, {
        current_primary: appAssociation.current_primary,
        active_publishers: appAssociation.active_publishers,
        last_failover: appAssociation.last_failover
      });
      
      // Trigger health analysis
      for (const publisher of appAssociation.publishers) {
        if (publisher.status === 'unhealthy' && publisher.health_score < 80) {
          console.error(`Publisher ${publisher.publisher_name} unhealthy:`, {
            health_score: publisher.health_score,
            last_health_check: publisher.last_health_check
          });
        }
      }
    }
  };
  
  // Schedule regular monitoring
  const monitorInterval = setInterval(monitorFailover, 60000); // Every minute
  
  return {
    app_id: appId,
    failover_config: result,
    monitor_interval: monitorInterval,
    cleanup: () => clearInterval(monitorInterval)
  };
}

// Usage
const failoverConfig = await setupGlobalFailover("app-global-crm", [
  { id: "pub-us-east", region: "us-east", priority: 1, capacity: 1000 },
  { id: "pub-us-west", region: "us-west", priority: 2, capacity: 800 },
  { id: "pub-eu-central", region: "eu", priority: 3, capacity: 600 }
]);
```

### Dynamic Load Balancing

**Scenario**: Automatically adjust publisher weights based on real-time performance metrics.

```typescript
class DynamicLoadBalancer {
  private readonly appId: string;
  private readonly targetUtilization: number = 75; // Target 75% utilization
  
  constructor(appId: string) {
    this.appId = appId;
  }
  
  async rebalanceTraffic(): Promise<RebalanceResult> {
    // Get current associations and metrics
    const associations = await getPublisherAssociations();
    const appAssociation = associations.associations.find(a => a.app_id === this.appId);
    
    if (!appAssociation) {
      throw new Error(`No associations found for app ${this.appId}`);
    }
    
    // Calculate optimal weights based on current performance
    const rebalanceData = appAssociation.publishers
      .filter(pub => pub.status === 'active' && pub.priority === 1) // Only active, primary publishers
      .map(pub => {
        const utilization = pub.bandwidth_utilization_percent || 0;
        const health = pub.health_score || 100;
        const latency = pub.average_latency_ms || 50;
        
        // Calculate performance score (higher is better)
        const performanceScore = (health / 100) * (1 - utilization / 100) * (1000 / (latency + 100));
        
        return {
          publisher_id: pub.publisher_id,
          current_utilization: utilization,
          performance_score: performanceScore,
          recommended_weight: 0 // Will be calculated
        };
      });
    
    // Calculate total performance score
    const totalPerformanceScore = rebalanceData.reduce((sum, pub) => sum + pub.performance_score, 0);
    
    // Assign weights proportional to performance scores
    rebalanceData.forEach(pub => {
      pub.recommended_weight = Math.round((pub.performance_score / totalPerformanceScore) * 100);
    });
    
    // Apply new weights
    const newAssociations = rebalanceData.map(pub => ({
      publisher_id: pub.publisher_id,
      priority: 1,
      weight: pub.recommended_weight,
      health_check_enabled: true,
      failover_threshold: 80
    }));
    
    const updateResult = await updatePublisherAssociation(this.appId, {
      publisher_associations: newAssociations
    });
    
    return {
      app_id: this.appId,
      rebalance_timestamp: new Date().toISOString(),
      changes_made: rebalanceData.map(pub => ({
        publisher_id: pub.publisher_id,
        old_weight: appAssociation.publishers.find(p => p.publisher_id === pub.publisher_id)?.weight,
        new_weight: pub.recommended_weight,
        utilization: pub.current_utilization,
        performance_score: pub.performance_score
      })),
      update_result: updateResult
    };
  }
  
  async startAutoRebalancing(intervalMinutes: number = 15): Promise<void> {
    console.log(`Starting auto-rebalancing for app ${this.appId} every ${intervalMinutes} minutes`);
    
    const rebalanceInterval = setInterval(async () => {
      try {
        const result = await this.rebalanceTraffic();
        console.log(`Rebalanced traffic for ${this.appId}:`, result.changes_made);
      } catch (error) {
        console.error(`Rebalancing failed for ${this.appId}:`, error.message);
      }
    }, intervalMinutes * 60 * 1000);
    
    // Store interval for cleanup
    (this as any).rebalanceInterval = rebalanceInterval;
  }
  
  stopAutoRebalancing(): void {
    if ((this as any).rebalanceInterval) {
      clearInterval((this as any).rebalanceInterval);
      console.log(`Stopped auto-rebalancing for app ${this.appId}`);
    }
  }
}

// Usage
const loadBalancer = new DynamicLoadBalancer("app-high-traffic");
await loadBalancer.startAutoRebalancing(10); // Rebalance every 10 minutes
```

### Maintenance Mode Management

**Scenario**: Safely take publishers offline for maintenance with traffic migration.

```typescript
async function enableMaintenanceMode(
  publisherId: string,
  maintenanceWindowMinutes: number = 60
): Promise<MaintenanceModeResult> {
  
  console.log(`Initiating maintenance mode for publisher ${publisherId}`);
  
  // 1. Get all associations for this publisher
  const associations = await getPublisherAssociations();
  const affectedApps = associations.associations.filter(assoc => 
    assoc.publishers.some(pub => pub.publisher_id === publisherId)
  );
  
  console.log(`Found ${affectedApps.length} applications using publisher ${publisherId}`);
  
  // 2. For each affected app, ensure backup publishers are available
  const migrationPlan = [];
  
  for (const app of affectedApps) {
    const publisherAssociation = app.publishers.find(pub => pub.publisher_id === publisherId);
    const backupPublishers = app.publishers.filter(pub => 
      pub.publisher_id !== publisherId && pub.status === 'active'
    );
    
    if (backupPublishers.length === 0) {
      console.error(`No backup publishers available for app ${app.app_name}!`);
      throw new Error(`Cannot enable maintenance mode: ${app.app_name} has no backup publishers`);
    }
    
    migrationPlan.push({
      app_id: app.app_id,
      app_name: app.app_name,
      current_sessions: publisherAssociation.current_connections,
      backup_publishers: backupPublishers.map(pub => pub.publisher_id),
      migration_strategy: publisherAssociation.priority === 1 ? 'primary_failover' : 'remove_backup'
    });
  }
  
  // 3. Execute migration plan
  const migrationResults = [];
  
  for (const plan of migrationPlan) {
    console.log(`Migrating traffic for ${plan.app_name}...`);
    
    if (plan.migration_strategy === 'primary_failover') {
      // Promote backup publisher to primary
      const newPrimary = plan.backup_publishers[0];
      
      await updatePublisherAssociation(plan.app_id, {
        publisher_associations: [
          {
            publisher_id: newPrimary,
            priority: 1,
            weight: 100,
            health_check_enabled: true
          },
          {
            publisher_id: publisherId,
            priority: 99,               // Very low priority (maintenance mode)
            weight: 0,                  // No new traffic
            health_check_enabled: false
          }
        ]
      });
      
      migrationResults.push({
        app_id: plan.app_id,
        action: 'primary_failover',
        new_primary: newPrimary,
        sessions_migrating: plan.current_sessions
      });
      
    } else {
      // Simply remove backup publisher
      await removePublisherAssociation(plan.app_id, publisherId);
      
      migrationResults.push({
        app_id: plan.app_id,
        action: 'backup_removed',
        sessions_migrating: plan.current_sessions
      });
    }
  }
  
  // 4. Schedule maintenance mode end
  const maintenanceEndTime = new Date(Date.now() + maintenanceWindowMinutes * 60 * 1000);
  
  setTimeout(async () => {
    console.log(`Maintenance window ending for publisher ${publisherId}`);
    await disableMaintenanceMode(publisherId, migrationResults);
  }, maintenanceWindowMinutes * 60 * 1000);
  
  return {
    publisher_id: publisherId,
    maintenance_start: new Date().toISOString(),
    maintenance_end: maintenanceEndTime.toISOString(),
    affected_applications: affectedApps.length,
    total_sessions_migrated: migrationResults.reduce((sum, result) => 
      sum + result.sessions_migrating, 0
    ),
    migration_results: migrationResults
  };
}

async function disableMaintenanceMode(
  publisherId: string,
  originalMigrationResults: any[]
): Promise<void> {
  
  console.log(`Restoring publisher ${publisherId} from maintenance mode`);
  
  // Restore original associations
  for (const migration of originalMigrationResults) {
    if (migration.action === 'primary_failover') {
      // Restore original primary
      await updatePublisherAssociation(migration.app_id, {
        publisher_associations: [
          {
            publisher_id: publisherId,
            priority: 1,
            weight: 100,
            health_check_enabled: true
          },
          {
            publisher_id: migration.new_primary,
            priority: 2,                // Back to backup
            weight: 100,
            health_check_enabled: true
          }
        ]
      });
    } else {
      // Re-add as backup publisher
      await updatePublisherAssociation(migration.app_id, {
        publisher_associations: [{
          publisher_id: publisherId,
          priority: 2,
          weight: 100,
          health_check_enabled: true
        }]
      });
    }
  }
  
  console.log(`Publisher ${publisherId} restored from maintenance mode`);
}
```

## Performance Monitoring

### Association Health Monitoring

```typescript
class AssociationHealthMonitor {
  private readonly checkIntervalMs: number;
  private readonly thresholds: HealthThresholds;
  
  constructor(checkIntervalMs: number = 60000) {
    this.checkIntervalMs = checkIntervalMs;
    this.thresholds = {
      health_score_critical: 70,
      health_score_warning: 85,
      latency_critical_ms: 1000,
      latency_warning_ms: 500,
      utilization_critical: 90,
      utilization_warning: 80
    };
  }
  
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    const associations = await getPublisherAssociations();
    const healthResults = [];
    
    for (const app of associations.associations) {
      for (const publisher of app.publishers) {
        const health = this.assessPublisherHealth(publisher);
        
        if (health.status !== 'healthy') {
          healthResults.push({
            app_id: app.app_id,
            app_name: app.app_name,
            publisher_id: publisher.publisher_id,
            publisher_name: publisher.publisher_name,
            health_status: health.status,
            issues: health.issues,
            recommendations: health.recommendations,
            metrics: {
              health_score: publisher.health_score,
              latency_ms: publisher.average_latency_ms,
              utilization_percent: publisher.bandwidth_utilization_percent,
              connections: publisher.current_connections
            }
          });
        }
      }
    }
    
    return healthResults;
  }
  
  private assessPublisherHealth(publisher: any): PublisherHealthAssessment {
    const issues = [];
    const recommendations = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    // Check health score
    if (publisher.health_score < this.thresholds.health_score_critical) {
      issues.push(`Low health score: ${publisher.health_score}`);
      recommendations.push('Investigate publisher connectivity and resource usage');
      status = 'critical';
    } else if (publisher.health_score < this.thresholds.health_score_warning) {
      issues.push(`Degraded health score: ${publisher.health_score}`);
      status = 'warning';
    }
    
    // Check latency
    if (publisher.average_latency_ms > this.thresholds.latency_critical_ms) {
      issues.push(`High latency: ${publisher.average_latency_ms}ms`);
      recommendations.push('Check network connectivity and publisher location');
      status = 'critical';
    } else if (publisher.average_latency_ms > this.thresholds.latency_warning_ms) {
      issues.push(`Elevated latency: ${publisher.average_latency_ms}ms`);
      status = status === 'critical' ? 'critical' : 'warning';
    }
    
    // Check utilization
    if (publisher.bandwidth_utilization_percent > this.thresholds.utilization_critical) {
      issues.push(`High utilization: ${publisher.bandwidth_utilization_percent}%`);
      recommendations.push('Consider adding additional publishers or upgrading capacity');
      status = 'critical';
    } else if (publisher.bandwidth_utilization_percent > this.thresholds.utilization_warning) {
      issues.push(`Elevated utilization: ${publisher.bandwidth_utilization_percent}%`);
      status = status === 'critical' ? 'critical' : 'warning';
    }
    
    return { status, issues, recommendations };
  }
  
  startMonitoring(): void {
    setInterval(async () => {
      try {
        const healthResults = await this.performHealthCheck();
        
        if (healthResults.length > 0) {
          console.warn(`Found ${healthResults.length} publisher health issues:`);
          healthResults.forEach(result => {
            console.warn(`${result.app_name} -> ${result.publisher_name}: ${result.health_status}`, 
                        result.issues);
          });
        }
      } catch (error) {
        console.error('Health check failed:', error.message);
      }
    }, this.checkIntervalMs);
  }
}

// Usage
const healthMonitor = new AssociationHealthMonitor(30000); // Check every 30 seconds
healthMonitor.startMonitoring();
```

---

Steering tools provide essential traffic management capabilities for optimizing performance, ensuring availability, and maintaining efficient resource utilization across the Netskope NPA infrastructure.
