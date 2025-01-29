import { PrivateAppsTools } from '../../tools/private-apps.js';

/**
 * Update publisher associations for private apps
 */
export async function updatePrivateAppPublishers(appIds: string[], publisherIds: string[]) {
  const result = await PrivateAppsTools.updatePublishers.handler({
    private_app_ids: appIds,
    publisher_ids: publisherIds
  });
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to update private app publishers');
  }
  return response.data;
}

/**
 * Remove publisher associations from private apps
 */
export async function removePrivateAppPublishers(appIds: string[], publisherIds: string[]) {
  const result = await PrivateAppsTools.deletePublishers.handler({
    private_app_ids: appIds,
    publisher_ids: publisherIds
  });
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to remove private app publishers');
  }
  return response.data;
}
