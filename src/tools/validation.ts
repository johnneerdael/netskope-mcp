import * as z from 'zod';
import {
  resourceValidationRequestSchema,
  resourceTypeSchema,
  validateNameResponseSchema,
  ResourceType,
  ResourceValidationRequest,
  ResourceValidationResponse,
  TagType,
  ValidateNameResponse
} from '../types/schemas/validation.schemas.js';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const ValidationTools = {
  validateName: {
    name: 'validateName',
    schema: z.object({
      resourceType: resourceTypeSchema,
      name: z.string(),
      tagType: z.string().optional()
    }),
    handler: async (params: { resourceType: ResourceType; name: string; tagType?: TagType }) => {
      const queryParams = new URLSearchParams({
        resourceType: params.resourceType,
        name: params.name,
        ...(params.tagType && { tag_type: params.tagType })
      });
      const result = await api.requestWithRetry<ApiResponse<ValidateNameResponse>>(
        `/api/v2/infrastructure/npa/namevalidation?${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  validateResource: {
    name: 'validateResource',
    schema: z.object({
      resourceType: resourceTypeSchema,
      data: resourceValidationRequestSchema
    }),
    handler: async (params: { resourceType: ResourceType; data: ResourceValidationRequest }) => {
      const result = await api.requestWithRetry<ApiResponse<ResourceValidationResponse>>(
        `/api/v2/infrastructure/npa/resource/validation/${params.resourceType}`,
        {
          method: 'POST',
          body: JSON.stringify(params.data)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};

export type ValidationToolsType = typeof ValidationTools;
