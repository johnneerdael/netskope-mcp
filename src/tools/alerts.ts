import { z } from 'zod';
import { McpTool } from './types.js';
import { alertConfigSchema } from '../types/schemas/alerts.schemas.js';
import { api } from '../config/netskope-config.js';

export const AlertsTools = {
  getConfig: {
    name: 'getAlertConfig',
    schema: z.object({}),
    handler: async () => {
      const result = await api.requestWithRetry<{ data: any, status: string }>(
        '/api/v2/infrastructure/publishers/alerts'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updateConfig: {
    name: 'updateAlertConfig',
    schema: alertConfigSchema,
    handler: async (params: z.infer<typeof alertConfigSchema>) => {
      const result = await api.requestWithRetry<{ status: string }>(
        '/api/v2/infrastructure/publishers/alerts',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
} satisfies Record<string, McpTool>;
