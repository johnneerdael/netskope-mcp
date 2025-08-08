import * as z from 'zod';
import { 
  privateAppRequestSchema,
  privateAppUpdateRequestSchema,
  protocolSchema,
  tagSchema,
  tagNoIdSchema,
  publisherItemCreateSchema,
  smartDeleteOptionsSchema,
  deletionValidationResultSchema,
  policyDependencyAnalysisSchema,
  smartDeleteResultSchema,
  privateAppIdSchema,
  discoverySettingsRequestSchema,
  discoverySettingsResponseSchema,
  patchTagsRequestSchema
} from '../types/schemas/private-apps.schemas.js';
import { api } from '../config/netskope-config.js';
import { buildQuery, QueryOptions, FILTERABLE_FIELDS } from '../utils/query-builder.js';

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
  private_app_names: string[];
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
  replace: {
    name: 'replacePrivateApp';
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
      limit: z.ZodOptional<z.ZodNumber>;
      offset: z.ZodOptional<z.ZodNumber>;
      query: z.ZodOptional<z.ZodString>;
      app_name: z.ZodOptional<z.ZodString>;
      publisher_name: z.ZodOptional<z.ZodString>;
      reachable: z.ZodOptional<z.ZodBoolean>;
      clientless_access: z.ZodOptional<z.ZodBoolean>;
      use_publisher_dns: z.ZodOptional<z.ZodBoolean>;
      host: z.ZodOptional<z.ZodString>;
      in_steering: z.ZodOptional<z.ZodBoolean>;
      in_policy: z.ZodOptional<z.ZodBoolean>;
      private_app_protocol: z.ZodOptional<z.ZodString>;
    }>;
    handler: (params: { 
      limit?: number;
      offset?: number;
      query?: string;
      app_name?: string;
      publisher_name?: string;
      reachable?: boolean;
      clientless_access?: boolean;
      use_publisher_dns?: boolean;
      host?: string;
      in_steering?: boolean;
      in_policy?: boolean;
      private_app_protocol?: string;
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
  patchTags: {
    name: 'patchPrivateAppTags';
    schema: typeof patchTagsRequestSchema;
    handler: (params: z.infer<typeof patchTagsRequestSchema>) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  updatePublishers: {
    name: 'updatePrivateAppPublishers';
    schema: z.ZodObject<{
      private_app_names: z.ZodArray<z.ZodString>;
      publisher_ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: PublishersParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  deletePublishers: {
    name: 'deletePrivateAppPublishers';
    schema: z.ZodObject<{
      private_app_names: z.ZodArray<z.ZodString>;
      publisher_ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: PublishersParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  getDiscoverySettings: {
    name: 'getDiscoverySettings';
    schema: z.ZodObject<{}>;
    handler: (params: Record<string, never>) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  updateDiscoverySettings: {
    name: 'updateDiscoverySettings';
    schema: typeof discoverySettingsRequestSchema;
    handler: (params: z.infer<typeof discoverySettingsRequestSchema>) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  getPolicyInUse: {
    name: 'getPolicyInUse';
    schema: z.ZodObject<{
      ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: PolicyParams) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
  getTagPolicyInUse: {
    name: 'getTagPolicyInUse';
    schema: z.ZodObject<{
      ids: z.ZodArray<z.ZodString>;
    }>;
    handler: (params: { ids: string[] }) => Promise<{ content: [{ type: 'text'; text: string }] }>;
  };
}

export const PrivateAppsTools: PrivateAppsToolsType = {
  create: {
    name: 'createPrivateApp',
    schema: privateAppRequestSchema,
    handler: async (params: z.infer<typeof privateAppRequestSchema>) => {
      try {
        // Validate app_type specific requirements
        const appType = params.app_type || 'client'; // Default to client for backward compatibility
        
        if (appType === 'clientless') {
          // Clientless validation
          if (Array.isArray(params.host)) {
            throw new Error('Clientless applications only support a single host address');
          }
          
          // For clientless apps, we allow TCP/UDP protocols as the API transforms them
          // based on hostType (http/https). The actual browser protocols are derived
          // from the hostType field in the API payload.
          
          // Ensure clientless_access is true for clientless apps
          if (!params.clientless_access) {
            throw new Error('Clientless applications must have clientless_access enabled');
          }
        } else if (appType === 'client') {
          // Client type validation
          const hasClientProtocol = params.protocols.some(p => 
            ['tcp', 'udp'].includes(p.type)
          );
          
          if (!hasClientProtocol) {
            throw new Error('Client applications require network protocols (tcp, udp)');
          }
        }

        // Transform params for API compatibility
        const apiPayload = {
          ...params,
          protocols: params.protocols.map(p => ({
            type: p.type,
            ports: [p.port]
          })),
          // Map trust_self_signed_certs to isSelfSignedCert
          isSelfSignedCert: params.trust_self_signed_certs,
          // Add hostType based on protocol for clientless apps
          ...(appType === 'clientless' && {
            hostType: params.protocols.some(p => p.type === 'https') ? 'https' : 'http'
          })
        };
        
        // Remove the original field to avoid conflicts
        delete (apiPayload as any).trust_self_signed_certs;

        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private',
          {
            method: 'POST',
            body: JSON.stringify(apiPayload)
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to create private app: ${errorMessage}`);
      }
    }
  },

  update: {
    name: 'updatePrivateApp',
    schema: privateAppUpdateRequestSchema,
    handler: async (params: z.infer<typeof privateAppUpdateRequestSchema>) => {
      try {
        // Validate app_type specific requirements
        const appType = params.app_type || 'client'; // Default to client for backward compatibility
        
        if (appType === 'clientless') {
          // Clientless validation
          if (Array.isArray(params.host)) {
            throw new Error('Clientless applications only support a single host address');
          }
          
          // For clientless apps, we allow TCP/UDP protocols as the API transforms them
          // based on hostType (http/https). The actual browser protocols are derived
          // from the hostType field in the API payload.
          
          // Ensure clientless_access is true for clientless apps
          if (!params.clientless_access) {
            throw new Error('Clientless applications must have clientless_access enabled');
          }
        } else if (appType === 'client') {
          // Client type validation
          const hasClientProtocol = params.protocols.some(p => 
            ['tcp', 'udp'].includes(p.type)
          );
          
          if (!hasClientProtocol) {
            throw new Error('Client applications require network protocols (tcp, udp)');
          }
        }

        // Transform params for API compatibility
        const apiPayload = {
          ...params,
          protocols: params.protocols.map(p => ({
            type: p.type,
            ports: [p.port]
          })),
          // Map trust_self_signed_certs to isSelfSignedCert
          isSelfSignedCert: params.trust_self_signed_certs,
          // Add hostType based on protocol for clientless apps
          ...(appType === 'clientless' && {
            hostType: params.protocols.some(p => p.type === 'https') ? 'https' : 'http'
          })
        };
        
        // Remove the original field to avoid conflicts
        delete (apiPayload as any).trust_self_signed_certs;

        const result = await api.requestWithRetry(
          `/api/v2/steering/apps/private/${params.id}`,
          {
            method: 'PATCH',  // Changed to PATCH for partial updates
            body: JSON.stringify(apiPayload)
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to update private app: ${errorMessage}`);
      }
    }
  },

  replace: {
    name: 'replacePrivateApp',
    schema: privateAppUpdateRequestSchema,
    handler: async (params: z.infer<typeof privateAppUpdateRequestSchema>) => {
      try {
        // Create API payload by removing id from params (it goes in URL)
        const { id, ...basePayload } = params;
        
        // Apply the same transformations as update
        const appType = basePayload.clientless_access ? 'clientless' : 'client';
        const apiPayload = {
          ...basePayload,
          app_type: appType,
          // Map trust_self_signed_certs to isSelfSignedCert
          isSelfSignedCert: params.trust_self_signed_certs,
          // Add hostType based on protocol for clientless apps
          ...(appType === 'clientless' && {
            hostType: params.protocols.some(p => p.type === 'https') ? 'https' : 'http'
          })
        };
        
        // Remove the original field to avoid conflicts
        delete (apiPayload as any).trust_self_signed_certs;

        const result = await api.requestWithRetry(
          `/api/v2/steering/apps/private/${params.id}`,
          {
            method: 'PUT',  // PUT for complete replacement
            body: JSON.stringify(apiPayload)
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to replace private app: ${errorMessage}`);
      }
    }
  } as const,

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
      try {
        const result = await api.requestWithRetry(
          `/api/v2/steering/apps/private/${id}`
        );
        
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorResponse = { error: errorMessage, id };
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse) }] };
      }
    }
  },

  list: {
    name: 'listPrivateApps',
    schema: z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      query: z.string().optional().describe('Search query to find apps by name. Use this to find app IDs when you only have app names. Example: "LLM-Test-App" will find "[LLM-Test-App]"'),
      // Individual field filters
      app_name: z.string().optional().describe('Exact app name match (use query parameter for flexible searching)'),
      publisher_name: z.string().optional(),
      reachable: z.boolean().optional(),
      clientless_access: z.boolean().optional(),
      use_publisher_dns: z.boolean().optional(),
      host: z.string().optional(),
      in_steering: z.boolean().optional(),
      in_policy: z.boolean().optional(),
      private_app_protocol: z.string().optional()
    }).describe('List private applications. Use the query parameter to search for apps by name (supports partial matches), then use the app_id from results in other tools like getPolicyInUse.'),
    handler: async (params: { 
      limit?: number;
      offset?: number;
      query?: string;
      app_name?: string;
      publisher_name?: string;
      reachable?: boolean;
      clientless_access?: boolean;
      use_publisher_dns?: boolean;
      host?: string;
      in_steering?: boolean;
      in_policy?: boolean;
      private_app_protocol?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.offset) queryParams.set('offset', String(params.offset));
      
      // Build query string from individual fields or use provided query
      let queryString = params.query;
      
      // Auto-format simple queries for better UX
      if (queryString && !queryString.includes(' ')) {
        // If it's a simple string without operators, assume it's an app name search
        queryString = `app_name has ${queryString}`;
      }
      
      // Validate query syntax if provided
      if (queryString) {
        const { validateQuery } = await import('../utils/query-builder.js');
        const validation = validateQuery(queryString);
        if (!validation.valid) {
          throw new Error(`Invalid query syntax: ${validation.errors.join(', ')}`);
        }
      }
      
      if (!queryString) {
        // Extract filterable fields from params
        const filterOptions: QueryOptions = {};
        Object.keys(FILTERABLE_FIELDS).forEach(field => {
          const value = params[field as keyof typeof params];
          if (value !== undefined) {
            filterOptions[field as keyof QueryOptions] = value as any;
          }
        });
        
        // Build query if we have filter options
        if (Object.keys(filterOptions).length > 0) {
          queryString = buildQuery(filterOptions);
        }
      }
      
      if (queryString) queryParams.set('query', queryString);

      const finalUrl = `/api/v2/steering/apps/private?${queryParams}`;
      
      const result = await api.requestWithRetry(finalUrl);
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
    }).describe('Bulk replace tags for multiple private applications using PUT method. This REPLACES ALL existing tags with the provided tags.'),
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

  patchTags: {
    name: 'patchPrivateAppTags',
    schema: patchTagsRequestSchema.describe('Add or update tags for private applications using PATCH method. This ADDS/UPDATES tags while preserving existing tags. IMPORTANT: Requires private app IDs (not names) - use listPrivateApps or searchPrivateApps to find IDs. The tag_name will be created if it does not exist.'),
    handler: async (params: z.infer<typeof patchTagsRequestSchema>) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/tags',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred while patching tags',
          error_details: error
        }) }] };
      }
    }
  },

  updatePublishers: {
    name: 'updatePrivateAppPublishers',
    schema: z.object({
      private_app_names: z.array(z.string()),
      publisher_ids: z.array(z.string())
    }),
    handler: async (params: PublishersParams) => {
      // Convert app names to IDs
      const appIds = await Promise.all(
        params.private_app_names.map(async (appName) => {
          const apps = await api.requestWithRetry('/api/v2/steering/apps/private', {
            method: 'GET'
          }) as any;
          const app = apps.data?.private_apps?.find((a: any) => a.app_name === appName);
          if (!app) {
            throw new Error(`Private app '${appName}' not found`);
          }
          return app.app_id.toString();
        })
      );
      
      const apiParams = {
        private_app_ids: appIds,
        publisher_ids: params.publisher_ids
      };
      
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/publishers',
        {
          method: 'PUT',
          body: JSON.stringify(apiParams)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  deletePublishers: {
    name: 'deletePrivateAppPublishers',
    schema: z.object({
      private_app_names: z.array(z.string()),
      publisher_ids: z.array(z.string())
    }),
    handler: async (params: PublishersParams) => {
      // Convert app names to IDs
      const appIds = await Promise.all(
        params.private_app_names.map(async (appName) => {
          const apps = await api.requestWithRetry('/api/v2/steering/apps/private', {
            method: 'GET'
          }) as any;
          const app = apps.data?.private_apps?.find((a: any) => a.app_name === appName);
          if (!app) {
            throw new Error(`Private app '${appName}' not found`);
          }
          return app.app_id.toString();
        })
      );
      
      const apiParams = {
        private_app_ids: appIds,
        publisher_ids: params.publisher_ids
      };
      
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/publishers',
        {
          method: 'DELETE',
          body: JSON.stringify(apiParams)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getDiscoverySettings: {
    name: 'getDiscoverySettings',
    schema: z.object({}).describe('Get current private app discovery settings which control automatic application discovery and monitoring'),
    handler: async (params: Record<string, never>) => {
      const result = await api.requestWithRetry(
        '/api/v2/steering/apps/private/discoverysettings'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updateDiscoverySettings: {
    name: 'updateDiscoverySettings',
    schema: discoverySettingsRequestSchema.describe('Configure private application discovery settings. Discovery allows Netskope to automatically scan and identify applications running on specified networks. IMPORTANT: Before configuring, you must: (1) Find publishers using listPublishers tool, (2) Define host patterns and IP ranges to scan, (3) Specify users/groups who can perform discovery operations.'),
    handler: async (params: z.infer<typeof discoverySettingsRequestSchema>) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/discoverysettings',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred while updating discovery settings',
          error_details: error
        }) }] };
      }
    }
  },

  getPolicyInUse: {
    name: 'getPolicyInUse',
    schema: z.object({
      ids: z.array(z.string()).describe('Array of private app IDs (not names) to check for policy usage. Example: ["361", "123"]')
    }).describe('IMPORTANT: Check which policies are currently applied to specific private applications. You MUST provide private app IDs (not names). To find app IDs, use the searchPrivateApps tool with the app name, then extract the app_id from the results.'),
    handler: async (params: { ids: string[] }) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/getpolicyinuse',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: params.ids })
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          error_details: error
        }) }] };
      }
    }
  },

  getTagPolicyInUse: {
    name: 'getTagPolicyInUse',
    schema: z.object({
      ids: z.array(z.string()).describe('Array of private app tag IDs to check for policy usage')
    }),
    handler: async (params: { ids: string[] }) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/tags/getpolicyinuse',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: params.ids })
          }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          error_details: error
        }) }] };
      }
    }
  }
};

/**
 * Smart Delete Tools for MCP integration
 * These tools integrate with command functions for intelligent deletion
 */
export const SmartPrivateAppsTools = {
  validateDeletion: {
    name: 'validatePrivateAppDeletion',
    schema: z.object({ 
      id: z.string().describe('Unique identifier of the private application'),
      includeAnalysis: z.boolean().default(true).describe('Include detailed policy analysis')
    }),
    handler: async ({ id, includeAnalysis }: { id: string; includeAnalysis?: boolean }) => {
      // This will be handled by the command layer
      // The MCP tool acts as a passthrough to the command implementation
      const { validateDeletionSafety } = await import('../commands/private-apps/index.js');
      const validation = await validateDeletionSafety(id);
      return {
        content: [{ 
          type: 'text' as const, 
          text: JSON.stringify(validation) 
        }]
      };
    }
  },
  
  analyzeDependencies: {
    name: 'analyzePrivateAppPolicyDependencies',
    schema: z.object({ 
      appName: z.string().describe('Name of the private application to analyze')
    }),
    handler: async ({ appName }: { appName: string }) => {
      const { analyzePolicyDependencies } = await import('../commands/private-apps/index.js');
      const analysis = await analyzePolicyDependencies(appName);
      return {
        content: [{ 
          type: 'text' as const, 
          text: JSON.stringify(analysis) 
        }]
      };
    }
  },
  
  smartDelete: {
    name: 'deletePrivateAppSmart',
    schema: z.object({
      id: z.string().describe('Unique identifier of the private application'),
      options: smartDeleteOptionsSchema.optional().describe('Smart deletion options')
    }),
    handler: async ({ id, options = {} }: { id: string; options?: Partial<z.infer<typeof smartDeleteOptionsSchema>> }) => {
      const { deletePrivateAppSmart } = await import('../commands/private-apps/index.js');
      const result = await deletePrivateAppSmart(id, smartDeleteOptionsSchema.parse(options));
      return {
        content: [{ 
          type: 'text' as const, 
          text: JSON.stringify(result) 
        }]
      };
    }
  }
};
