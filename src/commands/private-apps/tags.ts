import { PrivateAppsTools } from '../../tools/private-apps.js';
import { TagNoId } from '../../types/schemas/private-apps.schemas.js';

/**
 * List private app tags with optional filtering
 */
export async function listPrivateAppTags(options: {
  query?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const result = await PrivateAppsTools.getTags.handler(options);
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to list private app tags');
  }
  return response.data;
}

/**
 * Create tags for a private app
 */
export async function createPrivateAppTags(appId: string, tagNames: string[]) {
  const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
  const result = await PrivateAppsTools.createTags.handler({
    id: appId,
    tags
  });
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to create private app tags');
  }
  return response.data;
}

/**
 * Update tags for multiple private apps
 */
export async function updatePrivateAppTags(appIds: string[], tagNames: string[]) {
  const tags: TagNoId[] = tagNames.map(name => ({ tag_name: name }));
  const result = await PrivateAppsTools.updateTags.handler({
    ids: appIds,
    tags
  });
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to update private app tags');
  }
  return response.data;
}
