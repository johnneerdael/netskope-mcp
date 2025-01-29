import * as z from 'zod';
import { 
  PublisherPostRequest,
  PublisherPutRequest,
  PublisherPatchRequest,
  BulkUpgradeRequest,
  PublisherResponse,
  PublishersListResponse,
  PublisherBulkResponse,
  ReleasesResponse,
  publisherPostRequestSchema,
  publisherPutRequestSchema,
  publisherPatchRequestSchema,
  bulkUpgradeRequestSchema
} from '../types/schemas/publisher.schemas.js';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const PublishersTools = {
  list: {
    name: 'list_publishers',
    schema: z.object({
      fields: z.string().optional()
    }),
    handler: async (params: { fields?: string }) => {
      const queryParams = params.fields ? `?fields=${params.fields}` : '';
      const result = await api.requestWithRetry<ApiResponse<PublishersListResponse>>(
        `/api/v2/infrastructure/publishers${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  get: {
    name: 'get_publisher',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry<ApiResponse<PublisherResponse>>(
        `/api/v2/infrastructure/publishers/${params.id}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  create: {
    name: 'create_publisher',
    schema: publisherPostRequestSchema,
    handler: async (params: PublisherPostRequest) => {
      const result = await api.requestWithRetry<ApiResponse<PublisherResponse>>(
        '/api/v2/infrastructure/publishers',
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  replace: {
    name: 'replace_publisher',
    schema: publisherPutRequestSchema,
    handler: async (params: PublisherPutRequest & { id: number }) => {
      const { id, ...data } = params;
      const result = await api.requestWithRetry<ApiResponse<PublisherResponse>>(
        `/api/v2/infrastructure/publishers/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ id, ...data })
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  update: {
    name: 'update_publisher',
    schema: publisherPatchRequestSchema,
    handler: async (params: PublisherPatchRequest & { id: number }) => {
      const { id, ...data } = params;
      const result = await api.requestWithRetry<ApiResponse<PublisherResponse>>(
        `/api/v2/infrastructure/publishers/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  delete: {
    name: 'delete_publisher',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry<{ status: 'success' | 'error' }>(
        `/api/v2/infrastructure/publishers/${params.id}`,
        {
          method: 'DELETE'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  bulkUpgrade: {
    name: 'bulk_upgrade_publishers',
    schema: bulkUpgradeRequestSchema,
    handler: async (params: BulkUpgradeRequest) => {
      const result = await api.requestWithRetry<ApiResponse<PublisherBulkResponse>>(
        '/api/v2/infrastructure/publishers/bulk',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getReleases: {
    name: 'get_releases',
    schema: z.object({}),
    handler: async () => {
      const result = await api.requestWithRetry<ApiResponse<ReleasesResponse>>(
        '/api/v2/infrastructure/publishers/releases'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getPrivateApps: {
    name: 'get_private_apps',
    schema: z.object({
      publisherId: z.number()
    }),
    handler: async (params: { publisherId: number }) => {
      const result = await api.requestWithRetry<ApiResponse<any>>(
        `/api/v2/infrastructure/publishers/${params.publisherId}/apps`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  generatePublisherRegistrationToken: {
    name: 'generate_publisher_registration_token',
    schema: z.object({
      publisherId: z.number()
    }),
    handler: async (params: { publisherId: number }) => {
      const result = await api.requestWithRetry<{ data: { token: string }, status: string }>(
        `/api/v2/infrastructure/publishers/${params.publisherId}/registration_token`,
        {
          method: 'POST'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
