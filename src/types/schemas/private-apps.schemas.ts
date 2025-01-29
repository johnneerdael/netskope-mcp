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
  type: z.enum(['tcp', 'udp']).describe('Protocol type (TCP or UDP)')
}).describe('Network protocol configuration for private applications');

export const protocolResponseSchema = z.object({
  ports: z.array(z.string()).describe('Array of configured port numbers'),
  type: z.string().describe('Protocol type')
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
  publisher_name: z.string().describe('Display name of the publisher')
}).describe('Publisher reference for private app configuration');

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

export const privateAppRequestSchema = z.object({
  app_name: z.string().describe('Name of the private application'),
  host: z.string().describe('Host address of the application'),
  clientless_access: z.boolean().describe('Enable clientless access'),
  is_user_portal_app: z.boolean().describe('Show in user portal'),
  protocols: z.array(protocolSchema).describe('Network protocols configuration'),
  publisher_tags: z.array(tagNoIdSchema).optional().describe('Optional publisher tags'),
  publishers: z.array(publisherItemSchema).describe('Associated publishers'),
  trust_self_signed_certs: z.boolean().describe('Trust self-signed certificates'),
  use_publisher_dns: z.boolean().describe('Use publisher DNS'),
  allow_unauthenticated_cors: z.boolean().optional().describe('Optional CORS settings'),
  allow_uri_bypass: z.boolean().optional().describe('Optional URI bypass'),
  bypass_uris: z.array(z.string()).optional().describe('Optional bypass URIs'),
  real_host: z.string().optional().describe('Optional real host'),
  app_option: z.record(z.unknown()).optional().describe('Additional options')
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
    app_option: z.record(z.unknown()).describe('Additional application options'),
    clientless_access: z.boolean().describe('Clientless access enabled status'),
    host: z.string().describe('Application host address'),
    id: z.number().describe('Unique identifier for the application'),
    is_user_portal_app: z.boolean().describe('User portal visibility status'),
    name: z.string().describe('Application display name'),
    protocols: z.array(protocolResponseSchema).describe('Configured protocols'),
    real_host: z.string().describe('Real host address if different'),
    service_publisher_assignments: z.array(servicePublisherAssignmentSchema).describe('Publisher assignments'),
    tags: z.array(tagSchema).describe('Associated tags'),
    trust_self_signed_certs: z.boolean().describe('Self-signed certificate trust status'),
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
  private_app_ids: z.array(z.string()).describe('Array of private application IDs'),
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
export type ServicePublisherAssignment = z.infer<typeof servicePublisherAssignmentSchema>;
export type PrivateAppRequest = z.infer<typeof privateAppRequestSchema>;
export type PrivateAppUpdateRequest = z.infer<typeof privateAppUpdateRequestSchema>;
export type PrivateAppResponse = z.infer<typeof privateAppResponseSchema>;
export type PrivateAppsListResponse = z.infer<typeof privateAppsListResponseSchema>;
export type PrivateAppPublisherRequest = z.infer<typeof privateAppPublisherRequestSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
