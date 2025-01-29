import * as z from 'zod';

// Core Type Schemas
export const resourceTypeSchema = z.enum([
  'publisher',         // Publisher resource type
  'private_app',      // Private application resource type
  'policy',           // Policy resource type
  'policy_group',     // Policy group resource type
  'upgrade_profile'   // Upgrade profile resource type
] as const).describe('Types of resources that can be validated');

export const tagTypeSchema = z.enum([
  'publisher',        // Publisher tag type
  'private_app'       // Private application tag type
] as const).describe('Types of resources that can be tagged');

// Request Schemas
export const resourceValidationRequestSchema = z.object({
  name: z.string().describe('Name to validate'),
  tag_type: tagTypeSchema.optional().describe('Optional tag type for tag name validation')
}).describe('Request to validate a resource name');

export const searchResourcesRequestSchema = z.object({
  resourceType: z.enum(['publishers', 'private_apps']).describe('Type of resource to search'),
  query: z.string().describe('Search query string'),
  limit: z.number().optional().describe('Maximum number of results to return'),
  offset: z.number().optional().describe('Number of results to skip')
}).describe('Request to search for resources');

// Response Schemas
export const validateNameResponseSchema = z.object({
  status: z.enum(['success', 'error']).describe('Response status'),
  data: z.object({
    valid: z.boolean().describe('Whether the name is valid'),
    message: z.string().optional().describe('Optional validation message')
  }).describe('Validation result')
}).describe('Response when validating a name');

export const resourceValidationResponseSchema = z.object({
  status: z.enum(['success', 'error']).describe('Response status'),
  data: z.object({
    valid: z.boolean().describe('Whether the resource is valid'),
    errors: z.array(z.string()).optional().describe('Optional validation errors')
  }).describe('Validation result')
}).describe('Response when validating a resource');

export const searchResourcesResponseSchema = z.object({
  status: z.enum(['success', 'error']).describe('Response status'),
  data: z.array(z.object({
    id: z.string().or(z.number()).describe('Resource identifier'),
    name: z.string().describe('Resource name'),
    type: z.string().describe('Resource type'),
    metadata: z.record(z.unknown()).optional().describe('Additional resource metadata')
  })).describe('Search results'),
  total: z.number().describe('Total number of matching results')
}).describe('Response when searching for resources');

// Type Exports
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type TagType = z.infer<typeof tagTypeSchema>;
export type ResourceValidationRequest = z.infer<typeof resourceValidationRequestSchema>;
export type ValidateNameResponse = z.infer<typeof validateNameResponseSchema>;
export type ResourceValidationResponse = z.infer<typeof resourceValidationResponseSchema>;
export type SearchResourcesRequest = z.infer<typeof searchResourcesRequestSchema>;
export type SearchResourcesResponse = z.infer<typeof searchResourcesResponseSchema>;
