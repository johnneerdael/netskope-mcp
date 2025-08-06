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
      id: z.number()
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
        frequency: normalizeCronExpression(data.frequency)
      };
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
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry(
        `/api/v2/infrastructure/publisherupgradeprofiles/${params.id}`,
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
