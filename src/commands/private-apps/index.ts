import { z } from 'zod';
import { PrivateAppsTools } from '../../tools/private-apps.js';
import {
  privateAppRequestSchema,
  privateAppUpdateRequestSchema,
  Protocol,
  TagNoId
} from '../../types/schemas/private-apps.schemas.js';

// Command schemas with descriptions
const createPrivateAppSchema = privateAppRequestSchema;
const updatePrivateAppSchema = privateAppUpdateRequestSchema;
const privateAppIdSchema = z.object({
  id: z.string().describe('Unique identifier of the private app')
});
const listPrivateAppsSchema = z.object({
  limit: z.number().optional().describe('Maximum number of apps to return'),
  offset: z.number().optional().describe('Number of apps to skip'),
  filter: z.string().optional().describe('Filter expression'),
  query: z.string().optional().describe('Search query')
}).describe('Options for listing private apps');

const listTagsSchema = z.object({
  query: z.string().optional().describe('Search query for tags'),
  limit: z.number().optional().describe('Maximum number of tags to return'),
  offset: z.number().optional().describe('Number of tags to skip')
}).describe('Options for listing private app tags');

const createTagsSchema = z.object({
  id: z.string().describe('Private app ID'),
  tags: z.array(z.object({
    tag_name: z.string().describe('Name of the tag')
  })).describe('Array of tags to create')
}).describe('Create tags for a private app');

const updateTagsSchema = z.object({
  ids: z.array(z.string()).describe('Array of private app IDs'),
  tags: z.array(z.object({
    tag_name: z.string().describe('Name of the tag')
  })).describe('Array of tags to update')
}).describe('Update tags for multiple private apps');

const updatePublishersSchema = z.object({
  private_app_ids: z.array(z.string()).describe('Array of private app IDs'),
  publisher_ids: z.array(z.string()).describe('Array of publisher IDs')
}).describe('Update publisher associations');

const getPolicyInUseSchema = z.object({
  ids: z.array(z.string()).describe('Array of private app IDs')
}).describe('Get policy in use for private apps');

// Command implementations
export async function createPrivateApp(
  name: string,
  host: string,
  protocol: Protocol,
  port: string | number
) {
  try {
    const params = createPrivateAppSchema.parse({
      app_name: name,
      host,
      protocols: [{
        port: typeof port === 'number' ? port.toString() : port,
        type: protocol.type
      }],
      publishers: [],
      clientless_access: false,
      is_user_portal_app: false,
      trust_self_signed_certs: false,
      use_publisher_dns: false
    });

    const result = await PrivateAppsTools.create.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create private app: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePrivateApp(
  id: string,
  name: string,
  enabled: boolean = true
) {
  try {
    // Get existing app first
    const existingResult = await PrivateAppsTools.get.handler({ id });
    const existingData = JSON.parse(existingResult.content[0].text).data;

    const params = updatePrivateAppSchema.parse({
      ...existingData,
      id: parseInt(id, 10),
      app_name: name
    });

    const result = await PrivateAppsTools.update.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app: ${error.message}`);
    }
    throw error;
  }
}

export async function deletePrivateApp(id: string) {
  try {
    const params = privateAppIdSchema.parse({ id });

    const result = await PrivateAppsTools.delete.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to delete private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete private app: ${error.message}`);
    }
    throw error;
  }
}

export async function getPrivateApp(id: string) {
  try {
    const params = privateAppIdSchema.parse({ id });

    const result = await PrivateAppsTools.get.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get private app');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get private app: ${error.message}`);
    }
    throw error;
  }
}

export async function listPrivateApps(options: {
  limit?: number;
  offset?: number;
  filter?: string;
  query?: string;
} = {}) {
  try {
    const params = listPrivateAppsSchema.parse(options);

    const result = await PrivateAppsTools.list.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to list private apps');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list private apps: ${error.message}`);
    }
    throw error;
  }
}

export async function listPrivateAppTags(options: {
  query?: string;
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const params = listTagsSchema.parse(options);

    const result = await PrivateAppsTools.getTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to list private app tags');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list private app tags: ${error.message}`);
    }
    throw error;
  }
}

export async function createPrivateAppTags(appId: string, tagNames: string[]) {
  try {
    const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
    const params = createTagsSchema.parse({
      id: appId,
      tags
    });

    const result = await PrivateAppsTools.createTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create private app tags');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create private app tags: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePrivateAppTags(appIds: string[], tagNames: string[]) {
  try {
    const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
    const params = updateTagsSchema.parse({
      ids: appIds,
      tags
    });

    const result = await PrivateAppsTools.updateTags.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update private app tags');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app tags: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePrivateAppPublishers(appIds: string[], publisherIds: string[]) {
  try {
    const params = updatePublishersSchema.parse({
      private_app_ids: appIds,
      publisher_ids: publisherIds
    });

    const result = await PrivateAppsTools.updatePublishers.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to update private app publishers');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update private app publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function removePrivateAppPublishers(appIds: string[], publisherIds: string[]) {
  try {
    const params = updatePublishersSchema.parse({
      private_app_ids: appIds,
      publisher_ids: publisherIds
    });

    const result = await PrivateAppsTools.deletePublishers.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to remove private app publishers');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove private app publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function getDiscoverySettings() {
  try {
    const result = await PrivateAppsTools.getDiscoverySettings.handler({});
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get discovery settings');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get discovery settings: ${error.message}`);
    }
    throw error;
  }
}

export async function getPolicyInUse(ids: string[]) {
  try {
    const params = getPolicyInUseSchema.parse({ ids });

    const result = await PrivateAppsTools.getPolicyInUse.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to get policy in use');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get policy in use: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const privateAppCommands = {
  createPrivateApp: {
    name: 'createPrivateApp',
    schema: createPrivateAppSchema,
    handler: createPrivateApp
  },
  updatePrivateApp: {
    name: 'updatePrivateApp',
    schema: updatePrivateAppSchema,
    handler: updatePrivateApp
  },
  deletePrivateApp: {
    name: 'deletePrivateApp',
    schema: privateAppIdSchema,
    handler: deletePrivateApp
  },
  getPrivateApp: {
    name: 'getPrivateApp',
    schema: privateAppIdSchema,
    handler: getPrivateApp
  },
  listPrivateApps: {
    name: 'listPrivateApps',
    schema: listPrivateAppsSchema,
    handler: listPrivateApps
  },
  listPrivateAppTags: {
    name: 'listPrivateAppTags',
    schema: listTagsSchema,
    handler: listPrivateAppTags
  },
  createPrivateAppTags: {
    name: 'createPrivateAppTags',
    schema: createTagsSchema,
    handler: createPrivateAppTags
  },
  updatePrivateAppTags: {
    name: 'updatePrivateAppTags',
    schema: updateTagsSchema,
    handler: updatePrivateAppTags
  },
  updatePrivateAppPublishers: {
    name: 'updatePrivateAppPublishers',
    schema: updatePublishersSchema,
    handler: updatePrivateAppPublishers
  },
  removePrivateAppPublishers: {
    name: 'removePrivateAppPublishers',
    schema: updatePublishersSchema,
    handler: removePrivateAppPublishers
  },
  getDiscoverySettings: {
    name: 'getDiscoverySettings',
    schema: z.object({}).describe('Get discovery settings for private applications'),
    handler: getDiscoverySettings
  },
  getPolicyInUse: {
    name: 'getPolicyInUse',
    schema: getPolicyInUseSchema,
    handler: getPolicyInUse
  }
};
