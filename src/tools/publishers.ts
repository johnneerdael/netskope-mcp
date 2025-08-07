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
import * as fs from 'fs';
import * as path from 'path';

interface ApiResponse<T> {
  status: string;
  data: T;
}

// Debug logging function
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`;
  const logPath = path.join(process.cwd(), 'debug.log');
  
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Failed to write to debug.log:', error);
  }
}

// Utility function to extract integer ID from various parameter formats
function extractIdFromParams(params: any, idField: string = 'id'): number {
  debugLog(`extractIdFromParams called`, { params, idField });
  
  let id: number;

  if (typeof params === 'object' && params[idField] !== undefined) {
    debugLog(`Found ${idField} in params`, { type: typeof params[idField], value: params[idField] });
    
    if (typeof params[idField] === 'number') {
      id = params[idField];
    } else if (typeof params[idField] === 'string') {
      id = parseInt(params[idField], 10);
    } else if (typeof params[idField] === 'object') {
      // Handle nested object case
      const nested = params[idField];
      debugLog(`Nested object detected`, nested);
      
      if (typeof nested.id === 'number' || typeof nested.id === 'string') {
        id = typeof nested.id === 'number' ? nested.id : parseInt(nested.id, 10);
      } else if (typeof nested.value === 'number' || typeof nested.value === 'string') {
        id = typeof nested.value === 'number' ? nested.value : parseInt(nested.value, 10);
      } else {
        debugLog(`Failed to extract from nested object`, nested);
        throw new Error(`Invalid nested object structure: ${JSON.stringify(nested)}`);
      }
    } else {
      debugLog(`Invalid ${idField} type`, { type: typeof params[idField], value: params[idField] });
      throw new Error(`Invalid ${idField} type: ${typeof params[idField]}, value: ${params[idField]}`);
    }
  } else {
    debugLog(`Invalid params structure or missing ${idField}`, params);
    throw new Error(`Invalid params structure, missing ${idField}: ${JSON.stringify(params)}`);
  }

  // Validate the final number
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
    debugLog(`Invalid ${idField} value`, { id, isNaN: isNaN(id), isInteger: Number.isInteger(id) });
    throw new Error(`Invalid ${idField}: ${id}. Must be a positive integer.`);
  }

  debugLog(`Successfully extracted ${idField}`, { id });
  return id;
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
      id: z.union([z.number(), z.string().transform(val => parseInt(val, 10))])
    }),
    handler: async (params: any) => {
      console.log('=== PUBLISHER GET HANDLER DEBUG ===');
      console.log('Raw params:', JSON.stringify(params, null, 2));
      console.log('Type of params:', typeof params);
      console.log('params.id:', params.id);
      console.log('Type of params.id:', typeof params.id);
      
      debugLog('get_publisher handler called with params', params);
      
      try {
        const publisherId = extractIdFromParams(params, 'id');
        console.log('Extracted publisherId:', publisherId);
        console.log('Type of publisherId:', typeof publisherId);
        
        debugLog('Successfully extracted publisherId', { publisherId });

        const url = `/api/v2/infrastructure/publishers/${publisherId}`;
        console.log('Generated URL:', url);
        
        debugLog('Making request to URL', { url });

        const result = await api.requestWithRetry<ApiResponse<PublisherResponse>>(url);
        debugLog('Request successful', { status: result?.status });

        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        console.log('ERROR in get_publisher handler:', error);
        debugLog('Error in get_publisher handler', { error: error instanceof Error ? error.message : error });
        throw error;
      }
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
      id: z.union([z.number(), z.string().transform(val => parseInt(val, 10))])
    }),
    handler: async (params: any) => {
      const publisherId = extractIdFromParams(params, 'id');

      const result = await api.requestWithRetry<{ status: 'success' | 'error' }>(
        `/api/v2/infrastructure/publishers/${publisherId}`,
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
      publisherId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))])
    }),
    handler: async (params: any) => {
      const publisherId = extractIdFromParams(params, 'publisherId');

      const result = await api.requestWithRetry<ApiResponse<any>>(
        `/api/v2/infrastructure/publishers/${publisherId}/apps`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  generatePublisherRegistrationToken: {
    name: 'generate_publisher_registration_token',
    schema: z.object({
      publisherId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))])
    }),
    handler: async (params: any) => {
      const publisherId = extractIdFromParams(params, 'publisherId');

      const result = await api.requestWithRetry<{ data: { token: string }, status: string }>(
        `/api/v2/infrastructure/publishers/${publisherId}/registration_token`,
        {
          method: 'POST'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
