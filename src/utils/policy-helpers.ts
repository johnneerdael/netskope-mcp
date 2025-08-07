import { z } from 'zod';

// Simplified input schema for easier policy creation
export const simplePolicyRuleSchema = z.object({
  name: z.string().describe('Name of the policy rule'),
  description: z.string().optional().describe('Optional rule description'),
  enabled: z.boolean().default(true).describe('Whether the rule is enabled'),
  action: z.enum(['allow', 'block']).default('allow').describe('Action to take'),
  policy_group_id: z.union([z.string(), z.number()]).describe('ID of the policy group'),
  private_app_names: z.array(z.string()).optional().describe('Names of private applications'),
  private_app_ids: z.array(z.string()).optional().describe('IDs of private applications'),
  user_groups: z.array(z.string()).optional().describe('User groups to include'),
  users: z.array(z.string()).optional().describe('Individual users to include'),
  access_methods: z.array(z.enum(['Client', 'Clientless'])).optional().describe('Access methods'),
  priority: z.enum(['top', 'bottom']).default('bottom').describe('Rule priority position')
}).describe('Simplified policy rule creation parameters');

export type SimplePolicyRule = z.infer<typeof simplePolicyRuleSchema>;

/**
 * Transforms simplified policy rule input to Netskope API format
 */
export function transformToPolicyAPIFormat(input: SimplePolicyRule): any {
  const ruleData: any = {
    policy_type: 'private-app',
    json_version: 3,
    version: 1,
    match_criteria_action: {
      action_name: input.action
    },
    userType: 'user'
  };

  // Add private apps - use privateApps field with display names (not IDs!)
  if (input.private_app_names && input.private_app_names.length > 0) {
    // For simple policies, use privateApps with display names
    ruleData.privateApps = input.private_app_names;
  }
  
  if (input.private_app_ids && input.private_app_ids.length > 0) {
    // If IDs are provided, we still use privateApps but with the display names
    // We should not use IDs in the API - it expects display names
    throw new Error('private_app_ids not supported - use private_app_names with display names instead');
  }

  // Add user groups
  if (input.user_groups && input.user_groups.length > 0) {
    ruleData.userGroups = input.user_groups;
  }

  // Add individual users
  if (input.users && input.users.length > 0) {
    ruleData.users = input.users;
  }

  // Add access methods
  if (input.access_methods && input.access_methods.length > 0) {
    ruleData.access_method = input.access_methods;
  }

  return {
    rule_name: input.name,
    description: input.description,
    enabled: input.enabled ? '1' : '0',
    group_id: input.policy_group_id.toString(),
    rule_data: ruleData,
    rule_order: {
      order: input.priority
    }
  };
}
