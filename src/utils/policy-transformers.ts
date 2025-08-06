import {
  NetskopeRawPolicyRule,
  NetskopeRawPolicyResponse,
  NetskopeNormalizedPolicyRule,
  NetskopeNormalizedPolicyResponse,
  NetskopeNormalizedCondition,
  NetskopeCompatibilityPolicyRule
} from '../types/schemas/policy.schemas.netskope.js';
import { NPAPolicyResponseItem } from '../types/schemas/policy.schemas.js';

// ============================================================================
// TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Extracts normalized conditions from Netskope rule_data
 */
function extractConditionsFromRuleData(ruleData: any): NetskopeNormalizedCondition[] {
  const conditions: NetskopeNormalizedCondition[] = [];

  // Extract private app conditions
  if (ruleData.privateApps && ruleData.privateApps.length > 0) {
    conditions.push({
      type: 'private_app',
      operator: 'in',
      value: ruleData.privateApps
    });
  }

  // Extract private app tag conditions
  if (ruleData.privateAppTags && ruleData.privateAppTags.length > 0) {
    conditions.push({
      type: 'private_app',
      operator: 'in',
      value: ruleData.privateAppTags
    });
  }

  // Extract user conditions
  if (ruleData.users && ruleData.users.length > 0) {
    conditions.push({
      type: 'user',
      operator: 'in',
      value: ruleData.users
    });
  }

  // Extract group conditions
  if (ruleData.userGroups && ruleData.userGroups.length > 0) {
    conditions.push({
      type: 'group',
      operator: 'in',
      value: ruleData.userGroups
    });
  }

  // Extract device conditions
  if (ruleData.device_classification_id && ruleData.device_classification_id.length > 0) {
    conditions.push({
      type: 'device',
      operator: 'in',
      value: ruleData.device_classification_id
    });
  }

  // Extract location conditions
  if (ruleData.net_location_obj && ruleData.net_location_obj.length > 0) {
    conditions.push({
      type: 'location',
      operator: ruleData.b_negateNetLocation ? 'not_in' : 'in',
      value: ruleData.net_location_obj
    });
  }

  return conditions;
}

/**
 * Determines action from rule_data
 */
function extractActionFromRuleData(ruleData: any): 'allow' | 'block' {
  if (ruleData.match_criteria_action?.action_name) {
    return ruleData.match_criteria_action.action_name as 'allow' | 'block';
  }
  
  // Default to allow if no explicit action
  return 'allow';
}

/**
 * Creates a description from rule components
 */
function generateRuleDescription(rawRule: NetskopeRawPolicyRule): string {
  const parts: string[] = [];
  
  // Add access method info
  if (rawRule.rule_data.access_method) {
    parts.push(`Access: ${rawRule.rule_data.access_method.join(', ')}`);
  }
  
  // Add app info
  if (rawRule.rule_data.privateApps && rawRule.rule_data.privateApps.length > 0) {
    parts.push(`Apps: ${rawRule.rule_data.privateApps.join(', ')}`);
  }
  
  // Add user info
  if (rawRule.rule_data.users && rawRule.rule_data.users.length > 0) {
    parts.push(`Users: ${rawRule.rule_data.users.length} users`);
  }
  
  // Add group info
  if (rawRule.rule_data.userGroups && rawRule.rule_data.userGroups.length > 0) {
    parts.push(`Groups: ${rawRule.rule_data.userGroups.join(', ')}`);
  }
  
  // Add DLP info
  if (rawRule.rule_data.dlp_profile && rawRule.rule_data.dlp_profile.length > 0) {
    parts.push(`DLP: ${rawRule.rule_data.dlp_profile.length} profiles`);
  }
  
  return parts.join(' | ');
}

// ============================================================================
// MAIN TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transforms raw Netskope policy rule to normalized format
 */
export function transformRawToNormalized(rawRule: NetskopeRawPolicyRule): NetskopeNormalizedPolicyRule {
  const conditions = extractConditionsFromRuleData(rawRule.rule_data);
  const action = extractActionFromRuleData(rawRule.rule_data);
  const description = generateRuleDescription(rawRule);

  return {
    id: rawRule.rule_id,
    name: rawRule.rule_name,
    enabled: typeof rawRule.enabled === 'string' ? rawRule.enabled === '1' : rawRule.enabled,
    action,
    description,
    conditions,
    created_by: rawRule.modify_by, // Using modify_by as proxy for created_by
    modified_by: rawRule.modify_by,
    modified_time: rawRule.modify_time,
    access_methods: rawRule.rule_data.access_method,
    dlp_profiles: rawRule.rule_data.dlp_profile,
    has_activity_controls: Boolean(rawRule.rule_data.privateAppsWithActivities?.length),
    _raw: rawRule
  };
}

/**
 * Transforms raw Netskope policy response to normalized format
 */
export function transformRawResponseToNormalized(rawResponse: NetskopeRawPolicyResponse): NetskopeNormalizedPolicyResponse {
  const normalizedRules = rawResponse.data.map(transformRawToNormalized);
  
  return {
    data: normalizedRules,
    total: rawResponse.data.length,
    status: 'success'
  };
}

/**
 * Transforms normalized rule to legacy compatible format
 */
export function transformNormalizedToLegacy(normalizedRule: NetskopeNormalizedPolicyRule): NetskopeCompatibilityPolicyRule {
  return {
    id: parseInt(normalizedRule.id, 10) || 0,
    name: normalizedRule.name,
    description: normalizedRule.description,
    enabled: normalizedRule.enabled,
    action: normalizedRule.action,
    policy_group_id: 1, // Default policy group
    priority: 1, // Default priority
    conditions: normalizedRule.conditions,
    created_at: normalizedRule.modified_time, // Using modified_time as proxy
    updated_at: normalizedRule.modified_time
  };
}

/**
 * Transforms normalized rule to original schema format (NPAPolicyResponseItem)
 */
export function transformNormalizedToOriginal(normalizedRule: NetskopeNormalizedPolicyRule): NPAPolicyResponseItem {
  return {
    id: parseInt(normalizedRule.id, 10) || 0,
    name: normalizedRule.name,
    description: normalizedRule.description,
    enabled: normalizedRule.enabled,
    action: normalizedRule.action,
    policy_group_id: 1, // Default policy group
    priority: 1, // Default priority
    conditions: normalizedRule.conditions,
    created_at: normalizedRule.modified_time, // Using modified_time as proxy
    updated_at: normalizedRule.modified_time
  };
}

/**
 * Transforms array of normalized rules to legacy compatible format
 */
export function transformNormalizedArrayToLegacy(normalizedRules: NetskopeNormalizedPolicyRule[]): NetskopeCompatibilityPolicyRule[] {
  return normalizedRules.map(transformNormalizedToLegacy);
}

/**
 * Transforms array of normalized rules to original schema format
 */
export function transformNormalizedArrayToOriginal(normalizedRules: NetskopeNormalizedPolicyRule[]): NPAPolicyResponseItem[] {
  return normalizedRules.map(transformNormalizedToOriginal);
}

// ============================================================================
// REVERSE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transforms MCP input to Netskope API format for creation/updates
 */
export function transformMCPInputToNetskopeAPI(mcpInput: any): any {
  // This would be used for CREATE/UPDATE operations
  // Implementation depends on what MCP format we want to accept
  
  const ruleData: any = {
    access_method: mcpInput.access_methods || ['Client'],
    external_dlp: false,
    json_version: 3,
    policy_type: 'private-app',
    show_dlp_profile_action_table: false,
    userType: 'user',
    version: 1
  };

  // Transform conditions back to Netskope format
  if (mcpInput.conditions) {
    for (const condition of mcpInput.conditions) {
      switch (condition.type) {
        case 'private_app':
          ruleData.privateApps = Array.isArray(condition.value) ? condition.value : [condition.value];
          break;
        case 'user':
          ruleData.users = Array.isArray(condition.value) ? condition.value : [condition.value];
          break;
        case 'group':
          ruleData.userGroups = Array.isArray(condition.value) ? condition.value : [condition.value];
          break;
        case 'device':
          ruleData.device_classification_id = Array.isArray(condition.value) ? condition.value : [condition.value];
          break;
        case 'location':
          ruleData.net_location_obj = Array.isArray(condition.value) ? condition.value : [condition.value];
          ruleData.b_negateNetLocation = condition.operator === 'not_in';
          break;
      }
    }
  }

  // Set action
  if (mcpInput.action) {
    ruleData.match_criteria_action = {
      action_name: mcpInput.action
    };
  }

  return {
    rule_name: mcpInput.name,
    enabled: mcpInput.enabled ? "1" : "0",
    policy_type: 'private-app',
    rule_data: ruleData
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates if a raw response matches expected Netskope format
 */
export function isValidNetskopeResponse(response: any): boolean {
  return (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.data) &&
    response.data.every((rule: any) => 
      rule.rule_id && 
      rule.rule_name && 
      rule.rule_data &&
      typeof rule.enabled === 'string'
    )
  );
}

/**
 * Safely extracts rule count from response
 */
export function extractRuleCount(response: any): number {
  if (!response || !Array.isArray(response.data)) {
    return 0;
  }
  return response.data.length;
}

/**
 * Creates error response in normalized format
 */
export function createErrorResponse(message: string): NetskopeNormalizedPolicyResponse {
  return {
    data: [],
    total: 0,
    status: 'error'
  };
}