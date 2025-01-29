import * as z from 'zod';
import { 
  privateAppRequestSchema,
  privateAppUpdateRequestSchema,
  protocolSchema,
  tagSchema,
  tagNoIdSchema
} from '../types/schemas/private-apps.schemas.js';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

interface TagsParams {
  id: string;
  tags: Array<{ tag_name: string }>;
}

interface BulkTagsParams {
  ids: string[];
  tags: Array<{ tag_name: string }>;
}

interface PublishersParams {
  private_app_ids: string[];
  publisher_ids: string[];
}

interface PolicyParams {
  ids: string[];
}

interface PrivateAppsToolsType {
  create: {
    name: 'createPrivateApp';
    schema: typeof privateAppRequestSchema;
    handler: (params: z.infer<typeof privateAppRequestSchema>) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  update: {
    name: 'updatePrivateApp';
    schema: typeof privateAppUpdateRequestSchema;
    handler: (params: z.infer<typeof privateAppUpdateRequestSchema>) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  delete: {
    name: 'deletePrivateApp';
    schema: z.ZodObject<{ id: z.ZodString }>;
    handler: (params: { id: string }) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  get: {
    name: 'getPrivateApp';
    schema: z.ZodObject<{ id: z.ZodString }>;
    handler: (params: { id: string }) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  list: {
    name: 'listPrivateApps';
    schema: z.ZodObject<{
      fields: z.ZodOptional<z.ZodString>;
      filter: z.ZodOptional<z.ZodString>;
      query: z.ZodOptional<z.ZodString>;
      limit: z.ZodOptional<z.ZodNumber>;
      offset: z.ZodOptional<z.ZodNumber>;
    }>;
    handler: (params: { 
      fields?: string;
      filter?: string;
      query?: string;
      limit?: number;
      offset?: number;
    }) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  getTags: {
    name: 'getPrivateAppTags';
    schema: z.ZodObject<{
      query: z.ZodOptional<z.ZodString>;
      limit: z.ZodOptional<z.ZodNumber>;
      offset: z.ZodOptional<z.ZodNumber>;
    }>;
    handler: (params: {
      query?: string;
      limit?: number;
      offset?: number;
    }) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  createTags: {
    name: 'createPrivateAppTags';
    schema: z.ZodObject<{
      id: z.ZodString;
      tags: z.ZodArray<typeof tagNoIdSchema>;
    }>;
    handler: (params: TagsParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  updateTags: {
    name: 'updatePrivateAppTags';
    schema: z.ZodObject<{
      ids: z.ZodArray<z.ZodString>;
      tags: z.ZodArray<typeof tagNoIdSchema>;
    }>;
    handler: (params: BulkTagsParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  updatePublishers: {
    name: 'updatePrivateAppPublishers';
    schema: z.ZodObject<{
      private_app_ids: z.ZodArray<z.ZodString>;
      publisher_ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: PublishersParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  deletePublishers: {
    name: 'deletePrivateAppPublishers';
    schema: z.ZodObject<{
      private_app_ids: z.ZodArray<z.ZodString>;
      publisher_ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: PublishersParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  getDiscoverySettings: {
    name: 'getDiscoverySettings';
    schema: z.ZodObject<{}>;
    handler: (params: Record<string, never>) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  getPolicyInUse: {
    name: 'getPolicyInUse';
    schema: z.ZodObject<{
      ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: PolicyParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
}

export const PrivateAppsTools: PrivateAppsToolsType = {
  create: {
    name: 'createPrivateApp',
    schema: privateAppRequestSchema,
    handler: async (params: z.infer<typeof privateAppRequestSchema>) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private',
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  update: {
    name: 'updatePrivateApp',
    schema: privateAppUpdateRequestSchema,
    handler: async (params: z.infer<typeof privateAppUpdateRequestSchema>) => {
      const result = await api.requestWithRetry(
        `/api/v2/steering/apps/private/${params.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  delete: {
    name: 'deletePrivateApp',
    schema: z.object({ id: z.string() }),
    handler: async ({ id }: { id: string }) => {
      const result = await api.requestWithRetry(
        `/api/v2/steering/apps/private/${id}`,
        { method: 'DELETE' }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  get: {
    name: 'getPrivateApp',
    schema: z.object({ id: z.string() }),
    handler: async ({ id }: { id: string }) => {
      const result = await api.requestWithRetry(
        `/api/v2/steering/apps/private/${id}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  list: {
    name: 'listPrivateApps',
    schema: z.object({
      fields: z.string().optional(),
      filter: z.string().optional(),
      query: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional()
    }),
    handler: async (params: { 
      fields?: string;
      filter?: string;
      query?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.fields) queryParams.set('fields', params.fields);
      if (params.filter) queryParams.set('filter', params.filter);
      if (params.query) queryParams.set('query', params.query);
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.offset) queryParams.set('offset', String(params.offset));

      const result = await api.requestWithRetry(
        `/api/v2/steering/apps/private?${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getTags: {
    name: 'getPrivateAppTags',
    schema: z.object({
      query: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional()
    }),
    handler: async (params: {
      query?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('query', params.query);
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.offset) queryParams.set('offset', String(params.offset));

      const result = await api.requestWithRetry(
        `/api/v2/steering/apps/private/tags?${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  createTags: {
    name: 'createPrivateAppTags',
    schema: z.object({
      id: z.string(),
      tags: z.array(tagNoIdSchema)
    }),
    handler: async (params: TagsParams) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/tags',
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updateTags: {
    name: 'updatePrivateAppTags',
    schema: z.object({
      ids: z.array(z.string()),
      tags: z.array(tagNoIdSchema)
    }),
    handler: async (params: BulkTagsParams) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/tags',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updatePublishers: {
    name: 'updatePrivateAppPublishers',
    schema: z.object({
      private_app_ids: z.array(z.string()),
      publisher_ids: z.array(z.string())
    }),
    handler: async (params: PublishersParams) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/publishers',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  deletePublishers: {
    name: 'deletePrivateAppPublishers',
    schema: z.object({
      private_app_ids: z.array(z.string()),
      publisher_ids: z.array(z.string())
    }),
    handler: async (params: PublishersParams) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/publishers',
        {
          method: 'DELETE',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getDiscoverySettings: {
    name: 'getDiscoverySettings',
    schema: z.object({}),
    handler: async (params: Record<string, never>) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/discoverysettings'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getPolicyInUse: {
    name: 'getPolicyInUse',
    schema: z.object({
      ids: z.array(z.string())
    }),
    handler: async (params: PolicyParams) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/getpolicyinuse',
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
