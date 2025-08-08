# Real-World Examples

This document provides complete, practical examples of using the Netskope NPA MCP Server to solve real business challenges through AI-driven automation.

## Example Categories

| Category | Use Case | Complexity | Time Savings |
|----------|----------|------------|--------------|
| **New Office Setup** | Complete infrastructure deployment | High | 4-6 hours → 30 minutes |
| **Application Migration** | Moving apps between environments | Medium | 2-3 hours → 15 minutes |
| **Security Incident Response** | Emergency access control changes | Critical | 1-2 hours → 5 minutes |
| **Compliance Reporting** | Automated audit and remediation | Medium | 3-4 hours → 20 minutes |
| **Team Onboarding** | New team access provisioning | Low | 1-2 hours → 10 minutes |

## Complete Use Cases

### 1. New Regional Office Setup

**Business Scenario**: 
Your company is opening a new office in Tokyo. You need to deploy complete NPA infrastructure, configure applications for local access, and ensure compliance with regional security policies.

**Conversation Flow**:

**User**: "We're opening a new office in Tokyo. Set up complete NPA infrastructure with automatic publisher upgrades, configure access to our core business applications, and ensure it meets our security compliance requirements."

**AI Assistant Response**:

```typescript
// The MCP server executes this comprehensive workflow:

async function deployTokyoOfficeInfrastructure() {
  console.log("🏢 Setting up Tokyo office NPA infrastructure...");
  
  // Phase 1: Infrastructure Foundation
  console.log("📡 Phase 1: Publisher and Broker Setup");
  
  // Validate and create publisher
  await validateName({
    resourceType: 'publisher',
    name: 'tokyo-office-publisher'
  });
  
  const publisher = await create_publisher({
    name: 'tokyo-office-publisher',
    common_name: 'tokyo.company.com',
    location: 'Tokyo, Japan - Shibuya District',
    auto_upgrade: true,
    log_level: 'info'
  });
  
  // Generate registration token for field deployment
  const regToken = await generate_publisher_registration_token({
    publisherId: publisher.data.id
  });
  
  // Create local broker for internal routing
  const broker = await createLocalBroker({
    name: 'tokyo-internal-broker',
    hostname: 'broker.tokyo.internal',
    port: 5671,
    enabled: true
  });
  
  // Configure broker settings
  await updateLocalBrokerConfig({
    hostname: 'tokyo.company.com',
    port: 5671,
    ssl_enabled: true,
    log_level: 'info'
  });
  
  // Phase 2: Upgrade Profile Configuration
  console.log("🔄 Phase 2: Automated Maintenance Setup");
  
  // Create Tokyo-specific upgrade profile (JST timezone consideration)
  const upgradeProfile = await createUpgradeProfile({
    name: 'tokyo-office-upgrades',
    description: 'Automated upgrades for Tokyo office - Sunday 3 AM JST',
    frequency: '0 3 * * 0', // Sundays at 3 AM (JST friendly)
    auto_upgrade: true,
    upgrade_window_hours: 4
  });
  
  // Assign publisher to upgrade profile
  await bulkUpgradePublishers({
    publisher_ids: [publisher.data.id],
    profile_id: upgradeProfile.data.external_id
  });
  
  // Phase 3: Core Business Applications Setup
  console.log("🚀 Phase 3: Business Application Configuration");
  
  // Core applications for Tokyo office
  const coreApps = [
    {
      name: 'crm-tokyo',
      host: 'crm.asia.company.com',
      protocols: [{type: 'https', port: '443'}],
      description: 'CRM system - Asia Pacific region',
      clientless: true
    },
    {
      name: 'erp-tokyo',
      host: 'erp.tokyo.internal',
      protocols: [{type: 'https', port: '8080'}],
      description: 'ERP system - Tokyo operations',
      clientless: true
    },
    {
      name: 'file-server-tokyo',
      host: '10.100.1.50',
      protocols: [
        {type: 'tcp', port: '445'}, // SMB
        {type: 'tcp', port: '22'}   // SFTP
      ],
      description: 'Tokyo office file server',
      clientless: false
    }
  ];
  
  const createdApps = [];
  for (const appConfig of coreApps) {
    // Validate each application name
    await validateName({
      resourceType: 'private_app',
      name: appConfig.name
    });
    
    // Create application
    const app = await createPrivateApp({
      app_name: appConfig.name,
      host: appConfig.host,
      protocols: appConfig.protocols,
      description: appConfig.description,
      clientless_access: appConfig.clientless,
      use_publisher_dns: true,
      publisher_ids: [publisher.data.id]
    });
    
    // Apply organizational tags
    await createPrivateAppTags({
      id: app.data.app_id.toString(),
      tags: [
        {tag_name: 'office', tag_value: 'tokyo'},
        {tag_name: 'region', tag_value: 'asia-pacific'},
        {tag_name: 'environment', tag_value: 'production'},
        {tag_name: 'compliance-zone', tag_value: 'apac'},
        {tag_name: 'deployment-date', tag_value: new Date().toISOString().split('T')[0]}
      ]
    });
    
    createdApps.push({
      name: app.data.app_name,
      id: app.data.app_id,
      type: appConfig.clientless ? 'clientless' : 'client'
    });
  }
  
  // Phase 4: Access Control Setup
  console.log("🔒 Phase 4: Access Policy Configuration");
  
  // Validate Tokyo staff group exists in SCIM
  const tokyoStaffGroup = await searchGroups({displayName: 'Tokyo Office Staff'});
  const tokyoAdminGroup = await searchGroups({displayName: 'Tokyo IT Administrators'});
  
  if (tokyoStaffGroup.data.Resources.length === 0) {
    throw new Error(
      'SCIM group "Tokyo Office Staff" not found. Please create this group in your identity provider first.\n' +
      'This group should contain all Tokyo office employees who need access to local applications.'
    );
  }
  
  // Find or create Tokyo policy group
  const policyGroups = await listPolicyGroups();
  let tokyoPolicyGroup = policyGroups.data.find(g => g.name === 'Tokyo-Office-Access');
  
  if (!tokyoPolicyGroup) {
    const newPolicyGroup = await createPolicyGroup({
      name: 'Tokyo-Office-Access',
      description: 'Access policies for Tokyo office applications and users',
      enabled: true,
      policy_order: 20 // High priority for regional access
    });
    tokyoPolicyGroup = {id: newPolicyGroup.data.id, name: 'Tokyo-Office-Access'};
  }
  
  // Create staff access policy
  const staffPolicy = await createPolicyRule({
    rule_name: 'Tokyo-Staff-Core-Access',
    description: 'Tokyo office staff access to core business applications during business hours',
    policy_group_id: tokyoPolicyGroup.id,
    action: 'allow',
    privateApps: ['crm-tokyo', 'erp-tokyo'], // Business apps only
    userGroups: ['Tokyo Office Staff'],
    conditions: {
      time_restrictions: {
        allowed_hours: {start: '07:00', end: '20:00', timezone: 'Asia/Tokyo'},
        allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      device_conditions: {managed_devices_only: true}
    },
    enabled: true
  });
  
  // Create admin access policy (if admin group exists)
  let adminPolicy = null;
  if (tokyoAdminGroup.data.Resources.length > 0) {
    adminPolicy = await createPolicyRule({
      rule_name: 'Tokyo-Admin-Full-Access',
      description: 'Tokyo IT administrators - full access to all local resources',
      policy_group_id: tokyoPolicyGroup.id,
      action: 'allow',
      privateApps: createdApps.map(app => app.name), // All apps
      userGroups: ['Tokyo IT Administrators'],
      conditions: {
        device_conditions: {managed_devices_only: true},
        risk_conditions: {max_risk_level: 'medium'}
      },
      enabled: true
    });
  }
  
  // Phase 5: Monitoring and Compliance Setup
  console.log("📊 Phase 5: Monitoring Configuration");
  
  // Get admin users for alert configuration
  const adminUsers = await getAdminUsers();
  const tokyoAdminEmails = [
    'tokyo-it@company.com',
    'apac-operations@company.com'
  ];
  
  // Update alert configuration to include Tokyo admins
  const currentAlerts = await getAlertConfig();
  await updateAlertConfig({
    adminUsers: [...currentAlerts.data.adminUsers, ...tokyoAdminEmails],
    eventTypes: [
      'publisher_offline',
      'publisher_upgrade_failed', 
      'private_app_unreachable',
      'authentication_failure_spike'
    ],
    selectedUsers: tokyoAdminEmails
  });
  
  // Configure application discovery for the Tokyo network
  await updateDiscoverySettings({
    enabled: true,
    scan_frequency: 'weekly',
    network_ranges: ['10.100.0.0/16'], // Tokyo office network
    port_ranges: [
      {start_port: 80, end_port: 80, protocol: 'tcp'},
      {start_port: 443, end_port: 443, protocol: 'tcp'},
      {start_port: 8080, end_port: 8090, protocol: 'tcp'},
      {start_port: 3306, end_port: 3306, protocol: 'tcp'},
      {start_port: 1433, end_port: 1433, protocol: 'tcp'}
    ],
    auto_create_apps: false, // Manual review required
    notification_settings: {
      enabled: true,
      admin_emails: tokyoAdminEmails,
      notify_on: 'new'
    }
  });
  
  // Phase 6: Health Verification
  console.log("✅ Phase 6: Deployment Verification");
  
  // Wait for system propagation
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Verify all applications are healthy
  const healthChecks = await Promise.all(
    createdApps.map(async app => {
      const health = await getPrivateApp({id: app.id.toString()});
      return {
        app_name: app.name,
        status: health.data.status,
        reachable: health.data.status === 'reachable'
      };
    })
  );
  
  return {
    deployment_summary: {
      office_location: 'Tokyo, Japan',
      deployment_timestamp: new Date().toISOString(),
      infrastructure: {
        publisher: {
          id: publisher.data.id,
          name: publisher.data.name,
          registration_token: regToken.data.token,
          setup_command: regToken.data.instructions.command
        },
        local_broker: {
          id: broker.data.id,
          name: broker.data.name
        },
        upgrade_profile: {
          id: upgradeProfile.data.external_id,
          schedule: 'Sundays at 3 AM JST'
        }
      },
      applications: {
        total_created: createdApps.length,
        clientless_apps: createdApps.filter(a => a.type === 'clientless').length,
        client_apps: createdApps.filter(a => a.type === 'client').length,
        app_details: createdApps
      },
      access_control: {
        policy_group: tokyoPolicyGroup.name,
        staff_policy: staffPolicy.data.rule_name,
        admin_policy: adminPolicy?.data.rule_name || 'Not created - admin group missing',
        scim_groups_validated: [
          {name: 'Tokyo Office Staff', found: true},
          {name: 'Tokyo IT Administrators', found: tokyoAdminGroup.data.Resources.length > 0}
        ]
      },
      monitoring: {
        discovery_enabled: true,
        alert_recipients: tokyoAdminEmails,
        network_scanning: '10.100.0.0/16'
      },
      health_status: {
        applications_healthy: healthChecks.filter(h => h.reachable).length,
        total_applications: healthChecks.length,
        health_details: healthChecks
      }
    },
    deployment_status: 'COMPLETED',
    next_steps: [
      '1. Deploy publisher using registration token on Tokyo server',
      '2. Configure local DNS to point tokyo.company.com to publisher',
      '3. Test connectivity from Tokyo office devices',
      '4. Verify SCIM group memberships in identity provider',
      '5. Train Tokyo staff on application access procedures',
      '6. Schedule regular health checks and compliance reviews'
    ],
    field_deployment_instructions: {
      registration_token: regToken.data.token,
      publisher_installation_command: regToken.data.instructions.command,
      network_requirements: [
        'Outbound HTTPS (443) access to *.goskope.com',
        'Publisher server accessible on TCP 5671',
        'Internal DNS resolution for *.tokyo.internal domains'
      ]
    }
  };
}
```

**Expected Output**:
```
🏢 Setting up Tokyo office NPA infrastructure...
📡 Phase 1: Publisher and Broker Setup
✅ Publisher 'tokyo-office-publisher' created (ID: 157)
✅ Registration token generated for field deployment
✅ Local broker 'tokyo-internal-broker' configured

🔄 Phase 2: Automated Maintenance Setup  
✅ Upgrade profile 'tokyo-office-upgrades' created
✅ Sunday 3 AM JST maintenance window configured
✅ Publisher assigned to automated upgrades

🚀 Phase 3: Business Application Configuration
✅ Created 'crm-tokyo' - CRM system (clientless)
✅ Created 'erp-tokyo' - ERP system (clientless)  
✅ Created 'file-server-tokyo' - File server (client-based)
✅ Applied organizational tags to all applications

🔒 Phase 4: Access Policy Configuration
✅ Policy group 'Tokyo-Office-Access' created
✅ Staff access policy - business hours, managed devices only
⚠️  Admin policy not created - 'Tokyo IT Administrators' group not found in SCIM

📊 Phase 5: Monitoring Configuration
✅ Alert configuration updated with Tokyo admin emails
✅ Application discovery enabled for 10.100.0.0/16 network
✅ Weekly scanning configured for common business ports

✅ Phase 6: Deployment Verification
✅ All 3 applications created successfully
✅ Health checks completed - 2/3 applications reachable
⚠️  'file-server-tokyo' not yet reachable (expected - server not deployed)

DEPLOYMENT COMPLETED ✅

Next Steps:
1. Deploy publisher using token: eyJ0eXAiOiJKV1QiLCJhbGc...
2. Configure tokyo.company.com DNS pointing to publisher
3. Install and configure file server at 10.100.1.50
4. Create 'Tokyo IT Administrators' group in identity provider
5. Test access from Tokyo office devices
```

### 2. Emergency Security Response

**Business Scenario**: 
A security incident requires immediate lockdown of access to sensitive applications while maintaining business continuity for critical operations.

**User**: "URGENT: We have a security incident. Immediately disable access to all HR and finance applications except for the incident response team. Keep essential business applications accessible but add strict device requirements."

**AI Assistant Response**:

```typescript
async function emergencySecurityResponse() {
  console.log("🚨 EMERGENCY: Initiating security lockdown procedures...");
  
  // Phase 1: Identify Affected Applications
  console.log("🔍 Phase 1: Application Assessment");
  
  // Find HR applications
  const hrApps = await listPrivateApps({
    query: 'hr payroll benefits employee'
  });
  
  // Find finance applications  
  const financeApps = await listPrivateApps({
    query: 'finance accounting invoice payment'
  });
  
  // Find essential business applications
  const essentialApps = await listPrivateApps({
    query: 'crm sales support ticket'
  });
  
  const sensitiveApps = [
    ...hrApps.data.private_apps,
    ...financeApps.data.private_apps
  ].map(app => app.app_name);
  
  const essentialAppNames = essentialApps.data.private_apps.map(app => app.app_name);
  
  // Phase 2: Create Emergency Policy Group
  console.log("🔐 Phase 2: Emergency Access Control");
  
  // Create high-priority emergency policy group
  const emergencyGroup = await createPolicyGroup({
    name: 'EMERGENCY-Security-Lockdown',
    description: 'Emergency access restrictions due to security incident',
    enabled: true,
    policy_order: 1 // Highest priority - overrides other policies
  });
  
  // Phase 3: Validate Incident Response Team
  console.log("👥 Phase 3: Incident Response Team Validation");
  
  const responseTeamGroups = [
    'Security Incident Response Team',
    'IT Security Administrators', 
    'Chief Security Officer'
  ];
  
  const validatedGroups = [];
  for (const groupName of responseTeamGroups) {
    const groupCheck = await searchGroups({displayName: groupName});
    if (groupCheck.data.Resources.length > 0) {
      validatedGroups.push(groupName);
    }
  }
  
  if (validatedGroups.length === 0) {
    console.error("❌ CRITICAL: No incident response groups found in SCIM!");
    throw new Error("Cannot proceed - no authorized incident response teams available");
  }
  
  // Phase 4: Implement Emergency Restrictions
  console.log("🚫 Phase 4: Implementing Access Restrictions");
  
  // DENY all access to sensitive applications (overrides other policies)
  if (sensitiveApps.length > 0) {
    await createPolicyRule({
      rule_name: 'EMERGENCY-Block-Sensitive-Apps',
      description: 'EMERGENCY: Block access to HR/Finance apps during security incident',
      policy_group_id: emergencyGroup.data.id,
      action: 'deny',
      privateApps: sensitiveApps,
      userGroups: ['Everyone'], // Block for all users
      enabled: true
    });
    
    // ALLOW access for incident response team only
    await createPolicyRule({
      rule_name: 'EMERGENCY-Response-Team-Override',
      description: 'EMERGENCY: Incident response team access to sensitive apps',
      policy_group_id: emergencyGroup.data.id,
      action: 'allow',
      privateApps: sensitiveApps,
      userGroups: validatedGroups,
      conditions: {
        device_conditions: {managed_devices_only: true},
        risk_conditions: {max_risk_level: 'low'}
      },
      enabled: true
    });
  }
  
  // Enhanced security for essential apps
  if (essentialAppNames.length > 0) {
    await createPolicyRule({
      rule_name: 'EMERGENCY-Essential-Apps-Restricted',
      description: 'EMERGENCY: Strict device requirements for business-critical apps',
      policy_group_id: emergencyGroup.data.id,
      action: 'allow',
      privateApps: essentialAppNames,
      userGroups: ['All Employees'], // Maintain business continuity
      conditions: {
        device_conditions: {managed_devices_only: true},
        risk_conditions: {max_risk_level: 'low'},
        time_restrictions: {
          allowed_hours: {start: '06:00', end: '22:00', timezone: 'UTC'},
          allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      enabled: true
    });
  }
  
  // Phase 5: Tag Applications for Tracking
  console.log("🏷️ Phase 5: Incident Tracking Tags");
  
  const incidentTimestamp = new Date().toISOString();
  const incidentTags = [
    {tag_name: 'security-incident', tag_value: 'active'},
    {tag_name: 'lockdown-date', tag_value: incidentTimestamp.split('T')[0]},
    {tag_name: 'incident-id', tag_value: `SEC-${Date.now()}`}
  ];
  
  // Tag all affected sensitive applications
  if (sensitiveApps.length > 0) {
    const sensitiveAppIds = hrApps.data.private_apps
      .concat(financeApps.data.private_apps)
      .map(app => app.app_id.toString());
    
    await updatePrivateAppTags({
      ids: sensitiveAppIds,
      tags: [
        ...incidentTags,
        {tag_name: 'access-status', tag_value: 'restricted'}
      ]
    });
  }
  
  // Phase 6: Enhanced Monitoring
  console.log("📊 Phase 6: Emergency Monitoring Setup");
  
  // Get security team emails
  const securityAdmins = await getAdminUsers();
  const securityEmails = securityAdmins.data.Resources
    .filter(user => 
      user.displayName?.toLowerCase().includes('security') ||
      user.emails?.[0]?.value?.includes('security')
    )
    .map(user => user.emails?.[0]?.value)
    .filter(email => email)
    .slice(0, 5); // Limit to prevent spam
  
  // Update alert configuration for incident monitoring
  const currentAlerts = await getAlertConfig();
  await updateAlertConfig({
    adminUsers: [...currentAlerts.data.adminUsers, ...securityEmails],
    eventTypes: [
      'authentication_failure',
      'policy_violation',
      'unusual_access_pattern',
      'high_risk_user_access',
      'unmanaged_device_attempt'
    ],
    selectedUsers: securityEmails
  });
  
  // Phase 7: Generate Incident Report
  console.log("📋 Phase 7: Incident Documentation");
  
  const incidentReport = {
    incident_id: `SEC-${Date.now()}`,
    timestamp: incidentTimestamp,
    response_summary: {
      sensitive_apps_blocked: sensitiveApps.length,
      essential_apps_secured: essentialAppNames.length,
      response_teams_authorized: validatedGroups.length,
      emergency_policies_created: 3
    },
    access_control_changes: {
      policy_group: emergencyGroup.data.name,
      policies_created: [
        'EMERGENCY-Block-Sensitive-Apps',
        'EMERGENCY-Response-Team-Override', 
        'EMERGENCY-Essential-Apps-Restricted'
      ],
      affected_applications: {
        blocked: sensitiveApps,
        restricted: essentialAppNames
      },
      authorized_groups: validatedGroups
    },
    monitoring_enhancements: {
      additional_alerting: securityEmails,
      enhanced_event_types: 5,
      incident_tracking_tags: incidentTags
    }
  };
  
  return {
    emergency_response_status: 'COMPLETED',
    incident_report: incidentReport,
    immediate_actions_taken: [
      `✅ Blocked access to ${sensitiveApps.length} sensitive applications`,
      `✅ Authorized ${validatedGroups.length} incident response groups`,
      `✅ Enhanced security for ${essentialAppNames.length} essential apps`,
      '✅ Applied incident tracking tags',
      '✅ Enhanced monitoring and alerting activated'
    ],
    next_steps: [
      '1. Notify affected users about access restrictions',
      '2. Monitor authentication logs for suspicious activity', 
      '3. Coordinate with incident response team for investigation',
      '4. Plan controlled restoration of access post-incident',
      '5. Document lessons learned and policy improvements'
    ],
    restoration_procedure: 'To restore normal access, disable the EMERGENCY-Security-Lockdown policy group',
    contact_information: {
      incident_response_teams: validatedGroups,
      security_alert_recipients: securityEmails
    }
  };
}
```

**Expected Output**:
```
🚨 EMERGENCY: Initiating security lockdown procedures...

🔍 Phase 1: Application Assessment
✅ Found 8 HR/Finance applications requiring lockdown
✅ Identified 12 essential business applications for restricted access

🔐 Phase 2: Emergency Access Control
✅ Created EMERGENCY-Security-Lockdown policy group (Priority 1)

👥 Phase 3: Incident Response Team Validation
✅ Validated 2 incident response groups:
   - Security Incident Response Team
   - IT Security Administrators
⚠️  'Chief Security Officer' group not found in SCIM

🚫 Phase 4: Implementing Access Restrictions
✅ BLOCKED all user access to sensitive applications
✅ AUTHORIZED incident response teams with strict device requirements
✅ RESTRICTED essential apps to managed devices only

🏷️ Phase 5: Incident Tracking Tags
✅ Applied security incident tags to all affected applications
✅ Incident ID: SEC-1735901234567

📊 Phase 6: Emergency Monitoring Setup
✅ Enhanced alerting for security events
✅ Added 3 security administrators to alert recipients

EMERGENCY LOCKDOWN COMPLETED ✅

IMMEDIATE IMPACT:
- 8 sensitive applications BLOCKED for all users
- 2 incident response teams AUTHORIZED with enhanced security
- 12 essential apps LIMITED to managed devices only
- Enhanced monitoring ACTIVE for all security events

To restore normal access after incident resolution:
Run: updatePolicyGroup({id: emergencyGroupId, enabled: false})
```

### 3. Automated Compliance Audit

**Business Scenario**: 
Monthly compliance review to ensure all applications have proper access controls, tagging, and meet security requirements.

**User**: "Perform a comprehensive compliance audit of our entire NPA environment. Check for applications without policies, untagged resources, outdated publishers, and generate a remediation plan."

**AI Response** (showing the sophisticated audit workflow):

```typescript
async function comprehensiveComplianceAudit() {
  console.log("📊 Starting comprehensive compliance audit...");
  
  const auditResults = {
    audit_timestamp: new Date().toISOString(),
    infrastructure: {},
    applications: {},
    policies: {},
    identity: {},
    compliance_score: 0,
    remediation_plan: []
  };
  
  // Phase 1: Infrastructure Compliance
  console.log("🏗️ Phase 1: Infrastructure Assessment");
  
  const publishers = await list_publishers();
  const releases = await get_releases();
  const latestVersion = releases.data.releases.filter(r => r.stability === 'stable')[0].version;
  
  auditResults.infrastructure = {
    total_publishers: publishers.data.publishers.length,
    connected: publishers.data.publishers.filter(p => p.status === 'connected').length,
    outdated: publishers.data.publishers.filter(p => p.version !== latestVersion).length,
    unregistered: publishers.data.publishers.filter(p => !p.registered).length,
    issues: []
  };
  
  // Check each publisher
  for (const pub of publishers.data.publishers) {
    if (pub.status !== 'connected') {
      auditResults.infrastructure.issues.push({
        type: 'publisher_offline',
        publisher: pub.name,
        severity: 'critical',
        description: `Publisher ${pub.name} is ${pub.status}`
      });
    }
    
    if (pub.version !== latestVersion) {
      auditResults.infrastructure.issues.push({
        type: 'outdated_version',
        publisher: pub.name,
        severity: 'medium',
        current_version: pub.version,
        latest_version: latestVersion
      });
    }
  }
  
  // Phase 2: Application Compliance
  console.log("📱 Phase 2: Application Assessment");
  
  const allApps = await listPrivateApps({limit: 1000});
  auditResults.applications = {
    total_applications: allApps.data.private_apps.length,
    without_policies: 0,
    without_tags: 0,
    unreachable: 0,
    compliance_issues: []
  };
  
  for (const app of allApps.data.private_apps) {
    // Check policy association
    if (!app.in_policy) {
      auditResults.applications.without_policies++;
      auditResults.applications.compliance_issues.push({
        type: 'no_policy',
        app_name: app.app_name,
        severity: 'high',
        description: `Application ${app.app_name} has no access policy`
      });
    }
    
    // Check tagging
    if (!app.tags || app.tags.length === 0) {
      auditResults.applications.without_tags++;
      auditResults.applications.compliance_issues.push({
        type: 'no_tags',
        app_name: app.app_name,
        severity: 'medium',
        description: `Application ${app.app_name} has no organizational tags`
      });
    }
    
    // Check reachability
    if (!app.reachable) {
      auditResults.applications.unreachable++;
      auditResults.applications.compliance_issues.push({
        type: 'unreachable',
        app_name: app.app_name,
        severity: 'critical',
        description: `Application ${app.app_name} is not reachable`
      });
    }
    
    // Check required tags
    const requiredTags = ['environment', 'owner', 'data-classification'];
    for (const requiredTag of requiredTags) {
      if (!app.tags?.some(tag => tag.tag_name === requiredTag)) {
        auditResults.applications.compliance_issues.push({
          type: 'missing_required_tag',
          app_name: app.app_name,
          severity: 'medium',
          missing_tag: requiredTag
        });
      }
    }
  }
  
  // Phase 3: Policy Compliance
  console.log("🛡️ Phase 3: Policy Assessment");
  
  const policyGroups = await listPolicyGroups();
  auditResults.policies = {
    total_groups: policyGroups.data.length,
    disabled_groups: 0,
    orphaned_rules: [],
    scim_issues: []
  };
  
  for (const group of policyGroups.data) {
    if (!group.enabled) {
      auditResults.policies.disabled_groups++;
    }
    
    const groupDetails = await getPolicyGroup({id: group.id});
    
    for (const rule of groupDetails.data.rules) {
      // Check if referenced apps still exist
      if (rule.conditions.private_apps) {
        for (const appName of rule.conditions.private_apps) {
          const appExists = allApps.data.private_apps.some(a => a.app_name === appName);
          if (!appExists) {
            auditResults.policies.orphaned_rules.push({
              policy_group: group.name,
              rule_name: rule.rule_name,
              missing_app: appName,
              severity: 'high'
            });
          }
        }
      }
      
      // Check SCIM group references
      if (rule.conditions.user_groups) {
        for (const groupName of rule.conditions.user_groups) {
          const scimCheck = await searchGroups({displayName: groupName});
          if (scimCheck.data.Resources.length === 0) {
            auditResults.policies.scim_issues.push({
              policy_group: group.name,
              rule_name: rule.rule_name,
              missing_scim_group: groupName,
              severity: 'critical'
            });
          }
        }
      }
    }
  }
  
  // Phase 4: Calculate Compliance Score
  console.log("🎯 Phase 4: Compliance Scoring");
  
  let score = 100;
  
  // Infrastructure deductions
  score -= auditResults.infrastructure.issues.filter(i => i.severity === 'critical').length * 15;
  score -= auditResults.infrastructure.issues.filter(i => i.severity === 'medium').length * 5;
  
  // Application deductions  
  score -= auditResults.applications.compliance_issues.filter(i => i.severity === 'critical').length * 10;
  score -= auditResults.applications.compliance_issues.filter(i => i.severity === 'high').length * 7;
  score -= auditResults.applications.compliance_issues.filter(i => i.severity === 'medium').length * 3;
  
  // Policy deductions
  score -= auditResults.policies.orphaned_rules.length * 8;
  score -= auditResults.policies.scim_issues.length * 12;
  
  auditResults.compliance_score = Math.max(0, score);
  
  // Phase 5: Generate Remediation Plan
  console.log("🔧 Phase 5: Remediation Planning");
  
  // Critical issues first
  const criticalIssues = [
    ...auditResults.infrastructure.issues.filter(i => i.severity === 'critical'),
    ...auditResults.applications.compliance_issues.filter(i => i.severity === 'critical'),
    ...auditResults.policies.scim_issues
  ];
  
  if (criticalIssues.length > 0) {
    auditResults.remediation_plan.push({
      priority: 'CRITICAL - Address Immediately',
      actions: criticalIssues.map(issue => ({
        action: generateRemediationAction(issue),
        issue: issue
      }))
    });
  }
  
  // High priority issues
  const highIssues = [
    ...auditResults.applications.compliance_issues.filter(i => i.severity === 'high'),
    ...auditResults.policies.orphaned_rules
  ];
  
  if (highIssues.length > 0) {
    auditResults.remediation_plan.push({
      priority: 'HIGH - Address This Week',
      actions: highIssues.map(issue => ({
        action: generateRemediationAction(issue),
        issue: issue
      }))
    });
  }
  
  return auditResults;
}

function generateRemediationAction(issue: any): string {
  switch (issue.type) {
    case 'publisher_offline':
      return `Investigate and restore publisher: ${issue.publisher}`;
    case 'outdated_version':
      return `Upgrade publisher ${issue.publisher} from ${issue.current_version} to ${issue.latest_version}`;
    case 'no_policy':
      return `Create access policy for application: ${issue.app_name}`;
    case 'unreachable':
      return `Investigate connectivity issues for: ${issue.app_name}`;
    case 'missing_scim_group':
      return `Create SCIM group '${issue.missing_scim_group}' or update policy`;
    default:
      return `Address ${issue.type} for ${issue.app_name || issue.publisher}`;
  }
}
```

These examples demonstrate how the MCP server transforms complex, multi-step operational tasks into simple conversational requests, providing comprehensive automation with built-in validation, error handling, and detailed reporting.
