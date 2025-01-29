import * as z from 'zod';
import { 
  NPAPolicyRequest,
  NPAPolicyResponse,
  NPAPolicyGroupRequest,
  NPAPolicyGroupResponse,
  npaPolicyRequestSchema,
  npaPolicyGroupRequestSchema,
  NPAPolicyResponse400
} from '../types/schemas/policy.schemas.js';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const PolicyTools = {
  // Policy Group Operations
  listPolicyGroups: {
    name: 'listPolicyGroups',
    schema: z.object({}),
    handler: async (_params?: any) => {
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyGroupResponse>>(
        '/api/v2/policy/npa/groups'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getPolicyGroup: {
    name: 'getPolicyGroup',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params?: { id: number }) => {
      if (!params?.id) {
        throw new Error('ID is required');
      }
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyGroupResponse>>(
        `/api/v2/policy/npa/groups/${params.id}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  createPolicyGroup: {
    name: 'createPolicyGroup',
    schema: npaPolicyGroupRequestSchema,
    handler: async (params?: NPAPolicyGroupRequest) => {
      if (!params) {
        throw new Error('Policy group data is required');
      }
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyGroupResponse>>(
        '/api/v2/policy/npa/groups',
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updatePolicyGroup: {
    name: 'updatePolicyGroup',
    schema: npaPolicyGroupRequestSchema,
    handler: async (params?: NPAPolicyGroupRequest & { id: number }) => {
      if (!params?.id) {
        throw new Error('ID is required');
      }
      const { id, ...data } = params;
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyGroupResponse>>(
        `/api/v2/policy/npa/groups/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  deletePolicyGroup: {
    name: 'deletePolicyGroup',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params?: { id: number }) => {
      if (!params?.id) {
        throw new Error('ID is required');
      }
      const result = await api.requestWithRetry<ApiResponse<void>>(
        `/api/v2/policy/npa/groups/${params.id}`,
        {
          method: 'DELETE'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  // Policy Rule Operations
  listRules: {
    name: 'listRules',
    schema: z.object({
      fields: z.string().optional(),
      filter: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      sortby: z.string().optional(),
      sortorder: z.string().optional()
    }),
    handler: async (params: { 
      fields?: string; 
      filter?: string; 
      limit?: number; 
      offset?: number;
      sortby?: string;
      sortorder?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.fields) queryParams.set('fields', params.fields);
      if (params.filter) queryParams.set('filter', params.filter);
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.offset) queryParams.set('offset', String(params.offset));
      if (params.sortby) queryParams.set('sortby', params.sortby);
      if (params.sortorder) queryParams.set('sortorder', params.sortorder);

      const result = await api.requestWithRetry<ApiResponse<NPAPolicyResponse>>(
        `/api/v2/policy/npa/rules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getRule: {
    name: 'getRule',
    schema: z.object({
      id: z.number(),
      fields: z.string().optional()
    }),
    handler: async (params: { id: number; fields?: string }) => {
      const queryParams = params.fields ? `?fields=${params.fields}` : '';
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyResponse>>(
        `/api/v2/policy/npa/rules/${params.id}${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  createRule: {
    name: 'createRule',
    schema: npaPolicyRequestSchema,
    handler: async (params: NPAPolicyRequest) => {
      const silent = false;
      const queryParams = silent ? '?silent=1' : '';
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyResponse>>(
        `/api/v2/policy/npa/rules${queryParams}`,
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updateRule: {
    name: 'updateRule',
    schema: z.object({
      id: z.number(),
      data: npaPolicyRequestSchema
    }),
    handler: async (params: { id: number; data: NPAPolicyRequest }) => {
      const silent = false;
      const queryParams = silent ? '?silent=1' : '';
      const result = await api.requestWithRetry<ApiResponse<NPAPolicyResponse>>(
        `/api/v2/policy/npa/rules/${params.id}${queryParams}`,
        {
          method: 'PATCH',
          body: JSON.stringify(params.data)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  deleteRule: {
    name: 'deleteRule',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry<ApiResponse<void>>(
        `/api/v2/policy/npa/rules/${params.id}`,
        {
          method: 'DELETE'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
