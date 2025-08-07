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
import {
  netskopeRawPolicyResponseSchema,
  netskopeNormalizedPolicyResponseSchema,
  NetskopeRawPolicyResponse,
  NetskopeNormalizedPolicyResponse
} from '../types/schemas/policy.schemas.netskope.js';
import {
  transformRawResponseToNormalized,
  transformNormalizedArrayToOriginal,
  transformMCPInputToNetskopeAPI,
  isValidNetskopeResponse,
  createErrorResponse
} from '../utils/policy-transformers.js';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

// ============================================================================
// ENHANCED POLICY TOOLS WITH NETSKOPE FORMAT SUPPORT
// ============================================================================

export const EnhancedPolicyTools = {
  // ============================================================================
  // POLICY RULE OPERATIONS (ENHANCED)
  // ============================================================================
  
  /**
   * Lists policy rules with proper Netskope format handling
   */
  listRules: {
    name: 'listRules',
    schema: z.object({
      fields: z.string().optional(),
      filter: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      sortby: z.string().optional(),
      sortorder: z.string().optional(),
      format: z.enum(['raw', 'normalized', 'legacy']).optional().default('normalized')
    }),
    handler: async (params: { 
      fields?: string; 
      filter?: string; 
      limit?: number; 
      offset?: number;
      sortby?: string;
      sortorder?: string;
      format?: 'raw' | 'normalized' | 'legacy';
    }) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.fields) queryParams.set('fields', params.fields);
        if (params.filter) queryParams.set('filter', params.filter);
        if (params.limit) queryParams.set('limit', String(params.limit));
        if (params.offset) queryParams.set('offset', String(params.offset));
        if (params.sortby) queryParams.set('sortby', params.sortby);
        if (params.sortorder) queryParams.set('sortorder', params.sortorder);

        // Make API call and expect raw Netskope format
        const rawResponse = await api.requestWithRetry<NetskopeRawPolicyResponse>(
          `/api/v2/policy/npa/rules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        );

        // Validate response format
        if (!isValidNetskopeResponse(rawResponse)) {
          throw new Error('Invalid response format from Netskope API');
        }

        // Validate with schema
        const validatedResponse = netskopeRawPolicyResponseSchema.parse(rawResponse);

        // Transform based on requested format
        let result: any;
        switch (params.format) {
          case 'raw':
            result = validatedResponse;
            break;
          case 'normalized':
            result = transformRawResponseToNormalized(validatedResponse);
            break;
          case 'legacy':
            const normalized = transformRawResponseToNormalized(validatedResponse);
            result = {
              data: {
                rules: transformNormalizedArrayToOriginal(normalized.data)
              },
              status: normalized.status,
              total: normalized.total
            };
            break;
          default:
            result = transformRawResponseToNormalized(validatedResponse);
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        console.error('Error in listRules:', error);
        const errorResponse = createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }] };
      }
    }
  },

  /**
   * Gets a specific policy rule with proper format handling
   */
  getRule: {
    name: 'getRule',
    schema: z.object({
      id: z.union([z.number(), z.string()]).transform(val => String(val)),
      fields: z.string().optional(),
      format: z.enum(['raw', 'normalized', 'legacy']).optional().default('normalized')
    }),
    handler: async (params: { id: string; fields?: string; format?: 'raw' | 'normalized' | 'legacy' }) => {
      try {
        const queryParams = params.fields ? `?fields=${params.fields}` : '';
        
        // Make API call - note: single rule may return different format
        const rawResponse = await api.requestWithRetry<any>(
          `/api/v2/policy/npa/rules/${params.id}${queryParams}`
        );

        // Handle single rule response (may be wrapped differently)
        let normalizedResponse;
        if (rawResponse.data && Array.isArray(rawResponse.data)) {
          normalizedResponse = transformRawResponseToNormalized(rawResponse as NetskopeRawPolicyResponse);
        } else if (rawResponse.rule_id) {
          // Single rule response
          normalizedResponse = transformRawResponseToNormalized({ data: [rawResponse] });
        } else {
          throw new Error('Unexpected response format for single rule');
        }

        // Transform based on requested format
        let result: any;
        switch (params.format) {
          case 'raw':
            result = rawResponse;
            break;
          case 'normalized':
            result = normalizedResponse.data[0] || null;
            break;
          case 'legacy':
            const legacyData = transformNormalizedArrayToOriginal(normalizedResponse.data);
            result = legacyData[0] || null;
            break;
          default:
            result = normalizedResponse.data[0] || null;
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        console.error('Error in getRule:', error);
        const errorResponse = createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }] };
      }
    }
  },

  /**
   * Creates a new policy rule with MCP input transformation
   */
  createRule: {
    name: 'createRule',
    schema: z.object({
      name: z.string(),
      enabled: z.boolean().optional().default(true),
      action: z.enum(['allow', 'block']).optional().default('allow'),
      access_methods: z.array(z.enum(['Client', 'Clientless'])).optional().default(['Client']),
      conditions: z.array(z.object({
        type: z.enum(['private_app', 'user', 'group', 'organization_unit', 'location', 'device']),
        operator: z.enum(['in', 'not_in', 'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with']),
        value: z.union([z.string(), z.array(z.string()), z.number(), z.array(z.number())])
      })).optional().default([]),
      dlp_profiles: z.array(z.string()).optional(),
      description: z.string().optional()
    }),
    handler: async (params: {
      name: string;
      enabled?: boolean;
      action?: 'allow' | 'block';
      access_methods?: ('Client' | 'Clientless')[];
      conditions?: Array<{
        type: 'private_app' | 'user' | 'group' | 'organization_unit' | 'location' | 'device';
        operator: 'in' | 'not_in' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with';
        value: string | string[] | number | number[];
      }>;
      dlp_profiles?: string[];
      description?: string;
    }) => {
      try {
        // Transform MCP input to Netskope API format
        const netskopePayload = transformMCPInputToNetskopeAPI(params);
        
        const result = await api.requestWithRetry<any>(
          '/api/v2/policy/npa/rules',
          {
            method: 'POST',
            body: JSON.stringify(netskopePayload)
          }
        );

        // Transform response back to normalized format
        const normalizedResponse = transformRawResponseToNormalized({ data: [result] });
        
        return { content: [{ type: 'text' as const, text: JSON.stringify(normalizedResponse.data[0], null, 2) }] };
      } catch (error) {
        console.error('Error in createRule:', error);
        const errorResponse = createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }] };
      }
    }
  },

  /**
   * Updates an existing policy rule
   */
  updateRule: {
    name: 'updateRule',
    schema: z.object({
      id: z.union([z.number(), z.string()]).transform(val => String(val)),
      name: z.string().optional(),
      enabled: z.boolean().optional(),
      action: z.enum(['allow', 'block']).optional(),
      access_methods: z.array(z.enum(['Client', 'Clientless'])).optional(),
      conditions: z.array(z.object({
        type: z.enum(['private_app', 'user', 'group', 'organization_unit', 'location', 'device']),
        operator: z.enum(['in', 'not_in', 'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with']),
        value: z.union([z.string(), z.array(z.string()), z.number(), z.array(z.number())])
      })).optional(),
      dlp_profiles: z.array(z.string()).optional(),
      description: z.string().optional()
    }),
    handler: async (params: {
      id: string;
      name?: string;
      enabled?: boolean;
      action?: 'allow' | 'block';
      access_methods?: ('Client' | 'Clientless')[];
      conditions?: Array<{
        type: 'private_app' | 'user' | 'group' | 'organization_unit' | 'location' | 'device';
        operator: 'in' | 'not_in' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with';
        value: string | string[] | number | number[];
      }>;
      dlp_profiles?: string[];
      description?: string;
    }) => {
      try {
        // Transform MCP input to Netskope API format
        const netskopePayload = transformMCPInputToNetskopeAPI(params);
        
        const result = await api.requestWithRetry<any>(
          `/api/v2/policy/npa/rules/${params.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(netskopePayload)
          }
        );

        // Transform response back to normalized format
        const normalizedResponse = transformRawResponseToNormalized({ data: [result] });
        
        return { content: [{ type: 'text' as const, text: JSON.stringify(normalizedResponse.data[0], null, 2) }] };
      } catch (error) {
        console.error('Error in updateRule:', error);
        const errorResponse = createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }] };
      }
    }
  },

  /**
   * Deletes a policy rule
   */
  deleteRule: {
    name: 'deleteRule',
    schema: z.object({
      id: z.union([z.number(), z.string()]).transform(val => String(val))
    }),
    handler: async (params: { id: string }) => {
      try {
        const result = await api.requestWithRetry<any>(
          `/api/v2/policy/npa/rules/${params.id}`,
          {
            method: 'DELETE'
          }
        );

        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Rule deleted successfully' }, null, 2) }] };
      } catch (error) {
        console.error('Error in deleteRule:', error);
        const errorResponse = createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }] };
      }
    }
  },

  // ============================================================================
  // BACKWARDS COMPATIBILITY METHODS
  // ============================================================================

  /**
   * Legacy listPolicyRules method for backwards compatibility
   */
  listPolicyRules: {
    name: 'listPolicyRules',
    schema: z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      sortby: z.string().optional(),
      sortorder: z.string().optional()
    }),
    handler: async (params: { limit?: number; offset?: number; sortby?: string; sortorder?: string }) => {
      // Delegate to enhanced listRules with legacy format
      return EnhancedPolicyTools.listRules.handler({ ...params, format: 'legacy' });
    }
  },

  /**
   * Legacy getPolicyRule method for backwards compatibility
   */
  getPolicyRule: {
    name: 'getPolicyRule',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      // Delegate to enhanced getRule with legacy format
      return EnhancedPolicyTools.getRule.handler({ id: String(params.id), format: 'legacy' });
    }
  },

  /**
   * Legacy createPolicyRule method for backwards compatibility
   */
  createPolicyRule: {
    name: 'createPolicyRule',
    schema: npaPolicyRequestSchema,
    handler: async (params: NPAPolicyRequest) => {
      // Transform legacy format to new format
      const enhancedParams = {
        name: params.name,
        enabled: params.enabled,
        action: params.action,
        conditions: params.conditions,
        description: params.description
      };
      
      return EnhancedPolicyTools.createRule.handler(enhancedParams);
    }
  },

  /**
   * Legacy updatePolicyRule method for backwards compatibility
   */
  updatePolicyRule: {
    name: 'updatePolicyRule',
    schema: npaPolicyRequestSchema.extend({
      id: z.number()
    }),
    handler: async (params: NPAPolicyRequest & { id: number }) => {
      // Transform legacy format to new format
      const { id, ...updateData } = params;
      const enhancedParams = {
        id: String(id),
        name: updateData.name,
        enabled: updateData.enabled,
        action: updateData.action,
        conditions: updateData.conditions,
        description: updateData.description
      };
      
      return EnhancedPolicyTools.updateRule.handler(enhancedParams);
    }
  },

  /**
   * Legacy deletePolicyRule method for backwards compatibility
   */
  deletePolicyRule: {
    name: 'deletePolicyRule',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      return EnhancedPolicyTools.deleteRule.handler({ id: String(params.id) });
    }
  }
};