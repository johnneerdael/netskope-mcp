import * as z from 'zod';

// Request Schemas
export const publisherAssociationRequestSchema = z.object({
  private_app_ids: z.array(z.string()).describe('Array of private application IDs'),
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

export const userDiagnosticsSchema = z.object({
  status: z.enum(['success', 'error']).describe('Response status'),
  data: z.object({
    user_id: z.string().describe('User identifier'),
    diagnostics: z.array(z.object({
      private_app_id: z.string().describe('Private application ID'),
      private_app_name: z.string().describe('Private application name'),
      publisher_id: z.string().describe('Publisher ID'),
      publisher_name: z.string().describe('Publisher name'),
      status: z.string().describe('Connection status'),
      timestamp: z.string().describe('Event timestamp')
    }).describe('Diagnostic event details'))
  }).describe('User diagnostic information')
}).describe('Response when retrieving user diagnostics');

export const deviceDiagnosticsSchema = z.object({
  status: z.enum(['success', 'error']).describe('Response status'),
  data: z.object({
    device_id: z.string().describe('Device identifier'),
    private_app_id: z.string().describe('Private application ID'),
    diagnostics: z.array(z.object({
      publisher_id: z.string().describe('Publisher ID'),
      publisher_name: z.string().describe('Publisher name'),
      status: z.string().describe('Connection status'),
      timestamp: z.string().describe('Event timestamp')
    }).describe('Diagnostic event details'))
  }).describe('Device diagnostic information')
}).describe('Response when retrieving device diagnostics');

// Type Exports
export type PublisherAssociationRequest = z.infer<typeof publisherAssociationRequestSchema>;
export type PublisherAssociationResponse = z.infer<typeof publisherAssociationResponseSchema>;
export type UserDiagnostics = z.infer<typeof userDiagnosticsSchema>;
export type DeviceDiagnostics = z.infer<typeof deviceDiagnosticsSchema>;
