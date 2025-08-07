import * as z from 'zod';

// Policy Condition Types
export const policyConditionTypeSchema = z.enum([
  'private_app',         // Private application conditions
  'user',               // User identity conditions
  'group',              // User group membership conditions
  'organization_unit',   // Organizational unit conditions
  'location',           // Geographic location conditions
  'device'              // Device-based conditions
] as const).describe('Types of conditions that can be used in policy rules');

export const policyOperatorSchema = z.enum([
  'in',                 // Value is in a set
  'not_in',            // Value is not in a set
  'equals',            // Exact value match
  'not_equals',        // Value does not match
  'contains',          // Value contains substring
  'not_contains',      // Value does not contain substring
  'starts_with',       // Value starts with prefix
  'ends_with'          // Value ends with suffix
] as const).describe('Operators available for policy conditions');

export const policyConditionValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.array(z.number())
]);

export const policyConditionSchema = z.object({
  type: policyConditionTypeSchema.describe('Type of condition to evaluate'),
  operator: policyOperatorSchema.describe('Comparison operator to use'),
  value: policyConditionValueSchema.describe('Value or values to compare against')
}).describe('A single condition in a policy rule');

// Request Schema for Policy Rules (matching actual API format)
export const npaPolicyRequestSchema = z.object({
  rule_name: z.string().describe('Name of the policy rule'),
  description: z.string().optional().describe('Optional rule description'),
  enabled: z.enum(['0', '1']).describe('Whether the rule is enabled (1) or disabled (0)'),
  group_id: z.string().describe('ID of the policy group this rule belongs to'),
  group_name: z.string().optional().describe('Name of the policy group'),
  rule_data: z.object({
    access_method: z.array(z.enum(['Client', 'Clientless'])).optional().describe('Access methods allowed'),
    policy_type: z.literal('private-app').describe('Type of policy'),
    match_criteria_action: z.object({
      action_name: z.enum(['allow', 'block']).describe('Action to take when criteria match')
    }).describe('Action configuration'),
    privateApps: z.array(z.string()).optional().describe('List of private application names/IDs'),
    userGroups: z.array(z.string()).optional().describe('List of user groups'),
    users: z.array(z.string()).optional().describe('List of individual users'),
    organization_units: z.array(z.string()).optional().describe('List of organization units'),
    net_location_obj: z.array(z.string()).optional().describe('Network locations'),
    b_negateNetLocation: z.boolean().optional().describe('Negate network location match'),
    srcCountries: z.array(z.string()).optional().describe('Source countries'),
    b_negateSrcCountries: z.boolean().optional().describe('Negate source countries match'),
    device_classification_id: z.array(z.number()).optional().describe('Device classification IDs'),
    privateAppTags: z.array(z.string()).optional().describe('Private app tags'),
    privateAppTagIds: z.array(z.string()).optional().describe('Private app tag IDs'),
    userType: z.enum(['user', 'service']).optional().describe('Type of user'),
    json_version: z.number().default(3).describe('JSON version for the rule data'),
    version: z.number().default(1).describe('Rule version')
  }).describe('Rule data configuration'),
  rule_order: z.object({
    order: z.enum(['top', 'bottom', 'before', 'after']).describe('Rule order position'),
    position: z.number().optional().describe('Position number'),
    rule_id: z.number().optional().describe('Reference rule ID'),
    rule_name: z.string().optional().describe('Reference rule name')
  }).optional().describe('Rule ordering configuration')
}).describe('Request to create a new policy rule');

export const npaPolicyGroupRequestSchema = z.object({
  group_name: z.string().describe('Name of the policy group'),
  group_order: z.object({
    group_order: z.object({
      group_id: z.string().describe('ID of the reference group'),
      order: z.enum(['before', 'after']).describe('Position relative to reference group')
    }).describe('Group order specification')
  }).optional().describe('Optional group ordering configuration'),
  modify_by: z.string().optional().describe('User who modified the group'),
  modify_type: z.string().optional().describe('Type of modification')
}).describe('Request to create or update a policy group');

// Response Item Schemas
export const npaPolicyResponseItemSchema = z.object({
  id: z.number().describe('Unique identifier for the policy rule'),
  name: z.string().describe('Name of the policy rule'),
  description: z.string().optional().describe('Optional rule description'),
  enabled: z.boolean().describe('Whether the rule is currently active'),
  action: z.enum(['allow', 'block']).describe('Action taken when rule matches'),
  policy_group_id: z.number().describe('ID of the containing policy group'),
  priority: z.number().describe('Rule evaluation priority'),
  conditions: z.array(policyConditionSchema).describe('Rule conditions'),
  created_at: z.string().describe('Timestamp when rule was created'),
  updated_at: z.string().describe('Timestamp when rule was last updated')
}).describe('Details of a policy rule');

export const npaPolicyGroupResponseItemSchema = z.object({
  id: z.number().describe('Unique identifier for the policy group'),
  group_name: z.string().describe('Name of the policy group'),
  group_order: z.number().optional().describe('Display order of the group'),
  modify_by: z.string().optional().describe('User who last modified the group'),
  modify_type: z.string().optional().describe('Type of last modification'),
  created_at: z.string().optional().describe('Timestamp when group was created'),
  updated_at: z.string().optional().describe('Timestamp when group was last updated')
}).describe('Details of a policy group');

// Response Schemas
export const npaPolicyResponseSchema = z.object({
  data: z.object({
    rules: z.array(npaPolicyResponseItemSchema).describe('Array of policy rules')
  }),
  status: z.enum(['success', 'error']).describe('Response status'),
  total: z.number().describe('Total number of rules')
}).describe('Response when retrieving policy rules');

export const npaPolicyGroupResponseSchema = z.object({
  data: z.object({
    groups: z.array(npaPolicyGroupResponseItemSchema).describe('Array of policy groups')
  }),
  status: z.enum(['success', 'error']).describe('Response status'),
  total: z.number().describe('Total number of groups')
}).describe('Response when retrieving policy groups');

export const npaPolicyResponse400Schema = z.object({
  message: z.string().describe('Error message'),
  status: z.literal(400).describe('HTTP status code')
}).describe('Error response for policy operations');

// Type Exports
export type PolicyConditionType = z.infer<typeof policyConditionTypeSchema>;
export type PolicyOperator = z.infer<typeof policyOperatorSchema>;
export type PolicyConditionValue = z.infer<typeof policyConditionValueSchema>;
export type PolicyCondition = z.infer<typeof policyConditionSchema>;
export type NPAPolicyRequest = z.infer<typeof npaPolicyRequestSchema>;
export type NPAPolicyGroupRequest = z.infer<typeof npaPolicyGroupRequestSchema>;
export type NPAPolicyResponseItem = z.infer<typeof npaPolicyResponseItemSchema>;
export type NPAPolicyGroupResponseItem = z.infer<typeof npaPolicyGroupResponseItemSchema>;
export type NPAPolicyResponse = z.infer<typeof npaPolicyResponseSchema>;
export type NPAPolicyGroupResponse = z.infer<typeof npaPolicyGroupResponseSchema>;
export type NPAPolicyResponse400 = z.infer<typeof npaPolicyResponse400Schema>;
