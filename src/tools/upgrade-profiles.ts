import { z } from 'zod';
import { McpTool, McpToolResponse } from './types.js';
import { 
  upgradeProfilePostRequestSchema, 
  upgradeProfilePutRequestSchema
} from '../types/schemas/upgrade-profiles.schemas.js';
import { normalizeCronExpression } from '../utils/cron.js';

/**
 * Tool for managing upgrade profiles
 */
export const UpgradeProfileTools = {
  list: {
    name: 'listUpgradeProfiles',
    schema: z.object({}),
    handler: async (): Promise<McpToolResponse> => ({
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          status: 'success',
          data: {
            upgrade_profiles: []
          },
          total: 0
        })
      }]
    })
  },

  get: {
    name: 'getUpgradeProfile',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }): Promise<McpToolResponse> => ({
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          status: 'success',
          data: {}
        })
      }]
    })
  },

  create: {
    name: 'createUpgradeProfile',
    schema: upgradeProfilePostRequestSchema,
    handler: async (data: z.infer<typeof upgradeProfilePostRequestSchema>): Promise<McpToolResponse> => {
      // Normalize cron expression before validation
      const normalizedData = {
        ...data,
        frequency: normalizeCronExpression(data.frequency)
      };

      // Validate with schema
      const validated = upgradeProfilePostRequestSchema.parse(normalizedData);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'success',
            data: validated
          })
        }]
      };
    }
  },

  update: {
    name: 'updateUpgradeProfile',
    schema: upgradeProfilePutRequestSchema,
    handler: async (data: z.infer<typeof upgradeProfilePutRequestSchema>): Promise<McpToolResponse> => {
      // Normalize cron expression before validation
      const normalizedData = {
        ...data,
        frequency: normalizeCronExpression(data.frequency)
      };

      // Validate with schema
      const validated = upgradeProfilePutRequestSchema.parse(normalizedData);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'success',
            data: validated
          })
        }]
      };
    }
  },

  delete: {
    name: 'deleteUpgradeProfile',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }): Promise<McpToolResponse> => ({
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          status: 'success'
        })
      }]
    })
  },

  upgradeProfileSchedule: {
    name: 'upgradeProfileSchedule',
    schema: z.object({
      id: z.number().describe('Profile identifier'),
      schedule: z.string().describe('New schedule in human-readable format or cron format')
    }),
    handler: async (params: { id: number; schedule: string }): Promise<McpToolResponse> => {
      // Convert human-readable format to cron if needed
      const cronSchedule = normalizeCronExpression(params.schedule);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'success',
            data: {
              id: params.id,
              frequency: cronSchedule
            }
          })
        }]
      };
    }
  }
} satisfies Record<string, McpTool>;
