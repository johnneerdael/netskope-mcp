import { z } from 'zod';
import { SCIMTools } from '../../tools/scim.js';

// Command schemas with descriptions
const listUsersSchema = z.object({
  filter: z.string().optional().describe('SCIM filter like userName eq "user@domain.com" or externalId eq "user-123"'),
  startIndex: z.number().optional().describe('Starting index for pagination'),
  count: z.number().optional().describe('Number of results to return')
}).describe('Options for listing SCIM users');

const searchUsersSchema = z.object({
  userName: z.string().optional().describe('Search by user name (UPN)'),
  externalId: z.string().optional().describe('Search by external ID'),
  displayName: z.string().optional().describe('Search by display name'),
  startIndex: z.number().optional().describe('Starting index for pagination'),
  count: z.number().optional().describe('Number of results to return')
}).describe('Options for searching SCIM users');

const listGroupsSchema = z.object({
  filter: z.string().optional().describe('SCIM filter like displayName eq "Admins" or externalId eq "group-123"'),
  startIndex: z.number().optional().describe('Starting index for pagination'),
  count: z.number().optional().describe('Number of results to return')
}).describe('Options for listing SCIM groups');

const searchGroupsSchema = z.object({
  displayName: z.string().optional().describe('Search by group display name'),
  externalId: z.string().optional().describe('Search by external ID'),
  startIndex: z.number().optional().describe('Starting index for pagination'),
  count: z.number().optional().describe('Number of results to return')
}).describe('Options for searching SCIM groups');

// Command implementations
export async function listUsers(options: {
  filter?: string;
  startIndex?: number;
  count?: number;
} = {}) {
  try {
    const params = listUsersSchema.parse(options);
    
    const result = await SCIMTools.listUsers.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to list users');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
    throw error;
  }
}

export async function searchUsers(options: {
  userName?: string;
  externalId?: string;
  displayName?: string;
  startIndex?: number;
  count?: number;
}) {
  try {
    const params = searchUsersSchema.parse(options);
    
    const result = await SCIMTools.searchUsers.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to search users');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
    throw error;
  }
}

export async function listGroups(options: {
  filter?: string;
  startIndex?: number;
  count?: number;
} = {}) {
  try {
    const params = listGroupsSchema.parse(options);
    
    const result = await SCIMTools.listGroups.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to list groups');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list groups: ${error.message}`);
    }
    throw error;
  }
}

export async function searchGroups(options: {
  displayName?: string;
  externalId?: string;
  startIndex?: number;
  count?: number;
}) {
  try {
    const params = searchGroupsSchema.parse(options);
    
    const result = await SCIMTools.searchGroups.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to search groups');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search groups: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const scimCommands = {
  listUsers: SCIMTools.listUsers,
  searchUsers: SCIMTools.searchUsers,
  listGroups: SCIMTools.listGroups,
  searchGroups: SCIMTools.searchGroups
};
