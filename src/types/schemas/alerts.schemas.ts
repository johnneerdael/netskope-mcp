import * as z from 'zod';

export const alertEventTypeSchema = z.enum([
  'UPGRADE_WILL_START',   // Notification before a publisher upgrade begins
  'UPGRADE_STARTED',      // Notification when upgrade process initiates
  'UPGRADE_SUCCEEDED',    // Notification upon successful upgrade completion
  'UPGRADE_FAILED',       // Notification if upgrade process fails
  'CONNECTION_FAILED'     // Notification when publisher connection issues occur
]).describe('Types of events that can trigger notifications');

export const alertConfigSchema = z.object({
  adminUsers: z.array(z.string()).describe('Array of admin user emails to receive notifications'),
  eventTypes: z.array(alertEventTypeSchema).describe('Array of event types to monitor'),
  selectedUsers: z.string().describe('Additional users to receive notifications')
}).describe('Alert configuration settings for publishers');

export const alertConfigResponseSchema = z.object({
  data: alertConfigSchema.describe('Current alert configuration settings'),
  status: z.enum(['success', 'not found']).describe('Response status')
}).describe('Response when retrieving alert configuration');

export const alertConfigUpdateResponseSchema = z.object({
  status: z.enum(['success', 'not found', 'failure']).describe('Status of the update operation')
}).describe('Response when updating alert configuration');

export type AlertEventType = z.infer<typeof alertEventTypeSchema>;
export type AlertConfig = z.infer<typeof alertConfigSchema>;
export type AlertConfigResponse = z.infer<typeof alertConfigResponseSchema>;
export type AlertConfigUpdateResponse = z.infer<typeof alertConfigUpdateResponseSchema>;
