import { z } from 'zod';
import { api } from '../config/netskope-config.js';

// Search for private apps by name
const searchPrivateAppsSchema = z.object({
  name: z.string().describe('App name to search for (supports partial matches)')
}).describe('Search for private applications by name. Use this to find app IDs when you only have app names.');

// Search for publishers by name  
const searchPublishersSchema = z.object({
  name: z.string().describe('Publisher name to search for (supports partial matches)')
}).describe('Search for publishers by name. Use this to find publisher IDs when you only have publisher names.');

export const SearchTools = {
  searchPrivateApps: {
    name: 'searchPrivateApps',
    schema: searchPrivateAppsSchema,
    handler: async (params: { name: string }) => {
      try {
        const queryParams = new URLSearchParams({
          query: `name has ${params.name}`
        });
        
        const result = await api.requestWithRetry(
          `/api/v2/infrastructure/npa/search/private_apps?${queryParams}`
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

  searchPublishers: {
    name: 'searchPublishers', 
    schema: searchPublishersSchema,
    handler: async (params: { name: string }) => {
      try {
        const queryParams = new URLSearchParams({
          query: `name has ${params.name}`
        });
        
        const result = await api.requestWithRetry(
          `/api/v2/infrastructure/npa/search/publishers?${queryParams}`
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

export type SearchToolsType = typeof SearchTools;
