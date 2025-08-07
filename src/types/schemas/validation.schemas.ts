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

// Type Exports
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type TagType = z.infer<typeof tagTypeSchema>;
export type ResourceValidationRequest = z.infer<typeof resourceValidationRequestSchema>;
export type ValidateNameResponse = z.infer<typeof validateNameResponseSchema>;
export type ResourceValidationResponse = z.infer<typeof resourceValidationResponseSchema>;
