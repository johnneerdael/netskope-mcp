import { PrivateAppsTools } from '../../tools/private-apps.js';

/**
 * Get discovery settings for private applications
 */
export async function getDiscoverySettings() {
  const result = await PrivateAppsTools.getDiscoverySettings.handler({});
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to get discovery settings');
  }
  return response.data;
}

/**
 * Get policy in use for specified private applications
 */
export async function getPolicyInUse(ids: string[]) {
  const result = await PrivateAppsTools.getPolicyInUse.handler({ ids });
  const response = JSON.parse(result.content[0].text);
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to get policy in use');
  }
  return response.data;
}
