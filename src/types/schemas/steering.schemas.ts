import * as z from 'zod';

// Request Schemas
export const publisherAssociationRequestSchema = z.object({
  private_app_names: z.array(z.string()).describe('Array of private application names'),
  publisher_ids: z.array(z.string()).describe('Array of publisher IDs')
}).describe('Publisher association request parameters');

// Response Schemas
export const publisherAssociationResponseSchema = z.object({
  status: z.enum(['success', 'error']).describe('Response status'),
  data: z.object({
    private_app_ids: z.array(z.string()).describe('Updated private application IDs'),
    publisher_ids: z.array(z.string()).describe('Updated publisher IDs')
  }).describe('Publisher association result')
}).describe('Response when updating publisher associations');

// Type Exports
export type PublisherAssociationRequest = z.infer<typeof publisherAssociationRequestSchema>;
export type PublisherAssociationResponse = z.infer<typeof publisherAssociationResponseSchema>;
