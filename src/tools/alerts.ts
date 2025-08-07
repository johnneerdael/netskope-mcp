import { z } from 'zod';
import { McpTool } from './types.js';
import { alertConfigSchema } from '../types/schemas/alerts.schemas.js';
import { api } from '../config/netskope-config.js';

export const AlertsTools = {
  getConfig: {
    name: 'getAlertConfig',
    schema: z.object({}).describe('Get current alert configuration for publisher events. Returns the list of admin users, event types, and selected users for notifications.'),
    handler: async () => {
      const result = await api.requestWithRetry<{ data: any, status: string }>(
        '/api/v2/infrastructure/publishers/alertsconfiguration'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updateConfig: {
    name: 'updateAlertConfig',
    schema: alertConfigSchema.describe('Update alert configuration for publisher events. Use getAdminUsers tool first to validate that admin user email addresses exist before adding them to the adminUsers array. The adminUsers field should contain valid email addresses of users who have administrative privileges in the system.'),
    handler: async (params: z.infer<typeof alertConfigSchema>) => {
      const result = await api.requestWithRetry<{ status: string }>(
        '/api/v2/infrastructure/publishers/alertsconfiguration',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
} satisfies Record<string, McpTool>;
