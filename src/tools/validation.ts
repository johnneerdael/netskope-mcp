import * as z from 'zod';
import { 
  ResourceType,
  TagType,
  ResourceValidationRequest,
  ResourceValidationResponse,
  ValidateNameResponse,
  resourceTypeSchema,
  resourceValidationRequestSchema,
  searchResourcesRequestSchema,
  SearchResourcesResponse
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
  },

  searchResources: {
    name: 'searchResources',
    schema: searchResourcesRequestSchema,
    handler: async (params: z.infer<typeof searchResourcesRequestSchema>) => {
      const queryParams = new URLSearchParams({
        query: params.query,
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.offset && { offset: params.offset.toString() })
      });
      
      const result = await api.requestWithRetry<ApiResponse<SearchResourcesResponse>>(
        `/api/v2/infrastructure/npa/search/${params.resourceType}?${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
