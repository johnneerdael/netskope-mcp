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

// Request Schemas
export const npaPolicyRequestSchema = z.object({
  name: z.string().describe('Name of the policy rule'),
  description: z.string().optional().describe('Optional description of the rule\'s purpose'),
  enabled: z.boolean().describe('Whether the rule is active'),
  action: z.enum(['allow', 'block']).describe('Action to take when rule conditions match'),
  policy_group_id: z.number().describe('ID of the policy group this rule belongs to'),
  priority: z.number().describe('Rule evaluation priority (lower numbers evaluated first)'),
  conditions: z.array(policyConditionSchema).describe('Array of conditions that must be met')
}).describe('Request to create a new policy rule');

export const npaPolicyGroupRequestSchema = z.object({
  name: z.string().describe('Name of the policy group'),
  description: z.string().optional().describe('Optional description of the group\'s purpose'),
  rules: z.array(npaPolicyRequestSchema).describe('Array of policy rules in this group')
}).describe('Request to create a new policy group');

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
  name: z.string().describe('Name of the policy group'),
  description: z.string().optional().describe('Optional group description'),
  rules: z.array(npaPolicyResponseItemSchema).describe('Rules in this group'),
  created_at: z.string().describe('Timestamp when group was created'),
  updated_at: z.string().describe('Timestamp when group was last updated')
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
