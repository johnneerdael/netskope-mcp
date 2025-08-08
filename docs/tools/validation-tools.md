# Validation Tools

## Overview

Validation tools provide comprehensive resource validation and compliance checking capabilities for Netskope NPA infrastructure. These tools ensure configuration integrity, naming compliance, and operational best practices.

## Tool Summary

| Tool | Method | Description | Parameters |
|------|--------|-------------|------------|
| `validateName` | POST | Validate resource names against conventions | name, resource_type |
| `validateConfiguration` | POST | Check resource configuration compliance | resource_id, resource_type, checks |

## Core Concepts

### Validation Framework

The validation system enforces organizational standards through:

1. **Naming Conventions**: Consistent resource naming patterns
2. **Configuration Standards**: Best practice configuration validation
3. **Security Compliance**: Security policy adherence checking
4. **Operational Rules**: Operational procedure compliance
5. **Data Integrity**: Cross-reference validation between resources

### Validation Categories

- **Syntactic Validation**: Name format and character validation
- **Semantic Validation**: Business rule and policy compliance
- **Security Validation**: Security configuration and access control checks
- **Performance Validation**: Performance and capacity rule compliance
- **Operational Validation**: Maintenance and operational procedure checks

## Tool Reference

### validateName

**Purpose**: Validate resource names against organizational naming conventions and standards.

**Parameters**:
```typescript
{
  name: string,                        // Resource name to validate
  resource_type: 'publisher' | 'private_app' | 'policy_group' | 'policy_rule' | 'local_broker' | 'upgrade_profile',
  validation_options?: {
    strict_mode?: boolean,             // Enable strict validation rules
    custom_rules?: string[],           // Additional custom validation rules
    ignore_warnings?: boolean,         // Ignore warning-level violations
    check_uniqueness?: boolean,        // Verify name uniqueness
    organization_prefix?: string       // Required organization prefix
  }
}
```

**Returns**:
```typescript
{
  validation_result: {
    is_valid: boolean,
    name: string,
    resource_type: string,
    
    // Validation status
    status: 'valid' | 'invalid' | 'warning',
    score: number,                     // Compliance score (0-100)
    
    // Detailed results
    checks_performed: [
      {
        check_type: string,            // Type of validation check
        rule_name: string,             // Specific rule name
        status: 'pass' | 'fail' | 'warning',
        message: string,               // Human-readable result
        severity: 'info' | 'warning' | 'error' | 'critical',
        suggestion?: string            // Improvement suggestion
      }
    ],
    
    // Name analysis
    name_analysis: {
      length: number,
      character_types: string[],       // e.g., ['alphanumeric', 'hyphens']
      pattern_matches: string[],       // Matched naming patterns
      forbidden_patterns: string[],   // Violated patterns
      case_style: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase' | 'mixed',
      organization_compliance: boolean
    },
    
    // Uniqueness check (if enabled)
    uniqueness_check?: {
      is_unique: boolean,
      conflicts: [
        {
          resource_id: string,
          resource_name: string,
          resource_type: string,
          created_at: string
        }
      ]
    },
    
    // Suggestions for improvement
    suggestions: [
      {
        type: 'naming_convention' | 'format' | 'uniqueness' | 'best_practice',
        priority: 'low' | 'medium' | 'high',
        current_issue: string,
        recommended_action: string,
        example?: string
      }
    ],
    
    // Alternative name suggestions
    alternative_names?: string[]       // Valid alternative names
  }
}
```

**Naming Convention Examples**:

1. **Publisher Name Validation**:
```typescript
// Valid publisher names
const validPublisher = await validateName({
  name: "US-East-Production-Pub-01",
  resource_type: "publisher",
  validation_options: {
    strict_mode: true,
    check_uniqueness: true,
    organization_prefix: "US-"
  }
});

// Result: is_valid: true, score: 95
```

2. **Application Name Validation**:
```typescript
// Check application name compliance
const appValidation = await validateName({
  name: "CRM-Production-WebApp",
  resource_type: "private_app",
  validation_options: {
    custom_rules: ["no_special_chars", "max_length_32"],
    check_uniqueness: true
  }
});

// Returns detailed validation with suggestions
```

3. **Policy Group Name Validation**:
```typescript
// Validate policy group naming
const policyValidation = await validateName({
  name: "Engineering-Team-Access-Policy",
  resource_type: "policy_group",
  validation_options: {
    strict_mode: false,  // Allow some flexibility
    ignore_warnings: false
  }
});
```

**Common Naming Rules**:
- **Publishers**: `{Region}-{Environment}-{Type}-{Number}` (e.g., "US-East-Prod-Pub-01")
- **Private Apps**: `{AppName}-{Environment}-{Type}` (e.g., "CRM-Production-WebApp") 
- **Policy Groups**: `{Department}-{Purpose}-Policy` (e.g., "Engineering-Access-Policy")
- **Local Brokers**: `{Location}-{Type}-Broker-{Number}` (e.g., "NYC-Office-Broker-01")

### validateConfiguration

**Purpose**: Perform comprehensive configuration validation and compliance checking for resources.

**Parameters**:
```typescript
{
  resource_id: string,               // Resource identifier to validate
  resource_type: 'publisher' | 'private_app' | 'policy_group' | 'policy_rule' | 'local_broker',
  validation_checks: [
    // Available validation types
    'naming_convention',             // Resource naming compliance
    'security_settings',             // Security configuration validation
    'network_configuration',         // Network settings validation
    'access_controls',               // Access control validation
    'performance_settings',          // Performance configuration validation
    'metadata_completeness',         // Required metadata validation
    'integration_compliance',        // Integration and dependency validation
    'backup_configuration',          // Backup and recovery validation
    'monitoring_setup',              // Monitoring configuration validation
    'compliance_standards'           // Industry compliance validation (SOC2, PCI, etc.)
  ],
  validation_options?: {
    compliance_frameworks?: ('SOC2' | 'PCI-DSS' | 'HIPAA' | 'GDPR')[],
    security_level?: 'basic' | 'standard' | 'strict' | 'maximum',
    performance_tier?: 'development' | 'staging' | 'production' | 'critical',
    organization_policies?: string[], // Custom organization policy IDs
    ignore_warnings?: boolean
  }
}
```

**Returns**:
```typescript
{
  validation_result: {
    resource_id: string,
    resource_type: string,
    resource_name?: string,
    
    // Overall validation status
    overall_status: 'compliant' | 'non_compliant' | 'warnings',
    compliance_score: number,        // Overall score (0-100)
    validation_timestamp: string,    // ISO timestamp
    
    // Detailed check results
    check_results: [
      {
        check_category: string,      // e.g., 'security_settings'
        check_name: string,          // e.g., 'certificate_validation'
        status: 'pass' | 'fail' | 'warning' | 'not_applicable',
        severity: 'info' | 'warning' | 'error' | 'critical',
        
        // Check details
        description: string,         // What was checked
        current_value: any,          // Current configuration value
        expected_value?: any,        // Expected/recommended value
        message: string,             // Detailed result message
        
        // Remediation
        remediation_required: boolean,
        remediation_steps?: string[],
        remediation_priority: 'low' | 'medium' | 'high' | 'critical',
        estimated_fix_time?: string, // ISO duration
        
        // Context
        policy_reference?: string,   // Policy or standard reference
        risk_assessment?: {
          risk_level: 'low' | 'medium' | 'high' | 'critical',
          impact_description: string,
          mitigation_required: boolean
        }
      }
    ],
    
    // Category summaries
    category_scores: Record<string, {
      score: number,               // Category score (0-100)
      passed_checks: number,
      failed_checks: number,
      warning_checks: number,
      critical_issues: number
    }>,
    
    // Compliance framework results
    compliance_frameworks?: Record<string, {
      framework_name: string,
      compliance_percentage: number,
      compliant_controls: number,
      total_controls: number,
      critical_failures: number,
      certification_ready: boolean
    }>,
    
    // Security assessment
    security_assessment?: {
      security_score: number,      // Security-specific score
      vulnerability_count: number,
      high_risk_issues: number,
      encryption_compliance: boolean,
      access_control_compliance: boolean,
      audit_readiness: boolean
    },
    
    // Performance assessment
    performance_assessment?: {
      performance_score: number,
      capacity_utilization: number,
      bottlenecks_identified: string[],
      scalability_issues: number,
      optimization_opportunities: string[]
    },
    
    // Remediation summary
    remediation_summary: {
      total_issues: number,
      critical_issues: number,
      high_priority_issues: number,
      estimated_total_fix_time: string, // ISO duration
      recommended_fix_order: [
        {
          check_name: string,
          priority: 'critical' | 'high' | 'medium' | 'low',
          estimated_time: string,
          dependencies?: string[]   // Other checks that must be fixed first
        }
      ]
    },
    
    // Next validation recommendation
    next_validation_recommended: string, // ISO timestamp
    continuous_monitoring_available: boolean
  }
}
```

**Configuration Validation Examples**:

1. **Publisher Security Validation**:
```typescript
const publisherValidation = await validateConfiguration({
  resource_id: "pub-us-east-prod-01",
  resource_type: "publisher",
  validation_checks: [
    "security_settings",
    "network_configuration", 
    "monitoring_setup",
    "backup_configuration"
  ],
  validation_options: {
    security_level: "strict",
    compliance_frameworks: ["SOC2"],
    performance_tier: "production"
  }
});

// Example result:
// {
//   overall_status: "non_compliant",
//   compliance_score: 78,
//   check_results: [
//     {
//       check_category: "security_settings",
//       check_name: "certificate_expiry",
//       status: "warning",
//       severity: "warning",
//       message: "SSL certificate expires in 15 days",
//       remediation_required: true,
//       remediation_steps: ["Schedule certificate renewal", "Update certificate before expiry"]
//     }
//   ]
// }
```

2. **Private Application Compliance Check**:
```typescript
const appValidation = await validateConfiguration({
  resource_id: "app-crm-production",
  resource_type: "private_app",
  validation_checks: [
    "security_settings",
    "access_controls",
    "compliance_standards",
    "integration_compliance"
  ],
  validation_options: {
    compliance_frameworks: ["PCI-DSS", "SOC2"],
    security_level: "maximum",
    organization_policies: ["data-classification-policy", "access-control-policy"]
  }
});
```

3. **Policy Group Validation**:
```typescript
const policyValidation = await validateConfiguration({
  resource_id: "pg-engineering-access",
  resource_type: "policy_group", 
  validation_checks: [
    "access_controls",
    "security_settings",
    "compliance_standards",
    "metadata_completeness"
  ],
  validation_options: {
    compliance_frameworks: ["GDPR"],
    security_level: "standard"
  }
});
```

## Advanced Validation Workflows

### Comprehensive Infrastructure Audit

**Scenario**: Perform organization-wide compliance validation across all resource types.

```typescript
async function performInfrastructureAudit(
  complianceFrameworks: string[] = ["SOC2"],
  securityLevel: string = "standard"
): Promise<InfrastructureAuditResult> {
  
  console.log("Starting comprehensive infrastructure audit...");
  
  // 1. Get all resources for validation
  const [publishers, privateApps, policyGroups] = await Promise.all([
    searchPublishers({ search_criteria: { enabled: true } }),
    searchPrivateApps({ search_criteria: { enabled: true } }),
    // Note: getPolicyGroups would be used here if available
    Promise.resolve({ search_results: { groups: [] } }) // Placeholder
  ]);
  
  const auditResults = {
    audit_timestamp: new Date().toISOString(),
    scope: {
      publishers: publishers.search_results.total_results,
      private_apps: privateApps.search_results.total_results,
      policy_groups: 0, // policyGroups.length
    },
    validation_results: {
      publishers: [],
      private_apps: [],
      policy_groups: []
    },
    compliance_summary: {},
    critical_findings: [],
    recommendations: []
  };
  
  // 2. Validate all publishers
  console.log(`Validating ${publishers.search_results.publishers.length} publishers...`);
  
  for (const publisher of publishers.search_results.publishers) {
    const validation = await validateConfiguration({
      resource_id: publisher.id,
      resource_type: "publisher",
      validation_checks: [
        "security_settings",
        "network_configuration",
        "performance_settings",
        "monitoring_setup",
        "backup_configuration"
      ],
      validation_options: {
        compliance_frameworks: complianceFrameworks,
        security_level: securityLevel,
        performance_tier: "production"
      }
    });
    
    auditResults.validation_results.publishers.push({
      resource_id: publisher.id,
      resource_name: publisher.name,
      validation: validation.validation_result
    });
    
    // Collect critical findings
    const criticalIssues = validation.validation_result.check_results.filter(
      check => check.severity === 'critical'
    );
    
    if (criticalIssues.length > 0) {
      auditResults.critical_findings.push({
        resource_type: 'publisher',
        resource_name: publisher.name,
        critical_issues: criticalIssues.length,
        issues: criticalIssues.map(issue => ({
          check_name: issue.check_name,
          message: issue.message,
          risk_level: issue.risk_assessment?.risk_level
        }))
      });
    }
  }
  
  // 3. Validate all private applications
  console.log(`Validating ${privateApps.search_results.applications.length} private applications...`);
  
  for (const app of privateApps.search_results.applications) {
    const validation = await validateConfiguration({
      resource_id: app.id,
      resource_type: "private_app",
      validation_checks: [
        "security_settings",
        "access_controls",
        "network_configuration",
        "compliance_standards"
      ],
      validation_options: {
        compliance_frameworks: complianceFrameworks,
        security_level: securityLevel
      }
    });
    
    auditResults.validation_results.private_apps.push({
      resource_id: app.id,
      resource_name: app.app_name,
      validation: validation.validation_result
    });
    
    // Collect critical findings
    const criticalIssues = validation.validation_result.check_results.filter(
      check => check.severity === 'critical'
    );
    
    if (criticalIssues.length > 0) {
      auditResults.critical_findings.push({
        resource_type: 'private_app',
        resource_name: app.app_name,
        critical_issues: criticalIssues.length,
        issues: criticalIssues.map(issue => ({
          check_name: issue.check_name,
          message: issue.message,
          risk_level: issue.risk_assessment?.risk_level
        }))
      });
    }
  }
  
  // 4. Generate compliance summary
  auditResults.compliance_summary = generateComplianceSummary(auditResults.validation_results);
  
  // 5. Generate recommendations
  auditResults.recommendations = generateAuditRecommendations(auditResults);
  
  return auditResults;
}

function generateComplianceSummary(validationResults: any): ComplianceSummary {
  const summary = {
    overall_compliance_score: 0,
    total_resources: 0,
    compliant_resources: 0,
    non_compliant_resources: 0,
    resources_with_warnings: 0,
    
    by_resource_type: {},
    by_compliance_framework: {},
    
    top_violations: [],
    security_score: 0,
    critical_security_issues: 0
  };
  
  let totalScore = 0;
  let resourceCount = 0;
  
  // Process each resource type
  for (const [resourceType, resources] of Object.entries(validationResults)) {
    const typeResults = resources as any[];
    const typeScores = typeResults.map(r => r.validation.compliance_score);
    
    summary.by_resource_type[resourceType] = {
      total: typeResults.length,
      average_score: typeScores.reduce((a, b) => a + b, 0) / typeResults.length || 0,
      compliant: typeResults.filter(r => r.validation.overall_status === 'compliant').length,
      non_compliant: typeResults.filter(r => r.validation.overall_status === 'non_compliant').length
    };
    
    totalScore += typeScores.reduce((a, b) => a + b, 0);
    resourceCount += typeResults.length;
  }
  
  summary.overall_compliance_score = resourceCount > 0 ? totalScore / resourceCount : 0;
  summary.total_resources = resourceCount;
  
  return summary;
}
```

### Automated Remediation Workflow

**Scenario**: Automatically fix common configuration issues identified during validation.

```typescript
class ValidationRemediationEngine {
  async autoRemediate(
    validationResult: any,
    autoFixEnabled: boolean = false
  ): Promise<RemediationResult> {
    
    const remediationPlan = this.createRemediationPlan(validationResult);
    
    if (!autoFixEnabled) {
      return {
        plan_generated: true,
        plan: remediationPlan,
        auto_fixes_applied: 0,
        manual_fixes_required: remediationPlan.steps.length
      };
    }
    
    const results = {
      plan,
      auto_fixes_applied: 0,
      auto_fix_failures: 0,
      manual_fixes_required: 0,
      fix_results: []
    };
    
    // Execute auto-fixable remediation steps
    for (const step of remediationPlan.steps) {
      if (step.auto_fixable) {
        try {
          const fixResult = await this.executeAutoFix(
            validationResult.resource_id,
            validationResult.resource_type,
            step
          );
          
          results.fix_results.push({
            step_name: step.name,
            status: 'success',
            applied_fix: fixResult.fix_applied,
            validation_after_fix: fixResult.validation_result
          });
          
          results.auto_fixes_applied++;
        } catch (error) {
          results.fix_results.push({
            step_name: step.name,
            status: 'failed',
            error_message: error.message
          });
          
          results.auto_fix_failures++;
        }
      } else {
        results.manual_fixes_required++;
      }
    }
    
    // Re-validate after fixes
    if (results.auto_fixes_applied > 0) {
      const postFixValidation = await validateConfiguration({
        resource_id: validationResult.resource_id,
        resource_type: validationResult.resource_type,
        validation_checks: this.getOriginalChecks(validationResult),
        validation_options: this.getOriginalOptions(validationResult)
      });
      
      results.post_fix_validation = postFixValidation.validation_result;
      results.improvement_score = postFixValidation.validation_result.compliance_score - 
                                 validationResult.compliance_score;
    }
    
    return results;
  }
  
  private createRemediationPlan(validationResult: any): RemediationPlan {
    const steps = [];
    
    // Sort issues by priority and auto-fix capability
    const sortedIssues = validationResult.check_results
      .filter(check => check.status === 'fail' || check.status === 'warning')
      .sort((a, b) => {
        // Priority order: critical > high > medium > low
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.remediation_priority] - priorityOrder[a.remediation_priority];
      });
    
    for (const issue of sortedIssues) {
      const autoFixable = this.canAutoFix(
        validationResult.resource_type,
        issue.check_category,
        issue.check_name
      );
      
      steps.push({
        name: issue.check_name,
        category: issue.check_category,
        description: issue.description,
        current_issue: issue.message,
        remediation_steps: issue.remediation_steps || [],
        priority: issue.remediation_priority,
        estimated_time: issue.estimated_fix_time,
        auto_fixable: autoFixable,
        dependencies: this.getFixDependencies(issue.check_name),
        risk_of_fix: this.assessFixRisk(issue)
      });
    }
    
    return {
      resource_id: validationResult.resource_id,
      resource_type: validationResult.resource_type,
      total_steps: steps.length,
      auto_fixable_steps: steps.filter(s => s.auto_fixable).length,
      estimated_total_time: this.calculateTotalTime(steps),
      steps
    };
  }
  
  private canAutoFix(resourceType: string, category: string, checkName: string): boolean {
    // Define which checks can be automatically fixed
    const autoFixableChecks = {
      publisher: {
        security_settings: ['weak_cipher_suites', 'outdated_tls_version'],
        network_configuration: ['dns_timeout_config', 'connection_pool_size'],
        monitoring_setup: ['missing_health_checks', 'log_level_config']
      },
      private_app: {
        security_settings: ['unencrypted_connection', 'weak_authentication'],
        network_configuration: ['timeout_settings', 'retry_configuration'],
        access_controls: ['missing_access_logging']
      }
    };
    
    return autoFixableChecks[resourceType]?.[category]?.includes(checkName) || false;
  }
  
  private async executeAutoFix(
    resourceId: string,
    resourceType: string,
    step: RemediationStep
  ): Promise<AutoFixResult> {
    
    console.log(`Executing auto-fix for ${resourceType} ${resourceId}: ${step.name}`);
    
    switch (resourceType) {
      case 'publisher':
        return this.fixPublisherIssue(resourceId, step);
      case 'private_app':
        return this.fixPrivateAppIssue(resourceId, step);
      case 'policy_group':
        return this.fixPolicyGroupIssue(resourceId, step);
      default:
        throw new Error(`Auto-fix not supported for resource type: ${resourceType}`);
    }
  }
  
  private async fixPublisherIssue(publisherId: string, step: RemediationStep): Promise<AutoFixResult> {
    switch (step.name) {
      case 'weak_cipher_suites':
        const updateResult = await updatePublisher(publisherId, {
          security_config: {
            allowed_cipher_suites: [
              'TLS_AES_256_GCM_SHA384',
              'TLS_CHACHA20_POLY1305_SHA256',
              'TLS_AES_128_GCM_SHA256'
            ]
          }
        });
        
        return {
          fix_applied: 'Updated cipher suites to secure configurations',
          validation_result: await this.quickValidate(publisherId, 'publisher', 'security_settings')
        };
        
      case 'missing_health_checks':
        await updatePublisher(publisherId, {
          monitoring_config: {
            health_check_enabled: true,
            health_check_interval_seconds: 30,
            health_check_timeout_seconds: 10
          }
        });
        
        return {
          fix_applied: 'Enabled health checks with standard configuration',
          validation_result: await this.quickValidate(publisherId, 'publisher', 'monitoring_setup')
        };
        
      default:
        throw new Error(`Unknown publisher fix: ${step.name}`);
    }
  }
  
  private async fixPrivateAppIssue(appId: string, step: RemediationStep): Promise<AutoFixResult> {
    switch (step.name) {
      case 'unencrypted_connection':
        await updatePrivateApp(appId, {
          protocols: [{ type: 'https', port: '443' }], // Force HTTPS
          trust_untrusted_certificate: false
        });
        
        return {
          fix_applied: 'Enforced HTTPS encryption for application',
          validation_result: await this.quickValidate(appId, 'private_app', 'security_settings')
        };
        
      case 'missing_access_logging':
        await updatePrivateApp(appId, {
          logging_config: {
            access_logging_enabled: true,
            log_level: 'INFO',
            log_retention_days: 90
          }
        });
        
        return {
          fix_applied: 'Enabled access logging with 90-day retention',
          validation_result: await this.quickValidate(appId, 'private_app', 'access_controls')
        };
        
      default:
        throw new Error(`Unknown private app fix: ${step.name}`);
    }
  }
  
  private async quickValidate(resourceId: string, resourceType: string, category: string): Promise<any> {
    // Perform targeted validation for the specific category that was fixed
    const result = await validateConfiguration({
      resource_id: resourceId,
      resource_type: resourceType,
      validation_checks: [category]
    });
    
    return result.validation_result;
  }
}

// Usage
const remediationEngine = new ValidationRemediationEngine();

// Auto-remediate validation findings
const publisherValidation = await validateConfiguration({
  resource_id: "pub-us-east-01",
  resource_type: "publisher",
  validation_checks: ["security_settings", "monitoring_setup"]
});

if (publisherValidation.validation_result.overall_status !== 'compliant') {
  const remediation = await remediationEngine.autoRemediate(
    publisherValidation.validation_result,
    true  // Enable auto-fix
  );
  
  console.log(`Auto-fixes applied: ${remediation.auto_fixes_applied}`);
  console.log(`Manual fixes required: ${remediation.manual_fixes_required}`);
  
  if (remediation.improvement_score > 0) {
    console.log(`Compliance score improved by ${remediation.improvement_score} points`);
  }
}
```

### Continuous Validation Monitoring

**Scenario**: Implement ongoing validation monitoring with alerting for compliance drift.

```typescript
class ContinuousValidationMonitor {
  private validationSchedule = new Map<string, ValidationSchedule>();
  private complianceBaselines = new Map<string, ComplianceBaseline>();
  
  async setupContinuousMonitoring(
    resources: Array<{id: string, type: string, name: string}>,
    validationInterval: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<void> {
    
    for (const resource of resources) {
      // Establish baseline
      const baseline = await this.establishBaseline(resource.id, resource.type);
      this.complianceBaselines.set(resource.id, baseline);
      
      // Schedule regular validation
      const scheduleId = setInterval(async () => {
        await this.performScheduledValidation(resource.id, resource.type, resource.name);
      }, validationInterval);
      
      this.validationSchedule.set(resource.id, {
        resource_id: resource.id,
        resource_type: resource.type,
        resource_name: resource.name,
        schedule_id: scheduleId,
        last_validation: new Date(),
        next_validation: new Date(Date.now() + validationInterval)
      });
    }
    
    console.log(`Continuous validation monitoring setup for ${resources.length} resources`);
  }
  
  private async establishBaseline(resourceId: string, resourceType: string): Promise<ComplianceBaseline> {
    const validation = await validateConfiguration({
      resource_id: resourceId,
      resource_type: resourceType,
      validation_checks: [
        'security_settings',
        'network_configuration',
        'access_controls',
        'performance_settings'
      ]
    });
    
    return {
      resource_id: resourceId,
      baseline_timestamp: new Date(),
      baseline_score: validation.validation_result.compliance_score,
      baseline_status: validation.validation_result.overall_status,
      baseline_checks: validation.validation_result.check_results.map(check => ({
        check_name: check.check_name,
        status: check.status,
        score: check.score || 100
      })),
      drift_threshold: 10 // Alert if score drops by 10+ points
    };
  }
  
  private async performScheduledValidation(
    resourceId: string, 
    resourceType: string,
    resourceName: string
  ): Promise<void> {
    
    try {
      console.log(`Performing scheduled validation for ${resourceName}`);
      
      const currentValidation = await validateConfiguration({
        resource_id: resourceId,
        resource_type: resourceType,
        validation_checks: [
          'security_settings',
          'network_configuration',
          'access_controls',
          'performance_settings'
        ]
      });
      
      const baseline = this.complianceBaselines.get(resourceId);
      if (!baseline) {
        console.error(`No baseline found for resource ${resourceId}`);
        return;
      }
      
      // Analyze drift from baseline
      const driftAnalysis = this.analyzeDrift(
        baseline,
        currentValidation.validation_result
      );
      
      if (driftAnalysis.significant_drift) {
        await this.handleComplianceDrift(resourceId, resourceName, driftAnalysis);
      }
      
      // Update schedule
      const schedule = this.validationSchedule.get(resourceId);
      if (schedule) {
        schedule.last_validation = new Date();
        schedule.validation_history = schedule.validation_history || [];
        schedule.validation_history.push({
          timestamp: new Date(),
          compliance_score: currentValidation.validation_result.compliance_score,
          status: currentValidation.validation_result.overall_status,
          drift_score: driftAnalysis.drift_score
        });
        
        // Keep only last 30 validation results
        if (schedule.validation_history.length > 30) {
          schedule.validation_history = schedule.validation_history.slice(-30);
        }
      }
      
    } catch (error) {
      console.error(`Scheduled validation failed for ${resourceName}:`, error.message);
    }
  }
  
  private analyzeDrift(baseline: ComplianceBaseline, current: any): DriftAnalysis {
    const scoreDrift = baseline.baseline_score - current.compliance_score;
    const statusChanged = baseline.baseline_status !== current.overall_status;
    
    // Analyze individual check drift
    const checkDrifts = [];
    for (const baselineCheck of baseline.baseline_checks) {
      const currentCheck = current.check_results.find(c => c.check_name === baselineCheck.check_name);
      
      if (currentCheck) {
        if (baselineCheck.status !== currentCheck.status) {
          checkDrifts.push({
            check_name: baselineCheck.check_name,
            baseline_status: baselineCheck.status,
            current_status: currentCheck.status,
            regression: this.isRegression(baselineCheck.status, currentCheck.status)
          });
        }
      }
    }
    
    const significantDrift = scoreDrift > baseline.drift_threshold || 
                           statusChanged || 
                           checkDrifts.some(d => d.regression);
    
    return {
      drift_score: scoreDrift,
      status_changed: statusChanged,
      check_drifts: checkDrifts,
      significant_drift: significantDrift,
      regression_count: checkDrifts.filter(d => d.regression).length
    };
  }
  
  private isRegression(baselineStatus: string, currentStatus: string): boolean {
    const statusRanking = { pass: 3, warning: 2, fail: 1 };
    return statusRanking[currentStatus] < statusRanking[baselineStatus];
  }
  
  private async handleComplianceDrift(
    resourceId: string, 
    resourceName: string,
    driftAnalysis: DriftAnalysis
  ): Promise<void> {
    
    console.warn(`Compliance drift detected for ${resourceName}:`, {
      score_drift: driftAnalysis.drift_score,
      regressions: driftAnalysis.regression_count,
      status_changed: driftAnalysis.status_changed
    });
    
    // Send alert notification
    await this.sendDriftAlert(resourceId, resourceName, driftAnalysis);
    
    // Auto-remediate if possible
    if (driftAnalysis.regression_count <= 2) { // Only minor regressions
      const remediationEngine = new ValidationRemediationEngine();
      
      try {
        const remediation = await remediationEngine.autoRemediate(
          { resource_id: resourceId, compliance_score: 0 }, // Simplified for example
          true // Enable auto-fix
        );
        
        if (remediation.auto_fixes_applied > 0) {
          console.log(`Auto-remediated ${remediation.auto_fixes_applied} issues for ${resourceName}`);
        }
      } catch (error) {
        console.error(`Auto-remediation failed for ${resourceName}:`, error.message);
      }
    }
  }
  
  private async sendDriftAlert(
    resourceId: string,
    resourceName: string, 
    driftAnalysis: DriftAnalysis
  ): Promise<void> {
    
    // This would integrate with the alert system
    const alertMessage = {
      title: `Compliance Drift Alert: ${resourceName}`,
      severity: driftAnalysis.regression_count > 2 ? 'high' : 'medium',
      message: `Resource ${resourceName} has drifted from compliance baseline`,
      details: {
        score_drift: driftAnalysis.drift_score,
        regression_count: driftAnalysis.regression_count,
        status_changed: driftAnalysis.status_changed,
        check_drifts: driftAnalysis.check_drifts
      },
      recommended_actions: [
        'Review configuration changes',
        'Run validation report',
        'Schedule remediation if needed'
      ]
    };
    
    console.log("ALERT:", alertMessage);
    // await sendAlert(alertMessage);
  }
  
  stopMonitoring(resourceId?: string): void {
    if (resourceId) {
      const schedule = this.validationSchedule.get(resourceId);
      if (schedule) {
        clearInterval(schedule.schedule_id);
        this.validationSchedule.delete(resourceId);
        console.log(`Stopped monitoring for resource ${resourceId}`);
      }
    } else {
      // Stop all monitoring
      for (const [id, schedule] of this.validationSchedule.entries()) {
        clearInterval(schedule.schedule_id);
      }
      this.validationSchedule.clear();
      console.log("Stopped all continuous validation monitoring");
    }
  }
}

// Usage
const monitor = new ContinuousValidationMonitor();

// Set up monitoring for critical resources
const criticalResources = [
  { id: "pub-production-1", type: "publisher", name: "Production Publisher 1" },
  { id: "app-crm-prod", type: "private_app", name: "CRM Production" },
  { id: "pg-admin-access", type: "policy_group", name: "Admin Access Policy" }
];

await monitor.setupContinuousMonitoring(
  criticalResources,
  2 * 60 * 60 * 1000 // Check every 2 hours
);

// Monitor runs automatically in background
// Stop monitoring when needed: monitor.stopMonitoring();
```

## Best Practices

### Validation Strategy

1. **Layered Validation**: Implement multiple validation layers (syntactic, semantic, security)
2. **Regular Audits**: Schedule periodic comprehensive validation audits
3. **Drift Detection**: Monitor for configuration drift from established baselines
4. **Auto-Remediation**: Implement safe auto-remediation for common issues
5. **Compliance Integration**: Align validation rules with regulatory requirements

### Performance Optimization

1. **Targeted Validation**: Only validate relevant checks based on resource changes
2. **Batch Processing**: Group validation operations for efficiency
3. **Caching**: Cache validation results for frequently checked resources
4. **Incremental Validation**: Focus on changes since last validation
5. **Parallel Execution**: Run independent validations concurrently

### Error Resilience

1. **Graceful Degradation**: Continue validation even if some checks fail
2. **Rollback Capability**: Provide rollback for failed auto-remediation
3. **Validation History**: Maintain audit trail of all validation activities
4. **Alert Integration**: Integrate with monitoring and alerting systems
5. **Manual Override**: Allow manual override for business exceptions

---

Validation tools provide essential quality assurance and compliance capabilities that ensure Netskope NPA infrastructure maintains high standards of security, performance, and operational excellence.
