import { ResourceCommand } from '../base/resource-command.js';
import { PolicyTools } from '../../tools/policy.js';
import { 
  NPAPolicyGroupRequest,
  NPAPolicyGroupResponse,
  NPAPolicyGroupResponseItem
} from '../../types/schemas/policy.schemas.js';
import { resolveResourceId } from '../../utils/id-resolver.js';

/**
 * Command implementation for policy group operations
 */
export class PolicyGroupCommand extends ResourceCommand<
  NPAPolicyGroupResponseItem,
  NPAPolicyGroupResponse,
  NPAPolicyGroupRequest,
  NPAPolicyGroupRequest & { id: number }
> {
  constructor() {
    super(
      'Policy Group',
      {
        list: PolicyTools.listPolicyGroups,
        get: PolicyTools.getPolicyGroup,
        create: PolicyTools.createPolicyGroup,
        update: PolicyTools.updatePolicyGroup,
        delete: PolicyTools.deletePolicyGroup
      },
      {
        matchField: 'group_name', // Updated to match actual API field
        caseSensitive: false,
        throwOnNotFound: true
      }
    );
  }

  /**
   * Extract list data from response
   */
  protected extractListData(response: NPAPolicyGroupResponse): NPAPolicyGroupResponseItem[] {
    return response.data.groups || [];
  }

  /**
   * Override update to handle the id requirement
   */
  async update(identifier: string | number, data: NPAPolicyGroupRequest): Promise<NPAPolicyGroupResponseItem> {
    const resource = await resolveResourceId(
      this.list.bind(this),
      identifier,
      this.resolutionOptions
    );
    const result = await this.handlers.update?.handler({
      ...data,
      id: resource.id
    });
    if (!result) {
      throw new Error('Update operation not supported');
    }
    const response = this.parseResponse(result);
    return response.data;
  }
}

// Export singleton instance
export const policyGroupCommand = new PolicyGroupCommand();

// Export convenience methods
export async function listPolicyGroups(): Promise<NPAPolicyGroupResponseItem[]> {
  return policyGroupCommand.list();
}

export async function getPolicyGroup(identifier: string | number): Promise<NPAPolicyGroupResponseItem> {
  return policyGroupCommand.get(identifier);
}

export async function createPolicyGroup(data: NPAPolicyGroupRequest): Promise<NPAPolicyGroupResponseItem> {
  return policyGroupCommand.create(data);
}

export async function updatePolicyGroup(
  identifier: string | number,
  data: NPAPolicyGroupRequest
): Promise<NPAPolicyGroupResponseItem> {
  return policyGroupCommand.update(identifier, data);
}

export async function deletePolicyGroup(identifier: string | number): Promise<void> {
  return policyGroupCommand.delete(identifier);
}
