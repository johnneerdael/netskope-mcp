import { z } from 'zod';
import { McpTool, McpToolResponse } from './types.js';
import { 
  upgradeProfilePostRequestSchema, 
  upgradeProfilePutRequestSchema,
  bulkProfileUpdateRequestSchema,
  upgradeProfileSchema,
  upgradeProfileListResponseSchema
} from '../types/schemas/upgrade-profiles.schemas.js';
import { api } from '../config/netskope-config.js';
import { normalizeCronExpression } from '../utils/cron.js';

// Utility function to extract integer ID from various parameter formats
function extractIdFromParams(params: any, idField: string = 'id'): number {
  
  let id: number;

  if (typeof params === 'object' && params[idField] !== undefined) {
    
    if (typeof params[idField] === 'number') {
      id = params[idField];
    } else if (typeof params[idField] === 'string') {
      id = parseInt(params[idField], 10);
    } else if (typeof params[idField] === 'object') {
      // Handle nested object case
      const nested = params[idField];
      
      if (typeof nested.id === 'number' || typeof nested.id === 'string') {
        id = typeof nested.id === 'number' ? nested.id : parseInt(nested.id, 10);
      } else if (typeof nested.value === 'number' || typeof nested.value === 'string') {
        id = typeof nested.value === 'number' ? nested.value : parseInt(nested.value, 10);
      } else {
        throw new Error(`Invalid nested object structure: ${JSON.stringify(nested)}`);
      }
    } else {
      throw new Error(`Invalid ${idField} type: ${typeof params[idField]}, value: ${params[idField]}`);
    }
  } else {
    throw new Error(`Invalid params structure, missing ${idField}: ${JSON.stringify(params)}`);
  }

  // Validate the final number
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid ${idField}: ${id}. Must be a positive integer.`);
  }

  return id;
}

/**
 * Tool for managing upgrade profiles
 */
export const UpgradeProfileTools = {
  list: {
    name: 'listUpgradeProfiles',
    schema: z.object({}),
    handler: async () => {
      const result = await api.requestWithRetry(
        '/api/v2/infrastructure/publisherupgradeprofiles'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  get: {
    name: 'getUpgradeProfile',
    schema: z.object({
      id: z.number().describe('External ID (use external_id from list response, not the internal database ID)')
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry(
        `/api/v2/infrastructure/publisherupgradeprofiles/${params.id}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  create: {
    name: 'createUpgradeProfile',
    schema: upgradeProfilePostRequestSchema,
    handler: async (params: z.infer<typeof upgradeProfilePostRequestSchema>) => {
      const normalizedData = {
        ...params,
        frequency: normalizeCronExpression(params.frequency)
      };
      const result = await api.requestWithRetry(
        '/api/v2/infrastructure/publisherupgradeprofiles',
        {
          method: 'POST',
          body: JSON.stringify(normalizedData)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  update: {
    name: 'updateUpgradeProfile',
    schema: upgradeProfilePutRequestSchema,
    handler: async (params: z.infer<typeof upgradeProfilePutRequestSchema>) => {
      const { id, ...data } = params;
      const normalizedData = {
        ...data,
        id, // Include the external_id in the request body
        frequency: normalizeCronExpression(data.frequency)
      };
      // Use the external_id in the URL path
      const result = await api.requestWithRetry(
        `/api/v2/infrastructure/publisherupgradeprofiles/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(normalizedData)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  delete: {
    name: 'deleteUpgradeProfile',
    schema: z.object({
      id: z.number().describe('External ID (use external_id from list response, not the internal database ID)')
    }),
    handler: async (params: { id: number }) => {
      // Extract the actual ID value from the params object
      const id = extractIdFromParams(params, 'id');
      const result = await api.requestWithRetry(
        `/api/v2/infrastructure/publisherupgradeprofiles/${id}`,
        {
          method: 'DELETE'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  bulkUpdate: {
    name: 'bulkUpgradePublishers',
    schema: bulkProfileUpdateRequestSchema,
    handler: async (params: z.infer<typeof bulkProfileUpdateRequestSchema>) => {
      const result = await api.requestWithRetry(
        '/api/v2/infrastructure/publisherupgradeprofiles/bulk',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  upgradeProfileSchedule: {
    name: 'upgradeProfileSchedule',
    schema: z.object({
      id: z.number().describe('Profile identifier'),
      schedule: z.string().describe('New schedule in human-readable format or cron format')
    }),
    handler: async (params: { id: number; schedule: string }) => {
      // This endpoint is not in the swagger spec; fallback to update with new frequency
      const cronSchedule = normalizeCronExpression(params.schedule);
      const result = await api.requestWithRetry(
        `/api/v2/infrastructure/publisherupgradeprofiles/${params.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ frequency: cronSchedule })
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
} satisfies Record<string, McpTool>;
