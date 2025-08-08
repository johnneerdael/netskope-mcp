# Common Workflows

This document outlines the most frequently used automation patterns and workflows in the Netskope NPA MCP Server, showing how multiple tools coordinate to accomplish complex tasks.

## Workflow Categories

| Workflow Type | Complexity | Tools Involved | Typical Duration |
|---------------|------------|----------------|------------------|
| **Infrastructure Setup** | High | Publishers, Local Brokers, Validation | 15-30 minutes |
| **Application Deployment** | Medium | Private Apps, Publishers, Tags, Validation | 5-10 minutes |
| **Access Control** | High | Policies, SCIM, Private Apps, Search | 10-20 minutes |
| **Maintenance & Updates** | Medium | Publishers, Upgrade Profiles, Alerts | 30-60 minutes |
| **Monitoring & Compliance** | Low | Search, Validation, Alerts | 2-5 minutes |

## Infrastructure Setup Workflows

### 1. Complete Site Deployment

**Scenario**: Setting up NPA infrastructure for a new office location.

**Workflow Steps**:
```typescript
async function deployNewSiteInfrastructure(params: {
  siteName: string,
  location: string,
  networkRange: string,
  adminEmails: string[]
}) {
  // Phase 1: Create Publisher
  console.log('Phase 1: Publisher Creation');
  
  // Validate publisher name
  await validateName({
    resourceType: 'publisher',
    name: `${params.siteName}-publisher`
  });
  
  // Create publisher with auto-upgrade
  const publisher = await create_publisher({
    name: `${params.siteName}-publisher`,
    common_name: `${params.siteName}.company.com`,
    location: params.location,
    auto_upgrade: true,
    log_level: 'info'
  });
  
  // Generate registration token
  const token = await generate_publisher_registration_token({
    publisherId: publisher.data.id
  });
  
  // Phase 2: Local Broker Setup
  console.log('Phase 2: Local Broker Configuration');
  
  const broker = await createLocalBroker({
    name: `${params.siteName}-broker`,
    hostname: `broker.${params.siteName}.internal`,
    port: 5671,
    enabled: true
  });
  
  // Configure broker settings
  await updateLocalBrokerConfig({
    hostname: `${params.siteName}.company.com`,
    port: 5671,
    ssl_enabled: true,
    log_level: 'info'
  });
  
  // Phase 3: Upgrade Profile Assignment
  console.log('Phase 3: Upgrade Profile Setup');
  
  // Find or create upgrade profile for this site
  const upgradeProfiles = await listUpgradeProfiles();
  let siteProfile = upgradeProfiles.data.find(p => p.name.includes(params.siteName));
  
  if (!siteProfile) {
    siteProfile = await createUpgradeProfile({
      name: `${params.siteName}-upgrades`,
      description: `Automated upgrades for ${params.location}`,
      frequency: '0 2 * * 0', // Sundays at 2 AM
      auto_upgrade: true,
      upgrade_window_hours: 4
    });
  }
  
  // Assign publisher to upgrade profile
  await bulkUpgradePublishers({
    publisher_ids: [publisher.data.id],
    profile_id: siteProfile.external_id
  });
  
  // Phase 4: Alert Configuration
  console.log('Phase 4: Alert Setup');
  
  // Get current alert config
  const currentAlerts = await getAlertConfig();
  
  // Add site admins to alert recipients
  const updatedAdmins = [
    ...currentAlerts.data.adminUsers,
    ...params.adminEmails
  ];
  
  await updateAlertConfig({
    adminUsers: Array.from(new Set(updatedAdmins)), // Remove duplicates
    eventTypes: ['publisher_offline', 'upgrade_failed', 'certificate_expiry'],
    selectedUsers: params.adminEmails
  });
  
  return {
    site_name: params.siteName,
    publisher: {
      id: publisher.data.id,
      name: publisher.data.name,
      registration_token: token.data.token,
      setup_command: token.data.instructions.command
    },
    local_broker: {
      id: broker.data.id,
      name: broker.data.name,
      status: 'configured'
    },
    upgrade_profile: {
      id: siteProfile.external_id,
      name: siteProfile.name,
      schedule: siteProfile.frequency
    },
    deployment_status: 'ready_for_field_installation',
    next_steps: [
      'Deploy publisher using registration token',
      'Configure local network routing',
      'Test connectivity from client devices',
      'Deploy first private applications'
    ]
  };
}
```

**Real-World Usage**:
```
User: "Set up complete NPA infrastructure for our new London office"
AI: Executes deployNewSiteInfrastructure({
  siteName: 'london-office',
  location: 'London, UK - Canary Wharf',
  networkRange: '10.100.0.0/24',
  adminEmails: ['london-it@company.com', 'network-admin@company.com']
})
```

### 2. Publisher Upgrade Maintenance

**Scenario**: Coordinated upgrade of all publishers in an environment.

**Workflow Steps**:
```typescript
async function performMaintenanceUpgrade(environment: string) {
  // Phase 1: Pre-upgrade Assessment
  console.log('Phase 1: Pre-upgrade Assessment');
  
  // Get all publishers in environment
  const allPublishers = await list_publishers();
  const envPublishers = allPublishers.data.publishers.filter(p => 
    p.tags?.some(tag => tag.tag_name === 'environment' && tag.tag_value === environment)
  );
  
  // Check current versions
  const releases = await get_releases();
  const latestStable = releases.data.releases
    .filter(r => r.stability === 'stable')
    .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())[0];
  
  // Identify publishers needing upgrades
  const upgradeNeeded = envPublishers.filter(p => p.version !== latestStable.version);
  
  if (upgradeNeeded.length === 0) {
    return { status: 'up_to_date', message: 'All publishers are current' };
  }
  
  // Phase 2: Pre-upgrade Health Check
  console.log('Phase 2: Health Assessment');
  
  const healthResults = await Promise.all(
    upgradeNeeded.map(async (publisher) => {
      const details = await get_publisher({id: publisher.id});
      const apps = await get_private_apps({publisherId: publisher.id});
      
      return {
        publisher_id: publisher.id,
        publisher_name: publisher.name,
        current_version: publisher.version,
        status: publisher.status,
        app_count: apps.data.apps.length,
        critical_apps: apps.data.apps.filter(app => 
          app.app_name.includes('prod') || app.app_name.includes('critical')
        ).length,
        ready_for_upgrade: publisher.status === 'connected'
      };
    })
  );
  
  // Phase 3: Application Impact Assessment
  console.log('Phase 3: Impact Analysis');
  
  const impactAnalysis = healthResults.map(publisher => {
    // Check if any critical applications will be affected
    const hasCriticalApps = publisher.critical_apps > 0;
    const recommendedWindow = hasCriticalApps ? 'maintenance_window' : 'immediate';
    
    return {
      ...publisher,
      upgrade_recommendation: recommendedWindow,
      estimated_downtime: hasCriticalApps ? '10-15 minutes' : '5 minutes'
    };
  });
  
  // Phase 4: Execute Upgrades
  console.log('Phase 4: Upgrade Execution');
  
  // Separate immediate vs scheduled upgrades
  const immediateUpgrades = impactAnalysis.filter(p => 
    p.upgrade_recommendation === 'immediate' && p.ready_for_upgrade
  );
  
  const scheduledUpgrades = impactAnalysis.filter(p => 
    p.upgrade_recommendation === 'maintenance_window' && p.ready_for_upgrade
  );
  
  // Execute immediate upgrades
  if (immediateUpgrades.length > 0) {
    await bulk_upgrade_publishers({
      publisher_ids: immediateUpgrades.map(p => p.publisher_id),
      version: latestStable.version,
      schedule: 'immediate'
    });
  }
  
  // Schedule maintenance window upgrades
  if (scheduledUpgrades.length > 0) {
    const maintenanceStart = new Date();
    maintenanceStart.setDate(maintenanceStart.getDate() + 1); // Tomorrow
    maintenanceStart.setHours(2, 0, 0, 0); // 2 AM
    
    await bulk_upgrade_publishers({
      publisher_ids: scheduledUpgrades.map(p => p.publisher_id),
      version: latestStable.version,
      schedule: 'scheduled',
      maintenance_window: {
        start_time: maintenanceStart.toISOString(),
        duration_minutes: 120
      }
    });
  }
  
  return {
    environment,
    target_version: latestStable.version,
    total_publishers: envPublishers.length,
    upgrade_needed: upgradeNeeded.length,
    immediate_upgrades: immediateUpgrades.length,
    scheduled_upgrades: scheduledUpgrades.length,
    upgrade_summary: impactAnalysis,
    next_maintenance_window: scheduledUpgrades.length > 0 ? maintenanceStart.toISOString() : null
  };
}
```

## Application Deployment Workflows

### 3. End-to-End Application Onboarding

**Scenario**: Adding a new application to NPA with complete security and access setup.

**Workflow Steps**:
```typescript
async function onboardNewApplication(params: {
  appName: string,
  appHost: string,
  protocols: Array<{type: string, port: string}>,
  environment: string,
  ownerGroup: string,
  accessGroups: string[],
  publisherLocation: string,
  requiresCompliance: boolean
}) {
  // Phase 1: Validation and Prerequisites
  console.log('Phase 1: Validation');
  
  // Validate application name
  await validateName({
    resourceType: 'private_app',
    name: params.appName
  });
  
  // Find appropriate publisher
  const publishers = await searchPublishers({name: params.publisherLocation});
  if (publishers.data.length === 0) {
    throw new Error(`No publishers found for location: ${params.publisherLocation}`);
  }
  
  // Validate access groups exist in SCIM
  const groupValidation = await Promise.all(
    params.accessGroups.map(async groupName => {
      const groups = await searchGroups({displayName: groupName});
      return { 
        groupName, 
        exists: groups.data.Resources.length > 0,
        scimGroup: groups.data.Resources[0]
      };
    })
  );
  
  const missingGroups = groupValidation.filter(v => !v.exists);
  if (missingGroups.length > 0) {
    const availableGroups = await listGroups({count: 20});
    throw new Error(
      `Groups not found: ${missingGroups.map(g => g.groupName).join(', ')}\n` +
      `Available: ${availableGroups.data.Resources.map(g => g.displayName).slice(0, 10).join(', ')}`
    );
  }
  
  // Phase 2: Application Creation
  console.log('Phase 2: Application Creation');
  
  const app = await createPrivateApp({
    app_name: params.appName,
    host: params.appHost,
    protocols: params.protocols,
    clientless_access: params.protocols.some(p => p.type.startsWith('http')),
    use_publisher_dns: true,
    publisher_ids: publishers.data.map(p => p.id),
    description: `${params.appName} - Environment: ${params.environment}`
  });
  
  // Phase 3: Tagging and Organization
  console.log('Phase 3: Tagging');
  
  const appTags = [
    {tag_name: 'environment', tag_value: params.environment},
    {tag_name: 'owner', tag_value: params.ownerGroup},
    {tag_name: 'onboarded-date', tag_value: new Date().toISOString().split('T')[0]},
    {tag_name: 'compliance-required', tag_value: params.requiresCompliance.toString()}
  ];
  
  await createPrivateAppTags({
    id: app.data.app_id.toString(),
    tags: appTags
  });
  
  // Phase 4: Access Policy Creation
  console.log('Phase 4: Access Policy');
  
  // Find appropriate policy group
  const policyGroups = await listPolicyGroups();
  const envPolicyGroup = policyGroups.data.find(g => 
    g.name.toLowerCase().includes(params.environment.toLowerCase())
  );
  
  if (!envPolicyGroup) {
    throw new Error(`No policy group found for environment: ${params.environment}`);
  }
  
  // Create access policy
  const policy = await createPolicyRule({
    rule_name: `Allow-${params.appName.replace(/[^a-zA-Z0-9]/g, '-')}`,
    description: `Access policy for ${params.appName} - ${params.environment} environment`,
    policy_group_id: envPolicyGroup.id,
    action: 'allow',
    privateApps: [params.appName], // Use display name
    userGroups: params.accessGroups,
    conditions: params.requiresCompliance ? {
      device_conditions: {managed_devices_only: true},
      risk_conditions: {max_risk_level: 'medium'}
    } : undefined,
    enabled: true
  });
  
  // Phase 5: Health Verification
  console.log('Phase 5: Health Check');
  
  // Wait for propagation
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Verify application is reachable
  const healthCheck = await getPrivateApp({id: app.data.app_id.toString()});
  
  // Phase 6: Discovery Configuration (if applicable)
  if (params.environment === 'production' && params.requiresCompliance) {
    console.log('Phase 6: Discovery Configuration');
    
    // Get admin users for notifications
    const adminUsers = await getAdminUsers();
    const adminEmails = adminUsers.data.Resources
      .slice(0, 3) // Limit to first 3 admins
      .map(user => user.emails?.[0]?.value)
      .filter(email => email);
    
    await updateDiscoverySettings({
      enabled: true,
      scan_frequency: 'weekly',
      network_ranges: ['10.0.0.0/8'], // Adjust based on environment
      port_ranges: params.protocols.map(p => ({
        start_port: parseInt(p.port.split('-')[0]),
        end_port: parseInt(p.port.split('-')[1] || p.port),
        protocol: p.type as 'tcp' | 'udp'
      })),
      auto_create_apps: false,
      notification_settings: {
        enabled: true,
        admin_emails: adminEmails,
        notify_on: 'new'
      }
    });
  }
  
  return {
    application: {
      id: app.data.app_id,
      name: app.data.app_name,
      host: params.appHost,
      environment: params.environment,
      health_status: healthCheck.data.status
    },
    access_policy: {
      rule_name: policy.data.rule_name,
      policy_group: envPolicyGroup.name,
      authorized_groups: params.accessGroups
    },
    deployment_summary: {
      publishers_associated: publishers.data.length,
      tags_applied: appTags.length,
      compliance_enabled: params.requiresCompliance,
      discovery_configured: params.environment === 'production'
    },
    onboarding_status: 'completed',
    verification_results: {
      app_reachable: healthCheck.data.status === 'reachable',
      policy_active: true,
      tags_applied: true
    }
  };
}
```

**Usage Example**:
```
User: "Onboard the new HR portal application for production use"
AI: Executes onboardNewApplication({
  appName: 'hr-portal-v2',
  appHost: 'hr.company.com',
  protocols: [{type: 'https', port: '443'}],
  environment: 'production',
  ownerGroup: 'HR Department',
  accessGroups: ['HR Staff', 'Managers'],
  publisherLocation: 'headquarters',
  requiresCompliance: true
})
```

## Access Control Workflows

### 4. Role-Based Access Provisioning

**Scenario**: Setting up comprehensive access control for a new team or project.

**Workflow Steps**:
```typescript
async function provisionTeamAccess(params: {
  teamName: string,
  teamLead: string,
  teamMembers: string[],
  requiredApplications: string[],
  accessLevel: 'read-only' | 'standard' | 'admin',
  environment: 'dev' | 'staging' | 'production'
}) {
  // Phase 1: SCIM Group Management
  console.log('Phase 1: Identity Management');
  
  // Check if team group exists
  const existingGroup = await searchGroups({displayName: params.teamName});
  let teamGroup;
  
  if (existingGroup.data.Resources.length === 0) {
    // Group doesn't exist - this would need to be created in the identity provider
    throw new Error(
      `Team group '${params.teamName}' not found in SCIM directory. ` +
      `Please create the group in your identity provider first.`
    );
  } else {
    teamGroup = existingGroup.data.Resources[0];
  }
  
  // Validate team lead and members exist
  const userValidation = await Promise.all(
    [params.teamLead, ...params.teamMembers].map(async userName => {
      const users = await searchUsers({userName});
      return { 
        userName, 
        exists: users.data.Resources.length > 0,
        user: users.data.Resources[0] 
      };
    })
  );
  
  const missingUsers = userValidation.filter(v => !v.exists);
  if (missingUsers.length > 0) {
    console.warn(`Users not found in SCIM: ${missingUsers.map(u => u.userName).join(', ')}`);
  }
  
  // Phase 2: Application Validation
  console.log('Phase 2: Application Discovery');
  
  const appValidation = await Promise.all(
    params.requiredApplications.map(async appName => {
      // First try exact match
      const exactMatch = await listPrivateApps({app_name: appName});
      if (exactMatch.data.private_apps.length > 0) {
        return { appName, found: exactMatch.data.private_apps[0], method: 'exact' };
      }
      
      // Then try search
      const searchMatch = await searchPrivateApps({name: appName});
      if (searchMatch.data.private_apps.length > 0) {
        return { appName, found: searchMatch.data.private_apps[0], method: 'search' };
      }
      
      return { appName, found: null, method: 'none' };
    })
  );
  
  const foundApps = appValidation.filter(v => v.found).map(v => v.found.app_name);
  const missingApps = appValidation.filter(v => !v.found);
  
  if (missingApps.length > 0) {
    console.warn(`Applications not found: ${missingApps.map(a => a.appName).join(', ')}`);
  }
  
  // Phase 3: Policy Group Selection/Creation
  console.log('Phase 3: Policy Management');
  
  const policyGroups = await listPolicyGroups();
  const teamPolicyGroupName = `${params.teamName}-Access`;
  
  let teamPolicyGroup = policyGroups.data.find(g => g.name === teamPolicyGroupName);
  
  if (!teamPolicyGroup) {
    // Create dedicated policy group for this team
    const newGroup = await createPolicyGroup({
      name: teamPolicyGroupName,
      description: `Access policies for ${params.teamName} team`,
      enabled: true,
      policy_order: 50 // Mid-priority
    });
    teamPolicyGroup = { id: newGroup.data.id, name: teamPolicyGroupName };
  }
  
  // Phase 4: Access Policy Creation
  console.log('Phase 4: Policy Creation');
  
  if (foundApps.length > 0) {
    // Create main access policy
    const mainPolicy = await createPolicyRule({
      rule_name: `${params.teamName}-${params.environment}-Access`,
      description: `${params.accessLevel} access for ${params.teamName} to ${params.environment} applications`,
      policy_group_id: teamPolicyGroup.id,
      action: 'allow',
      privateApps: foundApps, // Use actual app names found
      userGroups: [params.teamName],
      conditions: {
        // Add conditions based on access level and environment
        ...(params.environment === 'production' && {
          device_conditions: { managed_devices_only: true },
          risk_conditions: { max_risk_level: params.accessLevel === 'admin' ? 'medium' : 'low' }
        }),
        ...(params.accessLevel === 'read-only' && {
          time_restrictions: {
            allowed_hours: { start: '08:00', end: '18:00', timezone: 'UTC' },
            allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        })
      },
      enabled: true
    });
    
    // Create separate admin policy if needed
    if (params.accessLevel === 'admin' && params.teamLead) {
      await createPolicyRule({
        rule_name: `${params.teamName}-Admin-Access`,
        description: `Administrative access for ${params.teamName} team lead`,
        policy_group_id: teamPolicyGroup.id,
        action: 'allow',
        privateApps: foundApps,
        users: [params.teamLead], // Individual user access
        conditions: {
          device_conditions: { managed_devices_only: true }
        },
        enabled: true
      });
    }
  }
  
  // Phase 5: Access Verification
  console.log('Phase 5: Verification');
  
  // Verify policies are in place
  const policyGroupDetails = await getPolicyGroup({id: teamPolicyGroup.id});
  const teamPolicies = policyGroupDetails.data.rules.filter(r => 
    r.rule_name.includes(params.teamName)
  );
  
  return {
    team_access_summary: {
      team_name: params.teamName,
      team_group_scim_id: teamGroup.id,
      access_level: params.accessLevel,
      environment: params.environment
    },
    policy_configuration: {
      policy_group: teamPolicyGroup.name,
      policies_created: teamPolicies.length,
      policy_names: teamPolicies.map(p => p.rule_name)
    },
    application_access: {
      requested_apps: params.requiredApplications.length,
      apps_found: foundApps.length,
      apps_granted_access: foundApps,
      apps_not_found: missingApps.map(a => a.appName)
    },
    user_validation: {
      users_validated: userValidation.filter(v => v.exists).length,
      users_not_found: missingUsers.map(u => u.userName)
    },
    provisioning_status: 'completed',
    next_steps: [
      ...(missingApps.length > 0 ? [`Create missing applications: ${missingApps.map(a => a.appName).join(', ')}`] : []),
      ...(missingUsers.length > 0 ? [`Add missing users to identity provider: ${missingUsers.map(u => u.userName).join(', ')}`] : []),
      'Test access from team member accounts',
      'Monitor access logs for compliance'
    ]
  };
}
```

## Monitoring and Compliance Workflows

### 5. Automated Compliance Monitoring

**Scenario**: Regular compliance checks and reporting across the entire NPA environment.

**Workflow Steps**:
```typescript
async function performComplianceAudit() {
  // Phase 1: Infrastructure Health Check
  console.log('Phase 1: Infrastructure Assessment');
  
  const publishers = await list_publishers();
  const infrastructureHealth = {
    total_publishers: publishers.data.publishers.length,
    connected_publishers: publishers.data.publishers.filter(p => p.status === 'connected').length,
    outdated_publishers: 0,
    unregistered_publishers: publishers.data.publishers.filter(p => !p.registered).length
  };
  
  // Check for outdated publishers
  const releases = await get_releases();
  const latestVersion = releases.data.releases.filter(r => r.stability === 'stable')[0].version;
  infrastructureHealth.outdated_publishers = publishers.data.publishers.filter(
    p => p.version !== latestVersion
  ).length;
  
  // Phase 2: Application Compliance
  console.log('Phase 2: Application Assessment');
  
  const allApps = await listPrivateApps({limit: 1000});
  const appCompliance = {
    total_applications: allApps.data.private_apps.length,
    apps_without_policies: 0,
    apps_without_tags: 0,
    unreachable_applications: allApps.data.private_apps.filter(a => a.reachable === false).length,
    untagged_applications: []
  };
  
  // Check policy compliance
  for (const app of allApps.data.private_apps) {
    if (!app.in_policy) {
      appCompliance.apps_without_policies++;
    }
    
    if (!app.tags || app.tags.length === 0) {
      appCompliance.apps_without_tags++;
      appCompliance.untagged_applications.push(app.app_name);
    }
  }
  
  // Phase 3: Access Policy Audit
  console.log('Phase 3: Policy Assessment');
  
  const policyGroups = await listPolicyGroups();
  const policyCompliance = {
    total_policy_groups: policyGroups.data.length,
    disabled_policy_groups: policyGroups.data.filter(g => !g.enabled).length,
    policies_with_missing_apps: [],
    policies_with_missing_groups: []
  };
  
  // Detailed policy validation
  for (const group of policyGroups.data) {
    const groupDetails = await getPolicyGroup({id: group.id});
    
    for (const rule of groupDetails.data.rules) {
      // Check if referenced applications still exist
      if (rule.conditions.private_apps) {
        for (const appName of rule.conditions.private_apps) {
          const appExists = allApps.data.private_apps.some(a => a.app_name === appName);
          if (!appExists) {
            policyCompliance.policies_with_missing_apps.push({
              policy_group: group.name,
              rule_name: rule.rule_name,
              missing_app: appName
            });
          }
        }
      }
      
      // Check if referenced groups exist in SCIM
      if (rule.conditions.user_groups) {
        for (const groupName of rule.conditions.user_groups) {
          const groupCheck = await searchGroups({displayName: groupName});
          if (groupCheck.data.Resources.length === 0) {
            policyCompliance.policies_with_missing_groups.push({
              policy_group: group.name,
              rule_name: rule.rule_name,
              missing_group: groupName
            });
          }
        }
      }
    }
  }
  
  // Phase 4: SCIM Integration Health
  console.log('Phase 4: Identity Integration Assessment');
  
  const scimHealth = {
    admin_users_available: 0,
    group_sync_issues: [],
    user_sync_issues: []
  };
  
  try {
    const adminUsers = await getAdminUsers();
    scimHealth.admin_users_available = adminUsers.data.Resources.length;
  } catch (error) {
    scimHealth.user_sync_issues.push('Failed to retrieve admin users from SCIM');
  }
  
  // Phase 5: Generate Compliance Report
  const complianceScore = calculateComplianceScore({
    infrastructureHealth,
    appCompliance,
    policyCompliance,
    scimHealth
  });
  
  return {
    audit_timestamp: new Date().toISOString(),
    compliance_score: complianceScore,
    infrastructure_health: infrastructureHealth,
    application_compliance: appCompliance,
    policy_compliance: policyCompliance,
    scim_integration: scimHealth,
    recommendations: generateComplianceRecommendations({
      infrastructureHealth,
      appCompliance,
      policyCompliance
    }),
    critical_issues: identifyCriticalIssues({
      infrastructureHealth,
      appCompliance,
      policyCompliance
    })
  };
}

function calculateComplianceScore(data: any): number {
  let score = 100;
  
  // Infrastructure penalties
  const infraPenalty = (data.infrastructureHealth.total_publishers - data.infrastructureHealth.connected_publishers) * 10;
  score -= infraPenalty;
  
  // Application penalties
  const appPenalty = data.appCompliance.apps_without_policies * 5;
  score -= appPenalty;
  
  // Policy penalties
  const policyPenalty = data.policyCompliance.policies_with_missing_apps.length * 15;
  score -= policyPenalty;
  
  return Math.max(0, score);
}
```

## Integration Patterns

### Tool Coordination Examples

**Pattern 1: Search → Validate → Create**
```typescript
// Find publisher → Validate name → Create app → Associate
const publishers = await searchPublishers({name: 'production'});
await validateName({resourceType: 'private_app', name: newAppName});
const app = await createPrivateApp({...params, publisher_ids: [publishers.data[0].id]});
```

**Pattern 2: SCIM Validation → Policy Creation**
```typescript
// Validate groups exist → Create policy with validated groups
const groupCheck = await searchGroups({displayName: 'Developers'});
if (groupCheck.data.Resources.length > 0) {
  await createPolicyRule({...params, userGroups: ['Developers']});
}
```

**Pattern 3: Health Check → Remediation**
```typescript
// Check app health → Tag for maintenance → Alert admins
const app = await getPrivateApp({id: appId});
if (app.data.status === 'unreachable') {
  await patchPrivateAppTags({
    appId,
    tags: [...app.data.tags, {tag_name: 'status', tag_value: 'maintenance-required'}]
  });
}
```

---

These workflows demonstrate how the MCP server's tools coordinate to accomplish complex, real-world tasks through intelligent automation patterns.
