import { z } from 'zod';
import { PrivateAppsTools } from '../../tools/private-apps.js';
import { api } from '../../config/netskope-config.js';
import {
  privateAppRequestSchema,
  privateAppUpdateRequestSchema,
  smartDeleteOptionsSchema,
  policyDependencyAnalysisSchema,
  deletionValidationResultSchema,
  smartDeleteResultSchema,
  privateAppIdSchema as privateAppIdSchemaImport,
  discoverySettingsRequestSchema,
  patchTagsRequestSchema,
  Protocol,
  TagNoId,
  SmartDeleteOptions,
  PolicyDependencyAnalysis,
  DeletionValidationResult,
  SmartDeleteResult
} from '../../types/schemas/private-apps.schemas.js';
import { PolicyTools } from '../../tools/policy.js';
import { listPolicyRules, updatePolicyRule, deletePolicyRule, getPolicyRule } from '../policy/index.js';

// Command schemas with descriptions
const createPrivateAppSchema = privateAppRequestSchema;
const updatePrivateAppSchema = privateAppUpdateRequestSchema;
const privateAppIdSchema = privateAppIdSchemaImport;
const listPrivateAppsSchema = z.object({
  limit: z.number().optional().describe('Maximum number of apps to return'),
  offset: z.number().optional().describe('Number of apps to skip'),
  filter: z.string().optional().describe('Filter expression'),
  query: z.string().optional().describe('Raw query string with complex syntax'),
  // Add specific field searches
  app_name: z.string().optional().describe('Filter by application name'),
  publisher_name: z.string().optional().describe('Filter by publisher name'),
  reachable: z.boolean().optional().describe('Filter by reachability status'),
  clientless_access: z.boolean().optional().describe('Filter by clientless access'),
  use_publisher_dns: z.boolean().optional().describe('Filter by DNS usage'),
  host: z.string().optional().describe('Filter by host address'),
  in_steering: z.boolean().optional().describe('Filter by steering status'),
  in_policy: z.boolean().optional().describe('Filter by policy status'),
  private_app_protocol: z.string().optional().describe('Filter by protocol')
}).describe('Options for listing private apps');

const listTagsSchema = z.object({
  query: z.string().optional().describe('Search query for tags'),
  limit: z.number().optional().describe('Maximum number of tags to return'),
  offset: z.number().optional().describe('Number of tags to skip')
}).describe('Options for listing private app tags');

const createTagsSchema = z.object({
  id: z.string().describe('Private app ID'),
  tags: z.array(z.object({
    tag_name: z.string().describe('Name of the tag')
  })).describe('Array of tags to create')
}).describe('Create tags for a private app');

const updateTagsSchema = z.object({
  ids: z.array(z.string()).describe('Array of private app IDs'),
  tags: z.array(z.object({
    tag_name: z.string().describe('Name of the tag')
  })).describe('Array of tags to update')
}).describe('Update tags for multiple private apps');

const updatePublishersSchema = z.object({
  private_app_names: z.array(z.string()).describe('Array of private app names'),
  publisher_ids: z.array(z.string()).describe('Array of publisher IDs')
}).describe('Update publisher associations');

const getPolicyInUseSchema = z.object({
  ids: z.array(z.string()).describe('Array of private app IDs')
}).describe('Get policy in use for private apps');

const getTagPolicyInUseSchema = z.object({
  tag_ids: z.array(z.string()).describe('Array of private app tag IDs')
}).describe('Get policy in use for private app tags');

const getTagPolicyInUseByTagNameSchema = z.object({
  tag_names: z.array(z.string()).describe('Array of private app tag names')
}).describe('Get policy in use for private app tags by name');

// Command implementations
export async function createPrivateApp(
  name: string,
  host: string,
  protocol: Protocol,
  port: string | number,
  appType?: 'clientless' | 'client'
) {
  try {
    // Determine app type based on protocol if not explicitly provided
    const isClientless = appType === 'clientless' || 
                         (appType === undefined && ['http', 'https', 'rdp', 'ssh'].includes(protocol.type));
    
    const params = createPrivateAppSchema.parse({
      app_name: name,
      host,
      app_type: isClientless ? 'clientless' : 'client',
      protocols: [{
        port: typeof port === 'number' ? port.toString() : port,
        type: protocol.type
      }],
      publishers: [],
      clientless_access: isClientless,
      is_user_portal_app: false,
      trust_self_signed_certs: false,
      use_publisher_dns: false
    });

    const result = await PrivateAppsTools.create.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create private app: ${error.message}`);
    }
    throw error;
  }
}

// MCP command handler that returns proper MCP response format
async function updatePrivateAppMcpHandler(params: any) {
  try {
    // The params come from the MCP client and include all the update fields
    const result = await PrivateAppsTools.update.handler(params);
    // Return the MCP response directly since that's what the server expects
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePrivateApp(
  id: string,
  name: string,
  enabled: boolean = true
) {
  try {
    // Get existing app first
    const existingResult = await PrivateAppsTools.get.handler({ id });
    const existingData = JSON.parse(existingResult.content[0].text).data;

    const params = updatePrivateAppSchema.parse({
      ...existingData,
      id: parseInt(id, 10),
      app_name: name
    });

    const result = await PrivateAppsTools.update.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app: ${error.message}`);
    }
    throw error;
  }
}

export async function deletePrivateApp({ id }: { id: string }) {
  try {
    const params = privateAppIdSchema.parse({ id });

    const result = await PrivateAppsTools.delete.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to delete private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete private app: ${error.message}`);
    }
    throw error;
  }
}

export async function getPrivateApp({ id }: { id: string }) {
  try {
    const params = privateAppIdSchema.parse({ id });

    const result = await PrivateAppsTools.get.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get private app: ${error.message}`);
    }
    throw error;
  }
}

// MCP command handler that returns proper MCP response format
async function getPrivateAppMcpHandler({ id }: { id: string }) {
  try {
    const params = privateAppIdSchema.parse({ id });
    const result = await PrivateAppsTools.get.handler(params);
    // Return the MCP response directly since that's what the server expects
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get private app: ${error.message}`);
    }
    throw error;
  }
}

// Helper function for internal use that returns parsed data
async function listPrivateAppsInternal(options: {
  limit?: number;
  offset?: number;
  filter?: string;
  query?: string;
  app_name?: string;
  publisher_name?: string;
  reachable?: boolean;
  clientless_access?: boolean;
  use_publisher_dns?: boolean;
  host?: string;
  in_steering?: boolean;
  in_policy?: boolean;
  private_app_protocol?: string;
} = {}) {
  // Convert old command-style params to tool-style params
  const toolParams = {
    limit: options.limit,
    offset: options.offset,
    query: options.query,
    app_name: options.app_name,
    publisher_name: options.publisher_name,
    reachable: options.reachable,
    clientless_access: options.clientless_access,
    use_publisher_dns: options.use_publisher_dns,
    host: options.host,
    in_steering: options.in_steering,
    in_policy: options.in_policy,
    private_app_protocol: options.private_app_protocol
  };
  
  const result = await PrivateAppsTools.list.handler(toolParams);
  const data = JSON.parse(result.content[0].text);
  
  if (data.status !== 'success') {
    throw new Error(data.message || 'Failed to list private apps');
  }
  
  return data.data.private_apps || data.data;
}

export async function listPrivateApps(options: {
  limit?: number;
  offset?: number;
  filter?: string;
  query?: string;
  app_name?: string;
  publisher_name?: string;
  reachable?: boolean;
  clientless_access?: boolean;
  use_publisher_dns?: boolean;
  host?: string;
  in_steering?: boolean;
  in_policy?: boolean;
  private_app_protocol?: string;
} = {}) {
  try {
    const params = listPrivateAppsSchema.parse(options);
    const result = await PrivateAppsTools.list.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list private apps: ${error.message}`);
    }
    throw error;
  }
}

// MCP command handler for listPrivateAppTags
async function listPrivateAppTagsMcpHandler(options: {
  query?: string;
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const params = listTagsSchema.parse(options);
    const result = await PrivateAppsTools.getTags.handler(params);
    // Return the MCP response directly since that's what the server expects
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list private app tags: ${error.message}`);
    }
    throw error;
  }
}

export async function listPrivateAppTags(options: {
  query?: string;
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const params = listTagsSchema.parse(options);

    const result = await PrivateAppsTools.getTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to list private app tags');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list private app tags: ${error.message}`);
    }
    throw error;
  }
}

// MCP command handler for createPrivateAppTags
async function createPrivateAppTagsMcpHandler(params: any) {
  try {
    const result = await PrivateAppsTools.createTags.handler(params);
    // Return the MCP response directly since that's what the server expects
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create private app tags: ${error.message}`);
    }
    throw error;
  }
}

export async function createPrivateAppTags(appId: string, tagNames: string[]) {
  try {
    const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
    const params = createTagsSchema.parse({
      id: appId,
      tags
    });

    const result = await PrivateAppsTools.createTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create private app tags');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create private app tags: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePrivateAppTags(appIds: string[], tagNames: string[]) {
  try {
    const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
    const params = updateTagsSchema.parse({
      ids: appIds,
      tags
    });

    const result = await PrivateAppsTools.updateTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update private app tags');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app tags: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Add or update tags for private applications using PATCH method
 * 
 * PATCH vs PUT for tags:
 * - PATCH: Adds/updates specified tags while preserving existing tags
 * - PUT: Replaces ALL existing tags with only the provided tags
 * 
 * IMPORTANT: Requires private app IDs (not names). Use listPrivateApps or searchPrivateApps to find IDs.
 * The specified tag names will be created if they don't exist.
 */
export async function patchPrivateAppTags(appIds: string[], tagNames: string[]) {
  try {
    const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
    const params = patchTagsRequestSchema.parse({
      ids: appIds,
      tags
    });

    const result = await PrivateAppsTools.patchTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to patch private app tags');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to patch private app tags: ${error.message}`);
    }
    throw error;
  }
}

// MCP command handler for updatePrivateAppPublishers - using updatePrivateApp approach
async function updatePrivateAppPublishersMcpHandler(params: any) {
  try {
    const { private_app_names, publisher_ids } = params;
    
    if (private_app_names.length !== 1) {
      throw new Error('This operation currently supports updating one app at a time');
    }
    
    const appName = private_app_names[0];
    
    // First, find the app by name to get its ID
    const apps = await listPrivateAppsInternal({ app_name: appName });
    const app = apps.find((a: any) => a.app_name === appName);
    
    if (!app) {
      throw new Error(`Private app '${appName}' not found`);
    }
    
    const appId = app.app_id.toString();
    
    // Get current app configuration
    const currentApp = await PrivateAppsTools.get.handler({ id: appId });
    const currentAppData = JSON.parse(currentApp.content[0].text);
    
    if (currentAppData.status !== 'success') {
      throw new Error('Failed to get current app configuration');
    }
    
    const appConfig = currentAppData.data;
    
    // Create publishers array with both old and new publishers
    const updatedPublishers = publisher_ids.map((publisherId: string) => ({
      publisher_id: publisherId,
      publisher_name: "" // API should accept empty name
    }));
    
    // Create update params - using a minimal PATCH approach based on your working curl
    const updateParams = {
      app_id: parseInt(appId), // Include app_id as required by API
      app_name: appConfig.app_name,
      publishers: updatedPublishers,
      tags: (appConfig.tags || []).map((tag: any) => ({
        tag_name: tag.tag_name
      })),
      trust_self_signed_certs: appConfig.trust_self_signed_certs,
      use_publisher_dns: appConfig.use_publisher_dns
    };
    
    // Call the PATCH endpoint directly using the API client
    const result = await api.requestWithRetry(
      `/api/v2/steering/apps/private/${appId}?silent=0`,
      { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateParams)
      }
    );
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          status: 'success',
          message: `Successfully updated publishers for private app ${appId}`,
          data: result
        }, null, 2)
      }]
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePrivateAppPublishers(appNames: string[], publisherIds: string[]) {
  try {
    const params = updatePublishersSchema.parse({
      private_app_names: appNames,
      publisher_ids: publisherIds
    });

    const result = await PrivateAppsTools.updatePublishers.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update private app publishers');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function removePrivateAppPublishers(appNames: string[], publisherIds: string[]) {
  try {
    const params = updatePublishersSchema.parse({
      private_app_names: appNames,
      publisher_ids: publisherIds
    });

    const result = await PrivateAppsTools.deletePublishers.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to remove private app publishers');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove private app publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function getDiscoverySettings() {
  try {
    const result = await PrivateAppsTools.getDiscoverySettings.handler({});
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get discovery settings');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get discovery settings: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update discovery settings for private applications
 * 
 * This configures automatic application discovery which allows Netskope to:
 * 1. Scan specified host patterns and IP ranges for running applications
 * 2. Use designated publishers as discovery agents
 * 3. Allow specified users/groups to perform discovery operations
 * 
 * Configuration Steps:
 * 1. Find publishers to use for discovery (use listPublishers or searchPublishers)
 * 2. Define host patterns and IP ranges to scan (e.g., "*.internal", "10.0.0.0/8")  
 * 3. Specify users or user groups who can perform discovery
 * 4. Enable/disable the discovery feature
 */
export async function updateDiscoverySettings(params: z.infer<typeof discoverySettingsRequestSchema>) {
  try {
    const result = await PrivateAppsTools.updateDiscoverySettings.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update discovery settings');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update discovery settings: ${error.message}`);
    }
    throw error;
  }
}

export async function getPolicyInUse(ids: string[]) {
  try {
    const params = getPolicyInUseSchema.parse({ ids });

    const result = await PrivateAppsTools.getPolicyInUse.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get policy in use');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get policy in use: ${error.message}`);
    }
    throw error;
  }
}

export async function getTagPolicyInUse(tagIds: string[]) {
  try {
  return await PrivateAppsTools.getTagPolicyInUse.handler({ ids: tagIds });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tag policy in use: ${error.message}`);
    }
    throw error;
  }
}

export async function getTagPolicyInUseByTagName(tagNames: string[]) {
  try {
    // Convert tag names to IDs
    const tagIds = await Promise.all(
      tagNames.map(async (tagName) => {
        const result = await PrivateAppsTools.getTags.handler({ query: tagName });
        const tags = JSON.parse(result.content[0].text);
        const tag = Array.isArray(tags) ? tags.find((t: any) => t.tag_name === tagName) : undefined;
        if (!tag) {
          throw new Error(`Private app tag '${tagName}' not found`);
        }
        return tag.tag_id.toString();
      })
    );
    // Call the regular function with IDs
    return await getTagPolicyInUse(tagIds);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tag policy in use by tag name: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Analyzes policy dependencies for a private application by name
 * Checks both direct app references and tag-based references
 */
export async function analyzePolicyDependencies(appName: string): Promise<PolicyDependencyAnalysis> {
  try {
    // Get all policy rules to analyze dependencies
    const policies = await listPolicyRules();
    
    // Find the app to get its tags
    const apps = await listPrivateAppsInternal();
    const app = apps.find((a: any) => a.app_name === appName);
    
    if (!app) {
      throw new Error(`App with name ${appName} not found`);
    }
    
    const appTags = app.tags || [];
    const affectedPolicies: any[] = [];
    let hasDirectReferences = false;
    let hasTagBasedReferences = false;
    
    // Analyze each policy for references to this app
    for (const policy of policies) {
      if (!policy.rule_data) continue;
      
      const { privateApps = [], privateAppTags = [], privateAppsWithActivities = [] } = policy.rule_data;
      
      // Check for direct app reference in privateApps
      const hasDirectRef = privateApps.includes(appName);
      
      // Check for direct app reference in privateAppsWithActivities
      const hasActivitiesRef = privateAppsWithActivities.some((appWithActivity: any) => 
        appWithActivity.appName === appName
      );
      
      // Check for tag-based reference
      const hasTagRef = privateAppTags.some((policyTag: string) =>
        appTags.some((appTag: any) => appTag.tag_name === policyTag)
      );
      
      if (hasDirectRef || hasActivitiesRef || hasTagRef) {
        let referenceType: 'direct' | 'tag' | 'mixed';
        const hasAnyDirectRef = hasDirectRef || hasActivitiesRef;
        
        if (hasAnyDirectRef && hasTagRef) {
          referenceType = 'mixed';
        } else if (hasAnyDirectRef) {
          referenceType = 'direct';
          hasDirectReferences = true;
        } else {
          referenceType = 'tag';
          hasTagBasedReferences = true;
        }
        
        // Determine if this policy can be safely cleaned up
        const otherApps = privateApps.filter((appname: string) => appname !== appName);
        const otherActivities = privateAppsWithActivities.filter((appWithActivity: any) => 
          appWithActivity.appName !== appName
        );
        const canSafelyRemove = referenceType === 'direct' && 
                               otherApps.length === 0 && 
                               otherActivities.length === 0 && 
                               privateAppTags.length === 0;
        
        affectedPolicies.push({
          policyId: policy.rule_id.toString(),
          policyName: policy.rule_name || `Policy ${policy.rule_id}`,
          referenceType,
          canSafelyRemove,
          requiresManualCleanup: referenceType === 'tag' || referenceType === 'mixed'
        });
      }
    }
    
    return {
      hasDirectReferences,
      hasTagBasedReferences,
      affectedPolicies
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze policy dependencies: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates whether a private app can be safely deleted
 * Performs comprehensive safety checks including policy dependencies
 */
export async function validateDeletionSafety(id: string): Promise<DeletionValidationResult> {
  try {
    // Get app details
    const app = await getPrivateApp({ id });
    
    // Analyze policy dependencies
    const policyAnalysis = await analyzePolicyDependencies(app.app_name);
    
    const warnings: string[] = [];
    const blockers: string[] = [];
    const recommendations: string[] = [];
    
    // Check if app has policy dependencies
    if (policyAnalysis.affectedPolicies.length > 0) {
      if (policyAnalysis.hasDirectReferences) {
        warnings.push(`App is directly referenced in ${policyAnalysis.affectedPolicies.filter(p => p.referenceType === 'direct' || p.referenceType === 'mixed').length} policies`);
      }
      
      if (policyAnalysis.hasTagBasedReferences) {
        warnings.push(`App is referenced through tags in ${policyAnalysis.affectedPolicies.filter(p => p.referenceType === 'tag' || p.referenceType === 'mixed').length} policies`);
      }
      
      // Check for policies that can be safely removed
      const autoCleanupPolicies = policyAnalysis.affectedPolicies.filter(p => p.canSafelyRemove);
      if (autoCleanupPolicies.length > 0) {
        recommendations.push(`${autoCleanupPolicies.length} policies can be automatically cleaned up`);
      }
      
      // Check for policies requiring manual intervention
      const manualPolicies = policyAnalysis.affectedPolicies.filter(p => p.requiresManualCleanup);
      if (manualPolicies.length > 0) {
        recommendations.push(`Review ${manualPolicies.length} policies that require manual cleanup`);
        recommendations.push('Consider using force=true to proceed with deletion');
      }
      
      // Only consider it a blocker if no automatic cleanup is possible
      if (autoCleanupPolicies.length === 0 && policyAnalysis.affectedPolicies.length > 0) {
        blockers.push('App has policy dependencies that cannot be automatically cleaned up');
      }
    }
    
    // Check publisher assignments
    if (app.service_publisher_assignments?.length > 0) {
      warnings.push(`App has ${app.service_publisher_assignments.length} publisher assignments`);
    }
    
    return {
      isValid: blockers.length === 0,
      warnings,
      blockers,
      recommendations
    };
  } catch (error) {
    return {
      isValid: false,
      warnings: [],
      blockers: [`Failed to validate app: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Verify app exists and is accessible']
    };
  }
}

/**
 * Handles cleanup of direct app references in policies
 * Removes the app from policy or deletes entire policy if it becomes empty
 */
async function handleDirectAppReference(policy: any, appName: string): Promise<{ action: string; policyId: string }> {
  const { privateApps = [], privateAppTags = [], privateAppsWithActivities = [] } = policy.rule_data;
  const updatedApps = privateApps.filter((app: string) => app !== appName);
  const updatedActivities = privateAppsWithActivities.filter((appWithActivity: any) => 
    appWithActivity.appName !== appName
  );
  
  // If this was the only app and no tags, delete the entire policy
  if (updatedApps.length === 0 && updatedActivities.length === 0 && privateAppTags.length === 0) {
    await deletePolicyRule(parseInt(policy.rule_id, 10));
    return { action: 'deleted_policy', policyId: policy.rule_id.toString() };
  }
  
  // Otherwise update policy to remove the app from all references
  const updatedRuleData = {
    ...policy.rule_data,
    privateApps: updatedApps,
    privateAppsWithActivities: updatedActivities
  };
  
  await updatePolicyRule(parseInt(policy.rule_id, 10), {
    ...policy,
    rule_data: updatedRuleData
  });
  
  return { action: 'updated_policy', policyId: policy.rule_id.toString() };
}

/**
 * Handles cleanup of tag-based references in policies
 * Only removes tags if no other apps use them
 */
async function handleTagBasedReference(policy: any, appTags: any[]): Promise<{ action: string; policyId: string; requiresManualReview?: boolean }> {
  // For tag-based references, we need to be careful about removing tags
  // as other apps might use the same tags
  
  // Get all apps to check if other apps use these tags
  const allApps = await listPrivateAppsInternal();
  const tagNames = appTags.map(tag => tag.tag_name);
  
  // Check if any other apps use these tags
  const otherAppsWithTags = allApps.filter((app: any) => 
    app.tags?.some((tag: any) => tagNames.includes(tag.tag_name))
  );
  
  // If no other apps use these tags, we can safely remove them from the policy
  if (otherAppsWithTags.length <= 1) { // <= 1 because the current app might still be in the list
    const { privateAppTags = [] } = policy.rule_data;
    const updatedTags = privateAppTags.filter((policyTag: string) =>
      !tagNames.includes(policyTag)
    );
    
    const updatedRuleData = {
      ...policy.rule_data,
      privateAppTags: updatedTags
    };
    
    await updatePolicyRule(parseInt(policy.rule_id, 10), {
      ...policy,
      rule_data: updatedRuleData
    });
    
    return { action: 'updated_policy', policyId: policy.rule_id.toString() };
  }
  
  // Tags are still used by other apps, manual review required
  return { 
    action: 'requires_manual_review', 
    policyId: policy.rule_id.toString(),
    requiresManualReview: true 
  };
}

/**
 * Cleans up policy references for a private app
 * Handles both direct app references and tag-based references
 */
async function cleanupPolicyReferences(appName: string, appTags: any[]): Promise<{ cleanedPolicies: any[]; warnings: string[] }> {
  const policyAnalysis = await analyzePolicyDependencies(appName);
  const cleanedPolicies: any[] = [];
  const warnings: string[] = [];
  
  for (const policyInfo of policyAnalysis.affectedPolicies) {
    try {
      // Get the full policy data
      const policy = await getPolicyRule(parseInt(policyInfo.policyId, 10));
      
      let result;
      
      switch (policyInfo.referenceType) {
        case 'direct':
          result = await handleDirectAppReference(policy, appName);
          break;
        case 'tag':
          result = await handleTagBasedReference(policy, appTags);
          break;
        case 'mixed':
          // Handle direct reference first, then tags
          result = await handleDirectAppReference(policy, appName);
          if (result.action === 'updated_policy') {
            // Also handle tag references if policy still exists
            const tagResult = await handleTagBasedReference(policy, appTags);
            if (tagResult.requiresManualReview) {
              warnings.push(`Policy ${policyInfo.policyName} requires manual review for tag cleanup`);
            }
          }
          break;
      }
      
      cleanedPolicies.push({
        policyId: policyInfo.policyId,
        policyName: policyInfo.policyName,
        action: result.action === 'deleted_policy' ? 'deleted' : 'updated'
      });
      
      if (result.action === 'requires_manual_review') {
        warnings.push(`Policy ${policyInfo.policyName} requires manual review`);
      }
      
    } catch (error) {
      warnings.push(`Failed to cleanup policy ${policyInfo.policyName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { cleanedPolicies, warnings };
}

/**
 * Intelligently deletes a private application with comprehensive policy cleanup
 * Supports dry-run mode, force deletion, and automatic policy cleanup
 */
export async function deletePrivateAppSmart(
  id: string, 
  options: Partial<SmartDeleteOptions> = {}
): Promise<SmartDeleteResult> {
  // Parse and apply defaults using the schema
  const parsedOptions = smartDeleteOptionsSchema.parse(options);
  const { force, cleanupOrphanedPolicies, dryRun } = parsedOptions;
  
  try {
    // Step 1: Get app details and validate
    const app = await getPrivateApp({ id });
    const validation = await validateDeletionSafety(id);
    
    // Step 2: Check if deletion is safe
    if (!validation.isValid && !force) {
      throw new Error(`Cannot delete app safely: ${validation.blockers.join(', ')}. Use force=true to override.`);
    }
    
    // Step 3: Dry run mode - return preview of actions
    if (dryRun) {
      const policyAnalysis = await analyzePolicyDependencies(app.app_name);
      
      return {
        success: true,
        appId: id,
        appName: app.app_name,
        cleanedPolicies: [],
        dryRunPreview: {
          wouldDeleteApp: true,
          wouldCleanupPolicies: policyAnalysis.affectedPolicies.map(p => p.policyName),
          warnings: validation.warnings
        }
      };
    }
    
    // Step 4: Execute policy cleanup if requested
    let cleanedPolicies: any[] = [];
    const allWarnings: string[] = [...validation.warnings];
    
    if (cleanupOrphanedPolicies) {
      const cleanupResult = await cleanupPolicyReferences(app.app_name, app.tags || []);
      cleanedPolicies = cleanupResult.cleanedPolicies;
      allWarnings.push(...cleanupResult.warnings);
    }
    
    // Step 5: Validate that cleanup was successful
    const postCleanupValidation = await analyzePolicyDependencies(app.app_name);
    if (postCleanupValidation.affectedPolicies.length > 0 && !force) {
      const remainingPolicies = postCleanupValidation.affectedPolicies.map(p => p.policyName).join(', ');
      throw new Error(`Failed to clean up all policy references. Remaining policies: ${remainingPolicies}. Use force=true to proceed anyway.`);
    }
    
    // Step 6: Execute the actual app deletion
    await deletePrivateApp({ id });
    
    return {
      success: true,
      appId: id,
      appName: app.app_name,
      cleanedPolicies
    };
    
  } catch (error) {
    throw new Error(`Smart delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export command definitions for MCP server
export const privateAppCommands = {
  createPrivateApp: {
    name: 'createPrivateApp',
    schema: createPrivateAppSchema,
    handler: async (params: any) => {
      const result = await PrivateAppsTools.create.handler(params);
      return result;
    }
  },
  updatePrivateApp: {
    name: 'updatePrivateApp',
    schema: updatePrivateAppSchema,
    handler: updatePrivateAppMcpHandler
  },
  replacePrivateApp: {
    name: 'replacePrivateApp',
    schema: updatePrivateAppSchema,
    handler: async (params: any) => {
      const result = await PrivateAppsTools.replace.handler(params);
      return result;
    }
  },
  deletePrivateApp: {
    name: 'deletePrivateApp',
    schema: privateAppIdSchema,
    handler: deletePrivateApp
  },
  getPrivateApp: {
    name: 'getPrivateApp',
    schema: privateAppIdSchema,
    handler: getPrivateAppMcpHandler
  },
  listPrivateApps: {
    name: 'listPrivateApps',
    schema: PrivateAppsTools.list.schema,
    handler: listPrivateApps
  },
  listPrivateAppTags: {
    name: 'listPrivateAppTags',
    schema: listTagsSchema,
    handler: listPrivateAppTagsMcpHandler
  },
  createPrivateAppTags: {
    name: 'createPrivateAppTags',
    schema: createTagsSchema,
    handler: createPrivateAppTagsMcpHandler
  },
  updatePrivateAppTags: {
    name: 'updatePrivateAppTags',
    schema: updateTagsSchema,
    handler: updatePrivateAppTags
  },
  patchPrivateAppTags: {
    name: 'patchPrivateAppTags',
    schema: patchTagsRequestSchema,
    handler: patchPrivateAppTags
  },
  updatePrivateAppPublishers: {
    name: 'updatePrivateAppPublishers',
    schema: updatePublishersSchema,
    handler: updatePrivateAppPublishersMcpHandler
  },
  removePrivateAppPublishers: {
    name: 'removePrivateAppPublishers',
    schema: updatePublishersSchema,
    handler: removePrivateAppPublishers
  },
  getDiscoverySettings: {
    name: 'getDiscoverySettings',
    schema: z.object({}).describe('Get current private app discovery settings which control automatic application discovery and monitoring'),
    handler: getDiscoverySettings
  },
  updateDiscoverySettings: {
    name: 'updateDiscoverySettings',
    schema: discoverySettingsRequestSchema,
    handler: updateDiscoverySettings
  },
  getPolicyInUse: {
    name: 'getPolicyInUse',
    schema: getPolicyInUseSchema,
    handler: getPolicyInUse
  },
  getTagPolicyInUse: {
    name: 'getTagPolicyInUse',
    schema: getTagPolicyInUseSchema,
    handler: async (params: { tag_ids: string[] }) => getTagPolicyInUse(params.tag_ids)
  },
  getTagPolicyInUseByTagName: {
    name: 'getTagPolicyInUseByTagName',
    schema: getTagPolicyInUseByTagNameSchema,
    handler: async (params: { tag_names: string[] }) => getTagPolicyInUseByTagName(params.tag_names)
  },
  validatePrivateAppDeletion: {
    name: 'validatePrivateAppDeletion',
    schema: privateAppIdSchema,
    handler: async (params: { id: string }) => validateDeletionSafety(params.id)
  },
  analyzePolicyDependencies: {
    name: 'analyzePrivateAppPolicyDependencies',
    schema: z.object({ appName: z.string().describe('Name of the private application') }),
    handler: async (params: { appName: string }) => analyzePolicyDependencies(params.appName)
  },
  deletePrivateAppSmart: {
    name: 'deletePrivateAppSmart',
    schema: z.object({
      id: z.string().describe('Unique identifier of the private application'),
      options: smartDeleteOptionsSchema.optional().describe('Smart deletion options')
    }),
    handler: async (params: { id: string; options?: Partial<SmartDeleteOptions> }) => 
      deletePrivateAppSmart(params.id, params.options)
  }
};
