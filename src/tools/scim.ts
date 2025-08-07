import * as z from 'zod';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

// SCIM User schema
const scimUserSchema = z.object({
  id: z.string(),
  userName: z.string(),
  displayName: z.string().optional(),
  externalId: z.string().optional(),
  active: z.boolean().optional(),
  emails: z.array(z.object({
    value: z.string(),
    primary: z.boolean().optional()
  })).optional(),
  name: z.object({
    givenName: z.string().optional(),
    familyName: z.string().optional(),
    formatted: z.string().optional()
  }).optional()
});

// SCIM Group schema
const scimGroupSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  externalId: z.string().optional(),
  members: z.array(z.object({
    value: z.string(),
    display: z.string().optional(),
    type: z.enum(['User', 'Group']).optional()
  })).optional()
});

const scimUsersResponseSchema = z.object({
  schemas: z.array(z.string()),
  totalResults: z.number(),
  startIndex: z.number(),
  itemsPerPage: z.number(),
  Resources: z.array(scimUserSchema)
});

const scimGroupsResponseSchema = z.object({
  schemas: z.array(z.string()),
  totalResults: z.number(),
  startIndex: z.number(),
  itemsPerPage: z.number(),
  Resources: z.array(scimGroupSchema)
});

export const SCIMTools = {
  // User Operations
  listUsers: {
    name: 'listUsers',
    schema: z.object({
      filter: z.string().optional().describe('SCIM filter like userName eq "user@domain.com" or externalId eq "user-123"'),
      startIndex: z.number().optional().describe('Starting index for pagination'),
      count: z.number().optional().describe('Number of results to return')
    }),
    handler: async (params: { 
      filter?: string; 
      startIndex?: number; 
      count?: number;
    }) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.filter) queryParams.set('filter', params.filter);
        if (params.startIndex) queryParams.set('startIndex', params.startIndex.toString());
        if (params.count) queryParams.set('count', params.count.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/v2/scim/Users${queryString ? `?${queryString}` : ''}`;
        
        const result = await api.requestWithRetry<typeof scimUsersResponseSchema._type>(url);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        console.error('Error listing users:', error);
        const errorResponse = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to list users'
        };
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse) }] };
      }
    }
  },

  searchUsers: {
    name: 'searchUsers',
    schema: z.object({
      userName: z.string().optional().describe('Search by user name (UPN)'),
      externalId: z.string().optional().describe('Search by external ID'),
      displayName: z.string().optional().describe('Search by display name'),
      startIndex: z.number().optional().describe('Starting index for pagination'),
      count: z.number().optional().describe('Number of results to return')
    }),
    handler: async (params: { 
      userName?: string;
      externalId?: string;
      displayName?: string;
      startIndex?: number; 
      count?: number;
    }) => {
      try {
        let filter = '';
        if (params.userName) {
          filter = `userName eq "${params.userName}"`;
        } else if (params.externalId) {
          filter = `externalId eq "${params.externalId}"`;
        } else if (params.displayName) {
          filter = `displayName eq "${params.displayName}"`;
        }
        
        if (!filter) {
          throw new Error('At least one search parameter (userName, externalId, or displayName) is required');
        }
        
        const queryParams = new URLSearchParams();
        queryParams.set('filter', filter);
        if (params.startIndex) queryParams.set('startIndex', params.startIndex.toString());
        if (params.count) queryParams.set('count', params.count.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/v2/scim/Users?${queryString}`;
        
        const result = await api.requestWithRetry<typeof scimUsersResponseSchema._type>(url);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        console.error('Error searching users:', error);
        const errorResponse = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to search users'
        };
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse) }] };
      }
    }
  },

  // Group Operations
  listGroups: {
    name: 'listGroups',
    schema: z.object({
      filter: z.string().optional().describe('SCIM filter like displayName eq "Admins" or externalId eq "group-123"'),
      startIndex: z.number().optional().describe('Starting index for pagination'),
      count: z.number().optional().describe('Number of results to return')
    }),
    handler: async (params: { 
      filter?: string; 
      startIndex?: number; 
      count?: number;
    }) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.filter) queryParams.set('filter', params.filter);
        if (params.startIndex) queryParams.set('startIndex', params.startIndex.toString());
        if (params.count) queryParams.set('count', params.count.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/v2/scim/Groups${queryString ? `?${queryString}` : ''}`;
        
        const result = await api.requestWithRetry<typeof scimGroupsResponseSchema._type>(url);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        console.error('Error listing groups:', error);
        const errorResponse = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to list groups'
        };
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse) }] };
      }
    }
  },

  searchGroups: {
    name: 'searchGroups',
    schema: z.object({
      displayName: z.string().optional().describe('Search by group display name'),
      externalId: z.string().optional().describe('Search by external ID'),
      startIndex: z.number().optional().describe('Starting index for pagination'),
      count: z.number().optional().describe('Number of results to return')
    }),
    handler: async (params: { 
      displayName?: string;
      externalId?: string;
      startIndex?: number; 
      count?: number;
    }) => {
      try {
        let filter = '';
        if (params.displayName) {
          filter = `displayName eq "${params.displayName}"`;
        } else if (params.externalId) {
          filter = `externalId eq "${params.externalId}"`;
        }
        
        if (!filter) {
          throw new Error('At least one search parameter (displayName or externalId) is required');
        }
        
        const queryParams = new URLSearchParams();
        queryParams.set('filter', filter);
        if (params.startIndex) queryParams.set('startIndex', params.startIndex.toString());
        if (params.count) queryParams.set('count', params.count.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/v2/scim/Groups?${queryString}`;
        
        const result = await api.requestWithRetry<typeof scimGroupsResponseSchema._type>(url);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        console.error('Error searching groups:', error);
        const errorResponse = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to search groups'
        };
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse) }] };
      }
    }
  },

  // Admin User Operations
  getAdminUsers: {
    name: 'getAdminUsers',
    schema: z.object({
      startIndex: z.number().optional().describe('Starting index for pagination'),
      count: z.number().optional().describe('Number of results to return')
    }),
    handler: async (params: { 
      startIndex?: number; 
      count?: number;
    }) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.startIndex) queryParams.set('startIndex', params.startIndex.toString());
        if (params.count) queryParams.set('count', params.count.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/v2/platform/administration/scim/Users${queryString ? `?${queryString}` : ''}`;
        
        const result = await api.requestWithRetry<typeof scimUsersResponseSchema._type>(url);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        console.error('Error getting admin users:', error);
        const errorResponse = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to get admin users'
        };
        return { content: [{ type: 'text' as const, text: JSON.stringify(errorResponse) }] };
      }
    }
  }
};

// Export types
export type SCIMUser = z.infer<typeof scimUserSchema>;
export type SCIMGroup = z.infer<typeof scimGroupSchema>;
export type SCIMUsersResponse = z.infer<typeof scimUsersResponseSchema>;
export type SCIMGroupsResponse = z.infer<typeof scimGroupsResponseSchema>;
