# Local Broker Tools

## Overview

Local Broker tools manage the network connectivity infrastructure that enables secure access to private applications through Netskope's zero-trust architecture. These tools handle broker deployment, configuration, and monitoring.

## Tool Summary

| Tool | Method | Description | Parameters |
|------|--------|-------------|------------|
| `createLocalBroker` | POST | Deploy a new local broker instance | Configuration object |
| `getLocalBrokers` | GET | List all local brokers | None |
| `getLocalBroker` | GET | Get specific broker details | broker_id |
| `updateLocalBroker` | PUT | Update broker configuration | broker_id, updates |
| `deleteLocalBroker` | DELETE | Remove broker instance | broker_id |
| `getBrokerStatus` | GET | Get broker health and status | broker_id |
| `assignBrokerToApp` | POST | Associate broker with private app | broker_id, app_id |

## Core Concepts

### Local Broker Architecture

Local brokers act as secure tunneling endpoints that:
- Establish encrypted connections to Netskope infrastructure
- Proxy traffic between users and private applications  
- Provide local network access without VPN complexity
- Scale horizontally for high availability

### Deployment Patterns

1. **Single Broker**: Basic deployment for small environments
2. **High Availability**: Multiple brokers with load balancing
3. **Geographic Distribution**: Brokers deployed near user populations
4. **Application-Specific**: Dedicated brokers for critical applications

## Tool Reference

### createLocalBroker

**Purpose**: Deploy a new local broker instance with network and security configuration.

**Parameters**:
```typescript
{
  name: string,                        // Broker display name
  location: {
    country: string,                   // ISO country code
    region: string,                    // Geographic region
    datacenter?: string                // Specific datacenter
  },
  network: {
    subnet: string,                    // Network subnet (CIDR)
    dns_servers: string[],            // DNS server IPs
    ntp_servers?: string[],           // NTP server IPs
    proxy_settings?: {
      host: string,
      port: number,
      auth?: { username: string, password: string }
    }
  },
  capacity: {
    max_concurrent_sessions: number,   // Session limit
    bandwidth_limit_mbps?: number     // Bandwidth cap
  },
  security: {
    certificate_pinning: boolean,      // Enable cert pinning
    require_client_cert: boolean,      // Client certificate requirement
    allowed_cipher_suites?: string[]   // Specific ciphers
  }
}
```

**Returns**:
```typescript
{
  id: string,
  name: string,
  status: 'deploying' | 'active' | 'error',
  deployment_url: string,              // Download URL for installer
  activation_key: string,              // Pre-shared activation key
  network_config: object,
  estimated_deployment_time: string    // ISO duration
}
```

**Usage Flow**:
1. `createLocalBroker()` → Generate deployment package
2. Deploy using provided installer and activation key
3. Monitor deployment with `getBrokerStatus()`
4. Associate with applications using `assignBrokerToApp()`

**Example**:
```
User: "Deploy a local broker for our European office network"

1. createLocalBroker({
     name: "Europe-Primary-Broker",
     location: { country: "DE", region: "eu-central-1" },
     network: {
       subnet: "10.50.0.0/24",
       dns_servers: ["10.50.0.1", "8.8.8.8"]
     },
     capacity: { max_concurrent_sessions: 500 },
     security: {
       certificate_pinning: true,
       require_client_cert: false
     }
   })
```

### getLocalBrokers

**Purpose**: List all local broker instances with status and configuration summary.

**Parameters**: None

**Returns**:
```typescript
{
  brokers: [
    {
      id: string,
      name: string,
      status: 'active' | 'inactive' | 'error' | 'upgrading',
      location: {
        country: string,
        region: string,
        datacenter?: string
      },
      network: {
        public_ip: string,
        private_subnet: string
      },
      capacity: {
        current_sessions: number,
        max_sessions: number,
        utilization_percent: number
      },
      version: string,
      last_seen: string,              // ISO timestamp
      associated_apps: number          // Count of linked apps
    }
  ]
}
```

**Common Workflows**:
1. **Capacity Planning**: Monitor utilization across brokers
2. **Health Monitoring**: Identify inactive or error brokers
3. **Version Management**: Track broker software versions

### getLocalBroker

**Purpose**: Get detailed information for a specific local broker instance.

**Parameters**:
```typescript
{
  broker_id: string
}
```

**Returns**:
```typescript
{
  id: string,
  name: string,
  status: 'active' | 'inactive' | 'error' | 'upgrading',
  
  // Network configuration
  network: {
    public_ip: string,
    private_ip: string,
    subnet: string,
    dns_servers: string[],
    routes: [
      {
        destination: string,           // CIDR block
        next_hop: string,
        interface: string
      }
    ]
  },
  
  // Performance metrics
  metrics: {
    current_sessions: number,
    peak_sessions_24h: number,
    bandwidth_usage_mbps: number,
    cpu_utilization: number,
    memory_utilization: number,
    uptime_seconds: number
  },
  
  // Associated resources
  applications: [
    {
      app_id: string,
      app_name: string,
      session_count: number
    }
  ],
  
  // Security status
  security: {
    certificate_status: 'valid' | 'expiring' | 'expired',
    certificate_expiry: string,      // ISO timestamp
    last_security_scan: string,      // ISO timestamp
    vulnerabilities: number
  },
  
  // Metadata
  version: string,
  created_at: string,
  updated_at: string,
  last_seen: string
}
```

**Integration Patterns**:
1. **Health Monitoring**: Monitor metrics and security status
2. **Troubleshooting**: Analyze network and performance issues
3. **Capacity Management**: Review session loads and utilization

### updateLocalBroker

**Purpose**: Update local broker configuration including network, capacity, and security settings.

**Parameters**:
```typescript
{
  broker_id: string,
  updates: {
    name?: string,
    network?: {
      dns_servers?: string[],
      ntp_servers?: string[],
      proxy_settings?: {
        host: string,
        port: number,
        auth?: { username: string, password: string }
      }
    },
    capacity?: {
      max_concurrent_sessions?: number,
      bandwidth_limit_mbps?: number
    },
    security?: {
      certificate_pinning?: boolean,
      require_client_cert?: boolean,
      allowed_cipher_suites?: string[]
    }
  }
}
```

**Returns**:
```typescript
{
  id: string,
  status: 'updating' | 'updated' | 'error',
  changes_applied: string[],           // List of updated fields
  restart_required: boolean,           // Whether broker restart needed
  estimated_downtime: string           // ISO duration if restart required
}
```

**Example Workflow**:
```
User: "Increase the session capacity for broker br-europe-1 to 1000"

1. updateLocalBroker("br-europe-1", {
     capacity: { max_concurrent_sessions: 1000 }
   })
2. Monitor status with getBrokerStatus()
3. Restart broker if restart_required: true
```

### deleteLocalBroker

**Purpose**: Safely remove a local broker instance after draining active sessions.

**Parameters**:
```typescript
{
  broker_id: string,
  force?: boolean                      // Skip graceful shutdown
}
```

**Returns**:
```typescript
{
  id: string,
  status: 'draining' | 'deleted' | 'error',
  active_sessions: number,             // Sessions being migrated
  estimated_completion: string,        // ISO timestamp
  cleanup_tasks: string[]              // List of cleanup operations
}
```

**Safety Workflow**:
1. Check active sessions with `getLocalBroker()`
2. Migrate critical applications to other brokers
3. Call `deleteLocalBroker()` with graceful shutdown
4. Monitor completion status

### getBrokerStatus

**Purpose**: Get real-time health and performance status for a local broker.

**Parameters**:
```typescript
{
  broker_id: string
}
```

**Returns**:
```typescript
{
  id: string,
  status: 'active' | 'inactive' | 'error' | 'upgrading',
  health_score: number,                // 0-100 overall health rating
  
  // Connectivity
  connectivity: {
    netskope_cloud: 'connected' | 'disconnected' | 'degraded',
    local_network: 'accessible' | 'limited' | 'unreachable',
    dns_resolution: 'working' | 'degraded' | 'failed',
    internet_access: 'full' | 'limited' | 'none'
  },
  
  // Performance
  performance: {
    response_time_ms: number,
    throughput_mbps: number,
    packet_loss_percent: number,
    connection_success_rate: number
  },
  
  // Resource utilization
  resources: {
    cpu_percent: number,
    memory_percent: number,
    disk_usage_percent: number,
    network_utilization_percent: number
  },
  
  // Active sessions
  sessions: {
    total_active: number,
    by_protocol: {
      tcp: number,
      udp: number,
      http: number,
      https: number
    }
  },
  
  // Recent events
  recent_events: [
    {
      timestamp: string,
      type: 'info' | 'warning' | 'error',
      message: string
    }
  ]
}
```

**Monitoring Workflows**:
1. **Health Dashboards**: Aggregate health scores across brokers
2. **Alerting**: Trigger alerts on performance degradation
3. **Troubleshooting**: Identify connectivity or resource issues

### assignBrokerToApp

**Purpose**: Associate a local broker with a private application for traffic routing.

**Parameters**:
```typescript
{
  broker_id: string,
  app_id: string,
  priority?: number,                   // Routing priority (1-10)
  backup_broker_ids?: string[]         // Failover brokers
}
```

**Returns**:
```typescript
{
  association_id: string,
  broker_id: string,
  app_id: string,
  status: 'active' | 'configuring' | 'error',
  routing_config: {
    primary: boolean,
    priority: number,
    backup_brokers: string[]
  },
  estimated_propagation_time: string   // ISO duration
}
```

**High Availability Pattern**:
```
User: "Set up high availability for CRM application with primary and backup brokers"

1. assignBrokerToApp("br-primary-1", "app-crm-1", { priority: 1 })
2. assignBrokerToApp("br-backup-1", "app-crm-1", { priority: 2 })
3. assignBrokerToApp("br-backup-2", "app-crm-1", { priority: 3 })
```

## Advanced Workflows

### Multi-Region Broker Deployment

**Scenario**: Deploy brokers across multiple regions for global access.

**Implementation**:
```typescript
// 1. Deploy regional brokers
const regions = [
  { name: "US-West", country: "US", region: "us-west-2" },
  { name: "Europe", country: "DE", region: "eu-central-1" },
  { name: "Asia-Pacific", country: "SG", region: "ap-southeast-1" }
];

for (const region of regions) {
  const broker = await createLocalBroker({
    name: `${region.name}-Broker`,
    location: { country: region.country, region: region.region },
    network: { subnet: getRegionalSubnet(region.region) },
    capacity: { max_concurrent_sessions: 1000 }
  });
  
  // Associate with regional applications
  const regionalApps = await getPrivateApps({ region: region.region });
  for (const app of regionalApps) {
    await assignBrokerToApp(broker.id, app.id, { priority: 1 });
  }
}
```

### Automated Failover Configuration

**Scenario**: Configure automatic failover between brokers for critical applications.

**Implementation**:
```typescript
// 1. Get critical applications
const criticalApps = await getPrivateApps({ 
  tags: [{ key: "criticality", value: "high" }] 
});

// 2. Get available brokers by region
const brokers = await getLocalBrokers();
const brokersByRegion = groupBy(brokers, 'location.region');

// 3. Configure multi-broker associations
for (const app of criticalApps) {
  const appRegion = app.location?.region;
  const regionalBrokers = brokersByRegion[appRegion] || [];
  
  // Primary broker (highest capacity)
  const primaryBroker = regionalBrokers.sort(
    (a, b) => b.capacity.max_sessions - a.capacity.max_sessions
  )[0];
  
  await assignBrokerToApp(primaryBroker.id, app.id, { priority: 1 });
  
  // Backup brokers
  const backupBrokers = regionalBrokers.slice(1, 3);
  for (let i = 0; i < backupBrokers.length; i++) {
    await assignBrokerToApp(backupBrokers[i].id, app.id, { 
      priority: i + 2 
    });
  }
}
```

### Performance Optimization

**Scenario**: Monitor and optimize broker performance across the infrastructure.

**Implementation**:
```typescript
// 1. Collect performance metrics
const brokers = await getLocalBrokers();
const performanceData = [];

for (const broker of brokers) {
  const status = await getBrokerStatus(broker.id);
  performanceData.push({
    id: broker.id,
    name: broker.name,
    utilization: status.resources.cpu_percent,
    sessions: status.sessions.total_active,
    response_time: status.performance.response_time_ms
  });
}

// 2. Identify optimization opportunities
const overloaded = performanceData.filter(b => 
  b.utilization > 80 || b.response_time > 500
);

// 3. Redistribute load
for (const broker of overloaded) {
  const details = await getLocalBroker(broker.id);
  
  // Find applications with high session counts
  const busyApps = details.applications
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, 3);
  
  // Move some apps to less utilized brokers
  const underutilized = performanceData
    .filter(b => b.utilization < 50)
    .sort((a, b) => a.utilization - b.utilization);
  
  if (underutilized.length > 0) {
    const targetBroker = underutilized[0];
    
    for (const app of busyApps.slice(0, 2)) {
      await assignBrokerToApp(targetBroker.id, app.app_id, { priority: 1 });
    }
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Network Connectivity Issues**
   - DNS resolution failures
   - Firewall blocking connections
   - Routing table conflicts

2. **Resource Constraints**
   - Insufficient CPU/memory
   - Session limit exceeded
   - Bandwidth saturation

3. **Configuration Errors**
   - Invalid network settings
   - Certificate issues
   - Authentication failures

### Error Recovery Patterns

```typescript
// Resilient broker health check
async function checkBrokerHealth(brokerId: string): Promise<BrokerHealth> {
  try {
    const status = await getBrokerStatus(brokerId);
    
    // Analyze health indicators
    const issues = [];
    if (status.performance.response_time_ms > 1000) {
      issues.push('High latency detected');
    }
    if (status.resources.cpu_percent > 90) {
      issues.push('CPU utilization critical');
    }
    if (status.connectivity.netskope_cloud !== 'connected') {
      issues.push('Cloud connectivity issues');
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues,
      recommendations: generateRecommendations(status, issues)
    };
  } catch (error) {
    return {
      status: 'unreachable',
      issues: ['Broker unreachable'],
      recommendations: ['Check network connectivity', 'Verify broker is running']
    };
  }
}
```

## Security Considerations

### Certificate Management

Local brokers use certificates for secure communication:
- Monitor certificate expiration dates
- Implement automated certificate renewal
- Use certificate pinning for enhanced security

### Network Security

- Configure firewall rules for broker traffic
- Implement network segmentation
- Monitor for unauthorized access attempts

### Access Control

- Limit broker management access to authorized personnel
- Use strong authentication for broker configuration
- Audit configuration changes

---

Local broker tools provide comprehensive management capabilities for secure, high-performance access to private applications through Netskope's zero-trust infrastructure.
