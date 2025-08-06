import * as z from 'zod';
import { tagSchema } from './private-apps.schemas.js';
import { alertEventTypeSchema } from './alerts.schemas.js';
import { releaseTypeSchema } from './common.schemas.js';

// Core Type Schemas
export const caCertsStatusSchema = z.object({
  hashes: z.array(z.string()).describe('Array of certificate hashes'),
  last_modified: z.number().describe('Last modification timestamp')
}).describe('CA certificates status information');

export const assessmentSchema = z.object({
  ca_certs_status: caCertsStatusSchema.describe('Certificate authority status'),
  eee_support: z.boolean().describe('Enhanced encryption engine support'),
  hdd_free: z.string().describe('Available disk space'),
  hdd_total: z.string().describe('Total disk space'),
  ip_address: z.string().describe('Publisher IP address'),
  latency: z.number().describe('Network latency in milliseconds'),
  version: z.string().describe('Publisher software version')
}).describe('Publisher health assessment information');

export const pullNsconfigSchema = z.object({
  orgkey_exist: z.boolean().describe('Organization key exists'),
  orguri_exist: z.boolean().describe('Organization URI exists')
}).describe('Netskope configuration pull status');

export const capabilitiesSchema = z.object({
  DTLS: z.boolean().describe('DTLS protocol support'),
  EEE: z.boolean().describe('Enhanced encryption engine support'),
  auto_upgrade: z.boolean().describe('Automatic upgrade capability'),
  nwa_ba: z.boolean().describe('Network access basic authentication'),
  pull_nsconfig: pullNsconfigSchema.describe('Configuration pull status')
}).describe('Publisher capabilities information');

export const upgradeFailedReasonSchema = z.object({
  detail: z.string().describe('Detailed error message'),
  error_code: z.number().describe('Error code'),
  timestamp: z.number().describe('Failure timestamp'),
  version: z.string().describe('Target version that failed')
}).describe('Information about upgrade failure');

export const upgradeStatusSchema = z.object({
  upstat: z.string().describe('Current upgrade status')
}).describe('Publisher upgrade status');

// Request Schemas
export const publisherPostRequestSchema = z.object({
  name: z.string().describe('Display name for the publisher'),
  lbrokerconnect: z.boolean().optional().describe('Optional local broker connection'),
  publisher_upgrade_profiles_id: z.number().optional().describe('Optional upgrade profile assignment')
}).describe('Request to create a new publisher');

export const publisherPutRequestSchema = z.object({
  id: z.number().describe('Unique identifier of the publisher'),
  name: z.string().describe('New display name'),
  lbrokerconnect: z.boolean().optional().describe('Optional local broker connection'),
  tags: z.array(tagSchema).optional().describe('Optional publisher tags')
}).describe('Request to update a publisher');

export const publisherPatchRequestSchema = z.object({
  name: z.string().optional().describe('Optional display name for the publisher'),
  id: z.number().optional().describe('Optional publisher identifier'),
  lbrokerconnect: z.boolean().optional().describe('Optional local broker connection'),
  publisher_upgrade_profiles_id: z.number().optional().describe('Optional upgrade profile assignment')
}).describe('Request to partially update a publisher');

export const bulkUpgradeRequestSchema = z.object({
  publishers: z.object({
    apply: z.object({
      upgrade_request: z.boolean().describe('Whether to initiate upgrade')
    }).describe('Upgrade action to apply'),
    id: z.array(z.string()).describe('Array of publisher IDs to upgrade')
  }).describe('Publishers to upgrade')
}).describe('Request to upgrade multiple publishers simultaneously');

// Response Schemas
export const publisherSchema = z.object({
  apps_count: z.number().describe('Number of applications using this publisher'),
  assessment: assessmentSchema.describe('Health assessment information'),
  capabilities: capabilitiesSchema.describe('Supported capabilities'),
  common_name: z.string().describe('Common name for identification'),
  connected_apps: z.array(z.string()).describe('List of connected applications'),
  id: z.number().describe('Unique identifier'),
  lbrokerconnect: z.boolean().describe('Local broker connection status'),
  name: z.string().describe('Display name'),
  publisher_upgrade_profiles_id: z.number().describe('Associated upgrade profile ID'),
  registered: z.boolean().describe('Registration status'),
  status: z.enum(['connected', 'not registered']).describe('Connection status'),
  stitcher_id: z.number().describe('Stitcher identifier'),
  sticher_pop: z.string().describe('Stitcher point of presence'),
  upgrade_failed_reason: upgradeFailedReasonSchema.optional().describe('Upgrade failure details if any'),
  upgrade_request: z.boolean().describe('Whether upgrade is requested'),
  upgrade_status: upgradeStatusSchema.describe('Current upgrade status')
}).describe('Publisher details and status');

export const publisherResponseSchema = z.object({
  data: publisherSchema.describe('Publisher information'),
  status: z.enum(['success', 'not found']).describe('Response status')
}).describe('Response when retrieving a publisher');

export const publishersListResponseSchema = z.object({
  data: z.object({
    publishers: z.array(publisherSchema).describe('Array of publishers')
  }).describe('Publisher list data'),
  status: z.enum(['success', 'not found']).describe('Response status'),
  total: z.number().describe('Total number of publishers')
}).describe('Response when listing publishers');

export const publisherBulkResponseSchema = z.object({
  data: z.object({
    publishers: z.array(publisherSchema).describe('Array of updated publishers')
  }).describe('Bulk operation results'),
  status: z.enum(['success', 'not found']).describe('Response status')
}).describe('Response for bulk publisher operations');

// Release Types
export const releaseSchema = z.object({
  docker_tag: z.string().describe('Docker image tag for the release'),
  is_recommended: z.boolean().describe('Whether this is a recommended release'),
  release_type: releaseTypeSchema.describe('Type of release (Beta/Latest/Latest-1/Latest-2)'),
  version: z.string().describe('Release version number')
}).describe('Publisher release information');

export const releasesResponseSchema = z.object({
  data: z.array(releaseSchema).describe('Array of available releases'),
  status: z.enum(['success', 'not found']).describe('Response status')
}).describe('Response when retrieving available releases');

// Type Exports
export type CaCertsStatus = z.infer<typeof caCertsStatusSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type PullNsconfig = z.infer<typeof pullNsconfigSchema>;
export type Capabilities = z.infer<typeof capabilitiesSchema>;
export type UpgradeFailedReason = z.infer<typeof upgradeFailedReasonSchema>;
export type UpgradeStatus = z.infer<typeof upgradeStatusSchema>;
export type PublisherPostRequest = z.infer<typeof publisherPostRequestSchema>;
export type PublisherPutRequest = z.infer<typeof publisherPutRequestSchema>;
export type PublisherPatchRequest = z.infer<typeof publisherPatchRequestSchema>;
export type BulkUpgradeRequest = z.infer<typeof bulkUpgradeRequestSchema>;
export type Publisher = z.infer<typeof publisherSchema>;
export type PublisherResponse = z.infer<typeof publisherResponseSchema>;
export type PublishersListResponse = z.infer<typeof publishersListResponseSchema>;
export type PublisherBulkResponse = z.infer<typeof publisherBulkResponseSchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ReleasesResponse = z.infer<typeof releasesResponseSchema>;
