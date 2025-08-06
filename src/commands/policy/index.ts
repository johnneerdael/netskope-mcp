import { z } from 'zod';
import { PolicyTools } from '../../tools/policy.js';
import {
  npaPolicyRequestSchema,
  NPAPolicyRequest,
  NPAPolicyResponseItem
} from '../../types/schemas/policy.schemas.js';
export * from './groups.js';

// Command schemas with descriptions
const createPolicyRuleSchema = npaPolicyRequestSchema;
const updatePolicyRuleSchema = npaPolicyRequestSchema.extend({
  id: z.number().describe('Unique identifier of the policy rule to update')
});
const policyRuleIdSchema = z.object({
  id: z.number().describe('Unique identifier of the policy rule')
});
const listPolicyRulesSchema = z.object({
  limit: z.number().optional().describe('Maximum number of rules to return'),
  offset: z.number().optional().describe('Number of rules to skip'),
  sortby: z.string().optional().describe('Field to sort by'),
  sortorder: z.string().optional().describe('Sort order (asc/desc)')
}).describe('Options for listing policy rules');

// Command implementations
export async function createPolicyRule(
  name: string, 
  groupId: string, 
  action: 'allow' | 'block' = 'allow'
) {
  try {
    const params = createPolicyRuleSchema.parse({
      name,
      policy_group_id: parseInt(groupId, 10),
      action,
      enabled: true,
      priority: 1,
      conditions: []
    });

    const result = await PolicyTools.createPolicyRule.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create policy rule');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create policy rule: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePolicyRule(id: number, updates: Partial<NPAPolicyRequest>) {
  try {
    // Get existing rule first
    const existingResult = await PolicyTools.getPolicyRule.handler({ id });
    const existingData = JSON.parse(existingResult.content[0].text).data;
    
    // Merge existing data with updates
    const params = updatePolicyRuleSchema.parse({
      id,
      ...existingData,
      ...updates,
      // Ensure required fields are present
      conditions: updates.conditions || existingData.conditions || [],
      policy_group_id: updates.policy_group_id || existingData.policy_group_id,
      priority: updates.priority || existingData.priority,
      enabled: updates.enabled ?? existingData.enabled,
      action: updates.action || existingData.action,
      name: updates.name || existingData.name
    });

    const result = await PolicyTools.updatePolicyRule.handler({
      id: params.id,
      data: params
    });
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update policy rule');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update policy rule: ${error.message}`);
    }
    throw error;
  }
}

export async function deletePolicyRule(id: number) {
  try {
    const params = policyRuleIdSchema.parse({ id });

    const result = await PolicyTools.deletePolicyRule.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to delete policy rule');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete policy rule: ${error.message}`);
    }
    throw error;
  }
}

export async function getPolicyRule(id: number) {
  try {
    const params = policyRuleIdSchema.parse({ id });

    const result = await PolicyTools.getPolicyRule.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get policy rule');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get policy rule: ${error.message}`);
    }
    throw error;
  }
}

export async function listPolicyRules(options: {
  limit?: number;
  offset?: number;
  sortby?: string;
  sortorder?: string;
} = {}) {
  try {
    const params = listPolicyRulesSchema.parse(options);

    const result = await PolicyTools.listPolicyRules.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to list policy rules');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list policy rules: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const policyCommands = {
  createPolicyRule: PolicyTools.createPolicyRule,
  updatePolicyRule: PolicyTools.updatePolicyRule,
  deletePolicyRule: PolicyTools.deletePolicyRule,
  getPolicyRule: PolicyTools.getPolicyRule,
  listPolicyRules: PolicyTools.listPolicyRules
};
