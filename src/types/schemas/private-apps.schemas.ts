import * as z from 'zod';

// Port validation helpers
const isValidPortNumber = (port: number) => port >= 1 && port <= 65535;

const parsePortRange = (range: string): [number, number] => {
  const [start, end] = range.split('-').map(Number);
  return [start, end];
};

const validatePortRange = (range: [number, number]): boolean => {
  const [start, end] = range;
  return isValidPortNumber(start) && isValidPortNumber(end) && start < end;
};

const hasOverlappingRanges = (ranges: Array<[number, number]>): boolean => {
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const [start1, end1] = ranges[i];
      const [start2, end2] = ranges[j];
      if ((start1 <= end2 && end1 >= start2) || (start2 <= end1 && end2 >= start1)) {
        return true;
      }
    }
  }
  return false;
};

const hasDuplicatePorts = (ports: number[]): boolean => {
  return new Set(ports).size !== ports.length;
};

// Port schema with comprehensive validation
export const portSchema = z.string()
  .regex(/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/, 'Invalid port format. Use single port (80), range (8000-8080), or comma-separated list (80,443,8000-8080)')
  .refine((value) => {
    const parts = value.split(',');
    const singlePorts: number[] = [];
    const ranges: Array<[number, number]> = [];

    for (const part of parts) {
      if (part.includes('-')) {
        const range = parsePortRange(part);
        if (!validatePortRange(range)) {
          throw new Error(`Invalid port range: ${part}. Ensure start < end and ports are between 1-65535`);
        }
        ranges.push(range);
      } else {
        const port = Number(part);
        if (!isValidPortNumber(port)) {
          throw new Error(`Invalid port number: ${port}. Must be between 1-65535`);
        }
        singlePorts.push(port);
      }
    }

    if (hasDuplicatePorts(singlePorts)) {
      throw new Error('Duplicate ports are not allowed');
    }

    if (hasOverlappingRanges(ranges)) {
      throw new Error('Overlapping port ranges are not allowed');
    }

    return true;
  }, 'Invalid port configuration')
  .describe('Port specification supporting single ports, ranges, and lists');

export const protocolSchema = z.object({
  port: portSchema,
  type: z.enum(['tcp', 'udp', 'http', 'https', 'rdp', 'ssh']).describe('Protocol type (TCP/UDP for client apps, HTTP/HTTPS/RDP/SSH for clientless apps)')
}).describe('Network protocol configuration for private applications');

export const protocolResponseSchema = z.object({
  created_at: z.string().describe('Creation timestamp'),
  updated_at: z.string().describe('Update timestamp'),
  id: z.number().describe('Protocol entry ID'),
  port: z.string().describe('Configured port number'),
  service_id: z.number().describe('Service ID'),
  transport: z.string().describe('Transport protocol type')
}).describe('Protocol configuration in API responses');

export const tagSchema = z.object({
  tag_id: z.number().describe('Unique identifier for the tag'),
  tag_name: z.string().describe('Display name of the tag')
}).describe('Tag with identifier');

export const tagNoIdSchema = z.object({
  tag_name: z.string().describe('Display name for the tag')
}).describe('Tag without identifier for creation requests');

export const publisherItemSchema = z.object({
  publisher_id: z.string().describe('Unique identifier of the publisher'),
  publisher_name: z.string().optional().describe('Display name of the publisher (optional)')
}).describe('Publisher reference for private app configuration');

export const publisherItemCreateSchema = z.object({
  publisher_id: z.string().describe('Unique identifier of the publisher')
}).describe('Publisher reference for creating private applications (ID only)');

export const servicePublisherAssignmentSchema = z.object({
  primary: z.boolean().describe('Whether this is the primary publisher'),
  publisher_id: z.number().describe('Publisher identifier'),
  publisher_name: z.string().describe('Publisher display name'),
  reachability: z.object({
    error_code: z.number().describe('Error code if unreachable'),
    error_string: z.string().describe('Error description'),
    reachable: z.boolean().describe('Whether publisher is reachable')
  }).describe('Publisher reachability status'),
  service_id: z.number().describe('Service identifier')
}).describe('Publisher assignment for a private application service');

export const reachabilitySchema = z.object({
  reachable: z.boolean().describe('Whether the application is reachable')
}).describe('Application reachability status');

export const privateAppRequestSchema = z.object({
  app_name: z.string().describe('Name of the private application'),
  app_type: z.enum(['clientless', 'client']).optional().describe('Application type - defaults to client for backward compatibility'),
  host: z.union([
    z.string(),
    z.array(z.string())
  ]).describe('Host address(es) of the application - can be a single string or array of strings'),
  clientless_access: z.boolean().describe('Enable clientless access'),
  is_user_portal_app: z.boolean().describe('Show in user portal'),
  protocols: z.array(protocolSchema).describe('Network protocols configuration - supports both TCP/UDP and browser protocols'),
  publisher_tags: z.array(tagNoIdSchema).optional().describe('Optional publisher tags'),
  publishers: z.array(publisherItemCreateSchema).optional().describe('Associated publishers (optional)'),
  trust_self_signed_certs: z.boolean().optional().describe('Trust self-signed certificates'),
  use_publisher_dns: z.boolean().describe('Use publisher DNS'),
  allow_unauthenticated_cors: z.boolean().optional().describe('Optional CORS settings'),
  allow_uri_bypass: z.boolean().optional().describe('Optional URI bypass'),
  bypass_uris: z.array(z.string()).optional().describe('Optional bypass URIs'),
  real_host: z.string().optional().describe('Optional real host'),
  app_option: z.record(z.unknown()).optional().describe('Additional options'),
  tags: z.array(tagNoIdSchema).optional().describe('Optional tags for the application'),
  private_app_tags: z.array(tagNoIdSchema).optional().describe('Optional private app tags'),
  hostType: z.enum(['http', 'https']).optional().describe('Host type for clientless apps'),
  isSelfSignedCert: z.boolean().optional().describe('Whether to trust self-signed certificates'),
  isUserPortalApp: z.boolean().optional().describe('Whether to show in user portal')
}).describe('Request to create a new private application');

export const privateAppUpdateRequestSchema = privateAppRequestSchema.extend({
  id: z.number().describe('Unique identifier of the private application to update')
}).describe('Request to update an existing private application');

export const privateAppResponseSchema = z.object({
  data: z.object({
    allow_unauthenticated_cors: z.boolean().describe('CORS authentication settings'),
    allow_uri_bypass: z.boolean().describe('URI bypass settings'),
    uribypass_header_value: z.string().describe('Header value for URI bypass'),
    bypass_uris: z.array(z.string()).describe('URIs that bypass authentication'),
    app_id: z.number().describe('Application ID'),
    app_name: z.string().describe('Application name with brackets'),
    app_option: z.record(z.unknown()).describe('Additional application options'),
    clientless_access: z.boolean().describe('Clientless access enabled status'),
    host: z.string().describe('Application host address'),
    id: z.number().describe('Unique identifier for the application'),
    is_user_portal_app: z.boolean().describe('User portal visibility status'),
    modified_by: z.string().describe('Last modified by user'),
    modify_time: z.string().describe('Last modification timestamp'),
    name: z.string().describe('Application display name'),
    policies: z.array(z.unknown()).describe('Associated policies'),
    private_app_protocol: z.string().describe('Private app protocol'),
    protocols: z.array(protocolResponseSchema).describe('Configured protocols'),
    public_host: z.string().optional().describe('Public host URL'),
    reachability: reachabilitySchema.describe('Application reachability status'),
    real_host: z.string().optional().describe('Real host address if different'),
    service_publisher_assignments: z.array(servicePublisherAssignmentSchema).describe('Publisher assignments'),
    steering_configs: z.array(z.string()).describe('Steering configuration names'),
    supplement_dns_for_osx: z.boolean().describe('DNS supplementation for OSX'),
    tags: z.array(tagSchema).describe('Associated tags'),
    trust_self_signed_certs: z.boolean().nullable().describe('Self-signed certificate trust status'),
    use_publisher_dns: z.boolean().describe('Publisher DNS usage status')
  }).describe('Private application details'),
  status: z.enum(['success', 'not found']).describe('Response status')
}).describe('Response when retrieving a private application');

export const privateAppsListResponseSchema = z.object({
  data: z.array(z.object({
    allow_unauthenticated_cors: z.boolean().describe('CORS authentication settings'),
    allow_uri_bypass: z.boolean().describe('URI bypass settings'),
    uribypass_header_value: z.string().describe('Header value for URI bypass'),
    bypass_uris: z.array(z.string()).describe('URIs that bypass authentication'),
    app_id: z.number().describe('Unique identifier for the application'),
    app_name: z.string().describe('Application display name'),
    app_option: z.record(z.unknown()).describe('Additional application options'),
    clientless_access: z.boolean().describe('Clientless access enabled status'),
    host: z.string().describe('Application host address'),
    is_user_portal_app: z.boolean().describe('User portal visibility status'),
    protocols: z.array(protocolResponseSchema).describe('Configured protocols'),
    real_host: z.string().describe('Real host address if different'),
    service_publisher_assignments: z.array(servicePublisherAssignmentSchema).describe('Publisher assignments'),
    tags: z.array(tagSchema).describe('Associated tags'),
    trust_self_signed_certs: z.boolean().describe('Self-signed certificate trust status'),
    use_publisher_dns: z.boolean().describe('Publisher DNS usage status')
  }).describe('Private application details')),
  status: z.enum(['success', 'not found']).describe('Response status'),
  total: z.number().describe('Total number of applications')
}).describe('Response when listing private applications');

export const privateAppPublisherRequestSchema = z.object({
  private_app_names: z.array(z.string()).describe('Array of private application names'),
  publisher_ids: z.array(z.string()).describe('Array of publisher IDs')
}).describe('Request to update publisher associations');

export const errorResponseSchema = z.object({
  result: z.string().describe('Error message'),
  status: z.number().describe('HTTP status code')
}).describe('Error response for private app operations');

export type Protocol = z.infer<typeof protocolSchema>;
export type ProtocolResponse = z.infer<typeof protocolResponseSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type TagNoId = z.infer<typeof tagNoIdSchema>;
export type PublisherItem = z.infer<typeof publisherItemSchema>;
export type PublisherItemCreate = z.infer<typeof publisherItemCreateSchema>;
export type ServicePublisherAssignment = z.infer<typeof servicePublisherAssignmentSchema>;
export type PrivateAppRequest = z.infer<typeof privateAppRequestSchema>;
export type PrivateAppUpdateRequest = z.infer<typeof privateAppUpdateRequestSchema>;
export type PrivateAppResponse = z.infer<typeof privateAppResponseSchema>;
export type PrivateAppsListResponse = z.infer<typeof privateAppsListResponseSchema>;
export type PrivateAppPublisherRequest = z.infer<typeof privateAppPublisherRequestSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Smart Delete Schemas
export const smartDeleteOptionsSchema = z.object({
  force: z.boolean().optional().default(false).describe('Force deletion even if policy dependencies exist'),
  cleanupOrphanedPolicies: z.boolean().optional().default(true).describe('Automatically clean up orphaned policies'),
  dryRun: z.boolean().optional().default(false).describe('Preview changes without executing them')
}).describe('Options for smart deletion of private applications');

export const policyDependencyAnalysisSchema = z.object({
  hasDirectReferences: z.boolean().describe('Whether app is directly referenced in policies'),
  hasTagBasedReferences: z.boolean().describe('Whether app is referenced through tags in policies'),
  affectedPolicies: z.array(z.object({
    policyId: z.string().describe('Policy unique identifier'),
    policyName: z.string().describe('Policy display name'),
    referenceType: z.enum(['direct', 'tag', 'mixed']).describe('How the app is referenced in this policy'),
    canSafelyRemove: z.boolean().describe('Whether app can be safely removed from this policy'),
    requiresManualCleanup: z.boolean().describe('Whether manual intervention is needed for cleanup')
  })).describe('List of policies that reference the application')
}).describe('Analysis of policy dependencies for a private application');

export const deletionValidationResultSchema = z.object({
  isValid: z.boolean().describe('Whether the deletion is safe to proceed'),
  warnings: z.array(z.string()).describe('Non-blocking warnings about the deletion'),
  blockers: z.array(z.string()).describe('Issues that prevent safe deletion'),
  recommendations: z.array(z.string()).describe('Recommended actions before deletion')
}).describe('Validation result for private app deletion safety');

export const smartDeleteResultSchema = z.object({
  success: z.boolean().describe('Whether the deletion was successful'),
  appId: z.string().describe('ID of the deleted application'),
  appName: z.string().describe('Name of the deleted application'),
  cleanedPolicies: z.array(z.object({
    policyId: z.string().describe('Policy ID that was cleaned'),
    policyName: z.string().describe('Policy name that was cleaned'),
    action: z.enum(['updated', 'deleted']).describe('Action taken on the policy')
  })).describe('Policies that were cleaned up during deletion'),
  dryRunPreview: z.object({
    wouldDeleteApp: z.boolean().describe('Whether the app would be deleted'),
    wouldCleanupPolicies: z.array(z.string()).describe('Policies that would be cleaned up'),
    warnings: z.array(z.string()).describe('Warnings for the planned actions')
  }).optional().describe('Preview of actions that would be taken (dry run mode only)')
}).describe('Result of smart delete operation');

export const privateAppIdSchema = z.object({
  id: z.string().describe('Unique identifier of the private application')
}).describe('Schema for private app ID parameter');

// Type exports for smart delete functionality
export type SmartDeleteOptions = z.infer<typeof smartDeleteOptionsSchema>;
export type PolicyDependencyAnalysis = z.infer<typeof policyDependencyAnalysisSchema>;
export type DeletionValidationResult = z.infer<typeof deletionValidationResultSchema>;
export type SmartDeleteResult = z.infer<typeof smartDeleteResultSchema>;
export type PrivateAppId = z.infer<typeof privateAppIdSchema>;
