import { PolicyTools } from '../../tools/policy.js';

export async function createPolicyRule(
  name: string,
  groupId: string,
  enabled: boolean = true
) {
  const result = await PolicyTools.createRule.handler({
    name,
    policy_group_id: parseInt(groupId, 10),
    enabled,
    action: 'allow',
    priority: 1,
    conditions: []
  });
  return result;
}
