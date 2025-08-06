import * as z from 'zod';

// ============================================================================
// NETSKOPE NPA POLICY SCHEMAS - ACTUAL API FORMAT
// ============================================================================

// Utility schemas for common patterns
const stringBooleanSchema = z.union([
  z.literal("1"),
  z.literal("0")
]).transform((val) => val === "1");

const stringNumberSchema = z.string().transform((val) => parseInt(val, 10));

// ============================================================================
// DLP RELATED SCHEMAS
// ============================================================================

export const dlpActionSchema = z.object({
  action_name: z.string().describe('DLP action name (e.g., "block")'),
  template: z.string().optional().describe('Template file for action (e.g., "block_page.html")')
}).describe('Individual DLP action configuration');

export const dlpProfileActionSchema = z.object({
  actions: z.array(dlpActionSchema).describe('Array of actions for this DLP profile'),
  dlp_profile: z.string().describe('Name of the DLP profile')
}).describe('DLP profile with associated actions');

// ============================================================================
// ACTIVITY AND CONSTRAINT SCHEMAS
// ============================================================================

export const activityConstraintSchema = z.object({
  // Add specific constraint fields as needed
}).describe('Activity constraint configuration');

export const privateAppActivitySchema = z.object({
  activity: z.string().describe('Activity type (e.g., "any", "Download", "Upload")'),
  list_of_constraints: z.array(activityConstraintSchema).describe('Constraints for this activity')
}).describe('Private app activity configuration');

export const privateAppWithActivitiesSchema = z.object({
  appId: z.string().nullable().describe('Application ID'),
  appName: z.string().describe('Application name'),
  activities: z.array(privateAppActivitySchema).describe('Activities allowed for this app')
}).describe('Private app with activity-based access control');

// ============================================================================
// USER AND GROUP SCHEMAS
// ============================================================================

export const userGroupObjectSchema = z.object({
  id: z.string().describe('Group ID'),
  name: z.string().describe('Group name'),
  disabled: z.string().optional().describe('Disabled status'),
  _negate: z.string().optional().describe('Negation flag')
}).describe('User group object with metadata');

// ============================================================================
// POLICY ACTION SCHEMAS
// ============================================================================

export const matchCriteriaActionSchema = z.object({
  action_name: z.enum(['allow', 'block']).describe('Action to take when criteria match'),
  template: z.string().optional().describe('Template for block actions')
}).describe('Action configuration for policy rule');

// ============================================================================
// RULE DATA SCHEMA - CORE POLICY LOGIC
// ============================================================================

export const netskopeRuleDataSchema = z.object({
  // Access method configuration
  access_method: z.array(z.enum(['Client', 'Clientless'])).describe('Allowed access methods'),
  
  // DLP configuration
  dlp_actions: z.array(dlpProfileActionSchema).optional().describe('DLP actions configuration'),
  dlp_profile: z.array(z.string()).optional().describe('DLP profile names'),
  external_dlp: z.boolean().describe('Whether external DLP is enabled'),
  show_dlp_profile_action_table: z.boolean().describe('Show DLP profile action table'),
  
  // Schema versioning
  json_version: z.number().describe('JSON schema version'),
  version: z.number().describe('Rule version'),
  
  // Policy type
  policy_type: z.literal('private-app').describe('Policy type'),
  
  // Private apps configuration
  privateApps: z.array(z.string()).describe('Private app names'),
  privateAppsWithActivities: z.array(privateAppWithActivitiesSchema).optional().describe('Private apps with activity controls'),
  privateAppTagIds: z.array(z.string()).optional().describe('Private app tag IDs'),
  privateAppTags: z.array(z.string()).optional().describe('Private app tag names'),
  
  // User configuration
  userType: z.enum(['user']).describe('User type'),
  users: z.array(z.string()).optional().describe('User email addresses'),
  userGroups: z.array(z.string()).optional().describe('User group names'),
  userGroupObjects: z.array(userGroupObjectSchema).optional().describe('User group objects with metadata'),
  
  // Action configuration
  match_criteria_action: matchCriteriaActionSchema.optional().describe('Action when criteria match'),
  
  // Network location (for advanced rules)
  net_location_obj: z.array(z.string()).optional().describe('Network location objects'),
  b_negateNetLocation: z.boolean().optional().describe('Negate network location'),
  
  // Device classification
  device_classification_id: z.array(z.string()).optional().describe('Device classification IDs')
}).describe('Complete rule data configuration');

// ============================================================================
// MAIN POLICY RULE SCHEMA
// ============================================================================

export const netskopeRawPolicyRuleSchema = z.object({
  rule_id: z.string().describe('Unique rule identifier'),
  rule_name: z.string().describe('Rule display name'),
  enabled: stringBooleanSchema.describe('Whether rule is enabled'),
  modify_by: z.string().describe('User who last modified the rule'),
  modify_time: z.string().describe('Last modification timestamp'),
  modify_type: z.enum(['Created', 'Edited', 'Deleted']).describe('Type of last modification'),
  policy_type: z.literal('private-app').describe('Policy type'),
  rule_data: netskopeRuleDataSchema.describe('Complete rule configuration')
}).describe('Raw Netskope policy rule from API');

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const netskopeRawPolicyResponseSchema = z.object({
  data: z.array(netskopeRawPolicyRuleSchema).describe('Array of policy rules')
}).describe('Raw Netskope policy API response');

// ============================================================================
// NORMALIZED SCHEMAS FOR MCP INTERFACE
// ============================================================================

export const netskopeNormalizedConditionSchema = z.object({
  type: z.enum(['private_app', 'user', 'group', 'organization_unit', 'location', 'device']).describe('Condition type'),
  operator: z.enum(['in', 'not_in', 'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with']).describe('Condition operator'),
  value: z.union([
    z.string(),
    z.array(z.string()),
    z.number(),
    z.array(z.number())
  ]).describe('Condition value(s)')
}).describe('Normalized condition for MCP interface');

export const netskopeNormalizedPolicyRuleSchema = z.object({
  id: z.string().describe('Rule ID'),
  name: z.string().describe('Rule name'),
  enabled: z.boolean().describe('Whether rule is enabled'),
  action: z.enum(['allow', 'block']).describe('Rule action'),
  description: z.string().optional().describe('Rule description'),
  
  // Simplified conditions extracted from complex rule_data
  conditions: z.array(netskopeNormalizedConditionSchema).describe('Simplified rule conditions'),
  
  // Metadata
  created_by: z.string().describe('User who created the rule'),
  modified_by: z.string().describe('User who last modified the rule'),
  modified_time: z.string().describe('Last modification time'),
  
  // Advanced features (optional)
  access_methods: z.array(z.string()).optional().describe('Allowed access methods'),
  dlp_profiles: z.array(z.string()).optional().describe('DLP profiles applied'),
  has_activity_controls: z.boolean().describe('Whether rule has activity-based controls'),
  
  // Raw data preservation
  _raw: netskopeRawPolicyRuleSchema.optional().describe('Original raw rule data')
}).describe('Normalized policy rule for MCP interface');

export const netskopeNormalizedPolicyResponseSchema = z.object({
  data: z.array(netskopeNormalizedPolicyRuleSchema).describe('Array of normalized policy rules'),
  total: z.number().describe('Total number of rules'),
  status: z.enum(['success', 'error']).describe('Response status')
}).describe('Normalized policy response for MCP interface');

// ============================================================================
// LEGACY COMPATIBILITY SCHEMAS
// ============================================================================

export const netskopeCompatibilityPolicyRuleSchema = z.object({
  id: z.number().describe('Rule ID as number for compatibility'),
  name: z.string().describe('Rule name'),
  description: z.string().optional().describe('Rule description'),
  enabled: z.boolean().describe('Whether rule is enabled'),
  action: z.enum(['allow', 'block']).describe('Rule action'),
  policy_group_id: z.number().default(1).describe('Policy group ID for compatibility'),
  priority: z.number().default(1).describe('Rule priority for compatibility'),
  conditions: z.array(netskopeNormalizedConditionSchema).describe('Rule conditions'),
  created_at: z.string().describe('Creation timestamp'),
  updated_at: z.string().describe('Last update timestamp')
}).describe('Legacy compatible policy rule schema');

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type NetskopeDlpAction = z.infer<typeof dlpActionSchema>;
export type NetskopeDlpProfileAction = z.infer<typeof dlpProfileActionSchema>;
export type NetskopePrivateAppActivity = z.infer<typeof privateAppActivitySchema>;
export type NetskopePrivateAppWithActivities = z.infer<typeof privateAppWithActivitiesSchema>;
export type NetskopeUserGroupObject = z.infer<typeof userGroupObjectSchema>;
export type NetskopeMatchCriteriaAction = z.infer<typeof matchCriteriaActionSchema>;
export type NetskopeRuleData = z.infer<typeof netskopeRuleDataSchema>;
export type NetskopeRawPolicyRule = z.infer<typeof netskopeRawPolicyRuleSchema>;
export type NetskopeRawPolicyResponse = z.infer<typeof netskopeRawPolicyResponseSchema>;
export type NetskopeNormalizedCondition = z.infer<typeof netskopeNormalizedConditionSchema>;
export type NetskopeNormalizedPolicyRule = z.infer<typeof netskopeNormalizedPolicyRuleSchema>;
export type NetskopeNormalizedPolicyResponse = z.infer<typeof netskopeNormalizedPolicyResponseSchema>;
export type NetskopeCompatibilityPolicyRule = z.infer<typeof netskopeCompatibilityPolicyRuleSchema>;