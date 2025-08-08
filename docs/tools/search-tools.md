# Search Tools

## Overview

Search tools provide efficient resource discovery capabilities across the Netskope NPA infrastructure. These tools enable quick identification of private applications and publishers using various search criteria.

## Tool Summary

| Tool | Method | Description | Parameters |
|------|--------|-------------|------------|
| `searchPrivateApps` | GET | Search private applications | Search criteria |
| `searchPublishers` | GET | Search publisher infrastructure | Search criteria |

## Core Concepts

### Search Architecture

The search tools utilize Netskope's dedicated search APIs for optimized performance:
- **Indexed Search**: Fast text-based searches across resource attributes
- **Filtered Queries**: Precise filtering by specific fields and values
- **Fuzzy Matching**: Tolerance for typos and partial matches
- **Faceted Results**: Results grouped by categories and attributes

### Search Patterns

1. **Resource Discovery**: Find resources by name, type, or attributes
2. **Operational Queries**: Locate resources for maintenance or configuration
3. **Compliance Searches**: Identify resources matching policy criteria
4. **Troubleshooting**: Quickly find resources related to issues

## Tool Reference

### searchPrivateApps

**Purpose**: Search and discover private applications using various criteria including name, host, tags, and configuration attributes.

**Parameters**:
```typescript
{
  search_criteria: {
    // Text search
    query?: string,                    // General text search across all fields
    app_name?: string,                 // Specific application name (supports wildcards)
    host?: string,                     // Host address or domain pattern
    
    // Filter criteria
    enabled?: boolean,                 // Application enabled status
    clientless_access?: boolean,       // Clientless access configuration
    protocols?: string[],              // Protocol types (tcp, udp, http, https)
    
    // Tag-based search
    tags?: {
      key: string,
      value?: string,                  // Optional value (if omitted, matches any value)
      operator?: 'equals' | 'contains' | 'starts_with'
    }[],
    
    // Publisher association
    publisher_names?: string[],        // Associated publisher names
    publisher_regions?: string[],      // Publisher regions
    
    // Advanced filters
    created_after?: string,            // ISO timestamp
    created_before?: string,           // ISO timestamp
    last_modified_after?: string,      // ISO timestamp
    
    // Search options
    fuzzy_match?: boolean,             // Enable fuzzy matching
    case_sensitive?: boolean,          // Case-sensitive search
    include_inactive?: boolean,        // Include disabled applications
    
    // Pagination
    limit?: number,                    // Max results (default 50, max 200)
    offset?: number                    // Result offset for pagination
  }
}
```

**Returns**:
```typescript
{
  search_results: {
    applications: [
      {
        id: string,
        app_name: string,
        host: string,
        enabled: boolean,
        
        // Configuration
        protocols: [
          {
            type: 'tcp' | 'udp' | 'http' | 'https',
            port: string
          }
        ],
        clientless_access: boolean,
        trust_untrusted_certificate: boolean,
        
        // Publisher associations
        associated_publishers: [
          {
            id: string,
            name: string,
            region: string,
            status: 'active' | 'inactive' | 'unhealthy'
          }
        ],
        
        // Organizational
        tags: [
          {
            key: string,
            value: string
          }
        ],
        category?: string,
        
        // Metadata
        created_at: string,
        updated_at: string,
        last_accessed?: string,
        
        // Usage statistics
        active_sessions?: number,
        total_users?: number,
        data_transferred_mb?: number
      }
    ],
    
    // Search metadata
    total_results: number,
    results_returned: number,
    search_time_ms: number,
    query_interpretation: string,      // How the search was interpreted
    
    // Pagination
    has_more: boolean,
    next_offset?: number,
    
    // Search facets
    facets: {
      by_protocol: Record<string, number>,    // Count by protocol type
      by_publisher: Record<string, number>,   // Count by publisher
      by_region: Record<string, number>,      // Count by region
      by_tags: Record<string, number>,        // Count by tag keys
      by_status: Record<string, number>       // Count by status
    },
    
    // Search suggestions
    suggestions?: string[]              // Alternative search terms
  }
}
```

**Search Examples**:

1. **Basic Name Search**:
```typescript
// Find applications with "CRM" in the name
const results = await searchPrivateApps({
  search_criteria: {
    query: "CRM",
    fuzzy_match: true
  }
});
```

2. **Host-based Search**:
```typescript
// Find applications hosted on internal domains
const results = await searchPrivateApps({
  search_criteria: {
    host: "*.internal.company.com",
    enabled: true
  }
});
```

3. **Tag-based Discovery**:
```typescript
// Find production applications in HR department
const results = await searchPrivateApps({
  search_criteria: {
    tags: [
      { key: "environment", value: "production" },
      { key: "department", value: "HR" }
    ]
  }
});
```

4. **Protocol-specific Search**:
```typescript
// Find HTTPS applications with clientless access
const results = await searchPrivateApps({
  search_criteria: {
    protocols: ["https"],
    clientless_access: true,
    enabled: true
  }
});
```

5. **Publisher Association Search**:
```typescript
// Find applications served by specific publishers
const results = await searchPrivateApps({
  search_criteria: {
    publisher_names: ["US-East-Publisher", "US-West-Publisher"],
    enabled: true
  }
});
```

6. **Recent Changes Search**:
```typescript
// Find recently modified applications
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const results = await searchPrivateApps({
  search_criteria: {
    last_modified_after: lastWeek,
    enabled: true,
    limit: 100
  }
});
```

### searchPublishers

**Purpose**: Search and discover publisher infrastructure using location, status, version, and configuration criteria.

**Parameters**:
```typescript
{
  search_criteria: {
    // Text search
    query?: string,                    // General text search
    name?: string,                     // Publisher name (supports wildcards)
    
    // Status filters
    status?: ('active' | 'inactive' | 'upgrading' | 'error')[],
    enabled?: boolean,
    
    // Version filters
    version?: string,                  // Specific version
    version_pattern?: string,          // Version pattern (e.g., "3.4.*")
    min_version?: string,              // Minimum version
    max_version?: string,              // Maximum version
    
    // Location filters
    countries?: string[],              // ISO country codes
    regions?: string[],                // Geographic regions
    datacenters?: string[],            // Specific datacenters
    
    // Network filters
    private_ip_range?: string,         // CIDR block
    public_ip_range?: string,          // CIDR block
    
    // Capacity filters
    min_capacity?: number,             // Minimum session capacity
    max_capacity?: number,             // Maximum session capacity
    utilization_threshold?: number,    // Current utilization percentage
    
    // Health filters
    health_score_min?: number,         // Minimum health score (0-100)
    health_score_max?: number,         // Maximum health score
    last_seen_after?: string,          // ISO timestamp
    last_seen_before?: string,         // ISO timestamp
    
    // Association filters
    associated_apps?: string[],        // Application names
    app_count_min?: number,            // Minimum associated apps
    app_count_max?: number,            // Maximum associated apps
    
    // Upgrade profile filters
    upgrade_profile_names?: string[],  // Assigned upgrade profiles
    has_upgrade_profile?: boolean,     // Has any upgrade profile
    
    // Search options
    fuzzy_match?: boolean,
    case_sensitive?: boolean,
    include_inactive?: boolean,
    
    // Pagination
    limit?: number,
    offset?: number
  }
}
```

**Returns**:
```typescript
{
  search_results: {
    publishers: [
      {
        id: string,
        name: string,
        description?: string,
        enabled: boolean,
        status: 'active' | 'inactive' | 'upgrading' | 'error',
        
        // Version information
        version: string,
        available_versions?: string[],   // Available upgrade versions
        upgrade_scheduled?: string,      // ISO timestamp
        
        // Location
        location: {
          country: string,
          region: string,
          datacenter?: string,
          coordinates?: {
            latitude: number,
            longitude: number
          }
        },
        
        // Network configuration
        network: {
          private_ip: string,
          public_ip: string,
          interfaces: [
            {
              name: string,
              type: 'ethernet' | 'wifi' | 'vpn',
              ip_address: string
            }
          ]
        },
        
        // Performance metrics
        performance: {
          health_score: number,          // 0-100
          cpu_utilization: number,       // Percentage
          memory_utilization: number,    // Percentage
          network_utilization: number,   // Percentage
          active_sessions: number,
          max_sessions: number,
          average_response_time_ms: number
        },
        
        // Associated applications
        associated_applications: [
          {
            id: string,
            name: string,
            host: string,
            session_count: number
          }
        ],
        
        // Upgrade configuration
        upgrade_profile?: {
          id: string,
          name: string,
          next_maintenance_window: string  // ISO timestamp
        },
        
        // Metadata
        created_at: string,
        updated_at: string,
        last_seen: string,
        deployment_method: 'manual' | 'automated' | 'cloud',
        
        // Tags and labels
        tags?: [
          {
            key: string,
            value: string
          }
        ]
      }
    ],
    
    // Search metadata
    total_results: number,
    results_returned: number,
    search_time_ms: number,
    query_interpretation: string,
    
    // Pagination
    has_more: boolean,
    next_offset?: number,
    
    // Search facets
    facets: {
      by_status: Record<string, number>,
      by_version: Record<string, number>,
      by_region: Record<string, number>,
      by_health_range: Record<string, number>,     // e.g., "90-100": 25
      by_utilization_range: Record<string, number>
    },
    
    // Geographic distribution
    geographic_distribution: [
      {
        region: string,
        country: string,
        publisher_count: number,
        average_health_score: number
      }
    ]
  }
}
```

**Search Examples**:

1. **Regional Publisher Discovery**:
```typescript
// Find all active publishers in US regions
const results = await searchPublishers({
  search_criteria: {
    regions: ["us-east-1", "us-west-2", "us-central-1"],
    status: ["active"],
    enabled: true
  }
});
```

2. **Performance-based Search**:
```typescript
// Find high-performing publishers for load balancing
const results = await searchPublishers({
  search_criteria: {
    health_score_min: 85,
    utilization_threshold: 70,    // Under 70% utilization
    status: ["active"],
    min_capacity: 500
  }
});
```

3. **Version Management Search**:
```typescript
// Find publishers requiring upgrades
const results = await searchPublishers({
  search_criteria: {
    max_version: "3.4.9",         // Below current version
    status: ["active"],
    enabled: true
  }
});
```

4. **Capacity Planning Search**:
```typescript
// Find publishers approaching capacity limits
const results = await searchPublishers({
  search_criteria: {
    utilization_threshold: 85,     // Over 85% utilized
    status: ["active"],
    app_count_min: 5              // Serving multiple apps
  }
});
```

5. **Health Monitoring Search**:
```typescript
// Find publishers with health issues
const results = await searchPublishers({
  search_criteria: {
    health_score_max: 80,
    last_seen_after: new Date(Date.now() - 60000).toISOString(), // Last minute
    status: ["active", "error"]
  }
});
```

## Advanced Search Workflows

### Multi-Criteria Application Discovery

**Scenario**: Find applications for compliance audit based on multiple criteria.

```typescript
async function findComplianceApplications(): Promise<ComplianceAuditResult> {
  // Search for applications that might need compliance review
  const searchCriteria = [
    // High-value applications
    {
      tags: [
        { key: "data_classification", value: "sensitive" },
        { key: "compliance_required", value: "true" }
      ],
      enabled: true
    },
    
    // Applications with external access
    {
      clientless_access: true,
      protocols: ["https", "http"],
      enabled: true
    },
    
    // Applications without recent reviews
    {
      tags: [
        { key: "last_compliance_review", value: "", operator: "equals" }
      ]
    }
  ];
  
  const allResults = [];
  
  for (const criteria of searchCriteria) {
    const results = await searchPrivateApps({
      search_criteria: criteria
    });
    allResults.push(...results.search_results.applications);
  }
  
  // Remove duplicates
  const uniqueApps = Array.from(
    new Map(allResults.map(app => [app.id, app])).values()
  );
  
  // Categorize by compliance risk
  const riskCategories = {
    high: [],
    medium: [],
    low: []
  };
  
  for (const app of uniqueApps) {
    const risk = assessComplianceRisk(app);
    riskCategories[risk].push(app);
  }
  
  return {
    total_applications: uniqueApps.length,
    risk_distribution: {
      high: riskCategories.high.length,
      medium: riskCategories.medium.length,
      low: riskCategories.low.length
    },
    applications_by_risk: riskCategories,
    recommendations: generateComplianceRecommendations(riskCategories)
  };
}

function assessComplianceRisk(app: any): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Increase score for risk factors
  if (app.clientless_access) score += 2;
  if (app.trust_untrusted_certificate) score += 3;
  if (app.protocols.some(p => p.type === 'http')) score += 2;
  
  // Check tags for sensitive data
  const sensitiveTag = app.tags.find(tag => 
    tag.key === 'data_classification' && 
    ['sensitive', 'confidential', 'restricted'].includes(tag.value)
  );
  if (sensitiveTag) score += 3;
  
  // No recent compliance review
  const reviewTag = app.tags.find(tag => tag.key === 'last_compliance_review');
  if (!reviewTag || !reviewTag.value) score += 2;
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
```

### Infrastructure Health Assessment

**Scenario**: Search for publishers requiring attention based on multiple health indicators.

```typescript
async function performInfrastructureHealthScan(): Promise<HealthScanResult> {
  const healthChecks = [
    {
      name: "Low Health Score Publishers",
      criteria: {
        health_score_max: 75,
        status: ["active"],
        enabled: true
      }
    },
    {
      name: "High Utilization Publishers", 
      criteria: {
        utilization_threshold: 85,
        status: ["active"]
      }
    },
    {
      name: "Outdated Version Publishers",
      criteria: {
        max_version: "3.4.9",
        status: ["active"],
        enabled: true
      }
    },
    {
      name: "Communication Issues",
      criteria: {
        last_seen_before: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        status: ["active"]
      }
    },
    {
      name: "Overloaded Publishers",
      criteria: {
        app_count_min: 20,  // Serving many apps
        utilization_threshold: 80
      }
    }
  ];
  
  const healthResults = {};
  
  for (const check of healthChecks) {
    const searchResult = await searchPublishers({
      search_criteria: check.criteria
    });
    
    healthResults[check.name] = {
      count: searchResult.search_results.total_results,
      publishers: searchResult.search_results.publishers,
      severity: calculateSeverity(check.name, searchResult.search_results.total_results)
    };
  }
  
  // Generate actionable recommendations
  const recommendations = [];
  
  if (healthResults["Low Health Score Publishers"].count > 0) {
    recommendations.push({
      priority: "high",
      action: "investigate_publisher_health",
      affected_count: healthResults["Low Health Score Publishers"].count,
      description: "Publishers with low health scores require immediate attention"
    });
  }
  
  if (healthResults["High Utilization Publishers"].count > 3) {
    recommendations.push({
      priority: "medium",
      action: "scale_infrastructure", 
      affected_count: healthResults["High Utilization Publishers"].count,
      description: "Consider deploying additional publishers for load distribution"
    });
  }
  
  if (healthResults["Outdated Version Publishers"].count > 0) {
    recommendations.push({
      priority: "medium",
      action: "schedule_upgrades",
      affected_count: healthResults["Outdated Version Publishers"].count,
      description: "Schedule maintenance windows for publisher upgrades"
    });
  }
  
  return {
    scan_timestamp: new Date().toISOString(),
    health_checks: healthResults,
    overall_health: calculateOverallHealth(healthResults),
    recommendations,
    next_scan_recommended: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
  };
}

function calculateSeverity(checkName: string, count: number): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap = {
    "Low Health Score Publishers": count > 5 ? 'critical' : count > 2 ? 'high' : count > 0 ? 'medium' : 'low',
    "High Utilization Publishers": count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
    "Outdated Version Publishers": count > 20 ? 'high' : count > 10 ? 'medium' : 'low',
    "Communication Issues": count > 0 ? 'critical' : 'low',
    "Overloaded Publishers": count > 3 ? 'high' : count > 1 ? 'medium' : 'low'
  };
  
  return severityMap[checkName] || 'low';
}
```

### Automated Resource Optimization

**Scenario**: Use search results to automatically optimize resource allocation.

```typescript
class ResourceOptimizer {
  async optimizeApplicationDistribution(): Promise<OptimizationResult> {
    console.log("Starting resource optimization analysis...");
    
    // 1. Find overloaded publishers
    const overloadedPublishers = await searchPublishers({
      search_criteria: {
        utilization_threshold: 80,
        status: ["active"]
      }
    });
    
    // 2. Find underutilized publishers
    const underutilizedPublishers = await searchPublishers({
      search_criteria: {
        health_score_min: 85,
        status: ["active"],
        app_count_max: 5  // Serving few applications
      }
    });
    
    // 3. Analyze application distribution opportunities
    const optimizations = [];
    
    for (const overloadedPub of overloadedPublishers.search_results.publishers) {
      // Find applications that could be moved
      const appResults = await searchPrivateApps({
        search_criteria: {
          publisher_names: [overloadedPub.name],
          enabled: true
        }
      });
      
      // Sort by session count (move low-traffic apps first)
      const movableApps = appResults.search_results.applications
        .sort((a, b) => (a.active_sessions || 0) - (b.active_sessions || 0))
        .slice(0, 3); // Move up to 3 apps
      
      // Find suitable target publishers in same region
      const regionalTargets = underutilizedPublishers.search_results.publishers
        .filter(pub => pub.location.region === overloadedPub.location.region)
        .sort((a, b) => a.performance.active_sessions - b.performance.active_sessions);
      
      if (regionalTargets.length > 0 && movableApps.length > 0) {
        optimizations.push({
          source_publisher: {
            id: overloadedPub.id,
            name: overloadedPub.name,
            current_utilization: overloadedPub.performance.network_utilization
          },
          target_publisher: {
            id: regionalTargets[0].id,
            name: regionalTargets[0].name,
            current_utilization: regionalTargets[0].performance.network_utilization
          },
          applications_to_move: movableApps.map(app => ({
            id: app.id,
            name: app.app_name,
            session_count: app.active_sessions || 0
          })),
          estimated_benefit: {
            source_utilization_reduction: calculateUtilizationReduction(overloadedPub, movableApps),
            target_utilization_increase: calculateUtilizationIncrease(regionalTargets[0], movableApps),
            improved_response_time: true
          }
        });
      }
    }
    
    return {
      optimization_timestamp: new Date().toISOString(),
      analysis_summary: {
        overloaded_publishers: overloadedPublishers.search_results.total_results,
        underutilized_publishers: underutilizedPublishers.search_results.total_results,
        optimization_opportunities: optimizations.length
      },
      optimizations,
      estimated_impact: {
        publishers_improved: optimizations.length * 2, // Source and target
        applications_affected: optimizations.reduce((sum, opt) => 
          sum + opt.applications_to_move.length, 0
        ),
        expected_performance_improvement: "15-25%"
      }
    };
  }
  
  async executeOptimizations(optimizations: OptimizationResult): Promise<void> {
    console.log(`Executing ${optimizations.optimizations.length} optimizations...`);
    
    for (const opt of optimizations.optimizations) {
      try {
        // Move applications to target publisher
        for (const app of opt.applications_to_move) {
          await updatePublisherAssociation(app.id, {
            publisher_associations: [{
              publisher_id: opt.target_publisher.id,
              priority: 1,
              weight: 100,
              health_check_enabled: true
            }]
          });
          
          console.log(`Moved ${app.name} from ${opt.source_publisher.name} to ${opt.target_publisher.name}`);
        }
      } catch (error) {
        console.error(`Failed to execute optimization for ${opt.source_publisher.name}:`, error.message);
      }
    }
  }
}

// Usage
const optimizer = new ResourceOptimizer();
const optimizationPlan = await optimizer.optimizeApplicationDistribution();

if (optimizationPlan.optimizations.length > 0) {
  console.log("Optimization opportunities found:", optimizationPlan);
  
  // Execute optimizations (in production, this might require approval)
  await optimizer.executeOptimizations(optimizationPlan);
}
```

## Performance Optimization

### Search Query Optimization

```typescript
class SearchOptimizer {
  private queryCache = new Map<string, { result: any, expires: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async optimizedSearch<T>(
    searchFunction: () => Promise<T>,
    cacheKey: string
  ): Promise<T> {
    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.result;
    }
    
    // Execute search
    const result = await searchFunction();
    
    // Cache result
    this.queryCache.set(cacheKey, {
      result,
      expires: Date.now() + this.cacheTimeout
    });
    
    return result;
  }
  
  async searchWithBatching(
    searchType: 'apps' | 'publishers',
    criteriaList: any[]
  ): Promise<any[]> {
    const batchSize = 5; // Process 5 searches concurrently
    const results = [];
    
    for (let i = 0; i < criteriaList.length; i += batchSize) {
      const batch = criteriaList.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async criteria => {
        const cacheKey = `${searchType}:${JSON.stringify(criteria)}`;
        
        return this.optimizedSearch(async () => {
          if (searchType === 'apps') {
            return searchPrivateApps({ search_criteria: criteria });
          } else {
            return searchPublishers({ search_criteria: criteria });
          }
        }, cacheKey);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  generateOptimalQuery(userInput: SearchInput): OptimizedQuery {
    // Analyze user input and generate optimized search criteria
    const optimized = {
      ...userInput,
      limit: Math.min(userInput.limit || 50, 200), // Cap at API limit
      fuzzy_match: userInput.query?.length > 10 ? false : true, // Disable fuzzy for long queries
    };
    
    // Add performance hints
    if (userInput.tags && userInput.tags.length > 0) {
      // Tag searches are typically faster
      optimized.case_sensitive = false;
    }
    
    return optimized;
  }
}
```

## Error Handling

### Search Resilience

```typescript
class SearchResilience {
  async resilientSearch<T>(
    searchOperation: () => Promise<T>,
    fallbackStrategies: (() => Promise<T>)[] = []
  ): Promise<T> {
    try {
      return await searchOperation();
    } catch (error) {
      console.warn('Primary search failed, attempting fallback strategies:', error.message);
      
      for (let i = 0; i < fallbackStrategies.length; i++) {
        try {
          console.log(`Attempting fallback strategy ${i + 1}...`);
          return await fallbackStrategies[i]();
        } catch (fallbackError) {
          console.warn(`Fallback strategy ${i + 1} failed:`, fallbackError.message);
        }
      }
      
      throw new Error(`All search strategies failed. Last error: ${error.message}`);
    }
  }
  
  async searchWithFallback(searchCriteria: any): Promise<any> {
    const primarySearch = () => searchPrivateApps({ search_criteria: searchCriteria });
    
    const fallbackStrategies = [
      // Fallback 1: Simplified search (remove complex filters)
      () => searchPrivateApps({
        search_criteria: {
          query: searchCriteria.query,
          enabled: searchCriteria.enabled
        }
      }),
      
      // Fallback 2: Basic name search only
      () => searchPrivateApps({
        search_criteria: {
          app_name: searchCriteria.app_name || searchCriteria.query
        }
      }),
      
      // Fallback 3: List all (with pagination)
      () => searchPrivateApps({
        search_criteria: {
          limit: 20
        }
      })
    ];
    
    return this.resilientSearch(primarySearch, fallbackStrategies);
  }
}
```

---

Search tools provide essential discovery capabilities that enable efficient resource management, troubleshooting, and operational workflows across the Netskope NPA infrastructure.
