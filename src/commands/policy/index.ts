import { z } from 'zod';
import { PolicyTools } from '../../tools/policy.js';
import { 
  npaPolicyRequestSchema,
  NPAPolicyRequest
} from '../../types/schemas/policy.schemas.js';
export * from './groups.js';

// Command schemas with descriptions
const createPolicyRuleSchema = npaPolicyRequestSchema;
const updatePolicyRuleSchema = z.object({
  id: z.number().describe('Unique identifier of the policy rule to update'),
  rule_name: z.string().optional().describe('Updated rule name'),
  description: z.string().optional().describe('Updated description'),
  enabled: z.boolean().optional().describe('Enable/disable the rule')
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
export async function createPolicyRule(params: NPAPolicyRequest) {
  try {
    const result = await PolicyTools.createPolicyRule.handler(params);
    return result; // Return the MCP format directly
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create policy rule: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePolicyRule(id: number, updates: any) {
  // TODO: Update this function to work with new schema
  throw new Error('updatePolicyRule temporarily disabled - schema changes in progress');
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
  createPolicyRule: {
    name: 'createPolicyRule',
    schema: createPolicyRuleSchema,
    handler: createPolicyRule // Use our enhanced function with validation
  },
  updatePolicyRule: PolicyTools.updatePolicyRule,
  deletePolicyRule: PolicyTools.deletePolicyRule,
  getPolicyRule: PolicyTools.getPolicyRule,
  listPolicyRules: PolicyTools.listPolicyRules,
  // Policy Group commands
  listPolicyGroups: PolicyTools.listPolicyGroups,
  getPolicyGroup: PolicyTools.getPolicyGroup,
  createPolicyGroup: PolicyTools.createPolicyGroup,
  updatePolicyGroup: PolicyTools.updatePolicyGroup,
  deletePolicyGroup: PolicyTools.deletePolicyGroup
};
