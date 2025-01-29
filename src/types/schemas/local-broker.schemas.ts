import * as z from 'zod';

// Request Schemas
export const localBrokerPostRequestSchema = z.object({
  name: z.string().describe('Name for the new local broker instance')
}).describe('Create a new local broker for handling on-premises ZTNA traffic');

export const localBrokerPutRequestSchema = z.object({
  name: z.string().describe('New name for the local broker')
}).describe('Update an existing local broker\'s configuration');

export const localBrokerConfigPutRequestSchema = z.object({
  hostname: z.string().describe('Global hostname configuration affecting all broker instances')
}).describe('Update global configuration settings for all local brokers');

// Response Schemas
const localBrokerDataSchema = z.object({
  id: z.number().describe('Unique identifier for the local broker'),
  name: z.string().describe('Display name of the local broker'),
  common_name: z.string().describe('Common name used for broker identification'),
  registered: z.boolean().describe('Registration status of the broker')
}).describe('Local broker instance details');

export const localBrokerResponseSchema = z.object({
  status: z.enum(['success', 'not found']).describe('Response status'),
  data: localBrokerDataSchema
}).describe('Response when retrieving a single local broker');

export const localBrokersGetResponseSchema = z.object({
  status: z.enum(['success', 'not found']).describe('Response status'),
  total: z.number().describe('Total number of local brokers'),
  data: z.array(localBrokerDataSchema)
}).describe('Response when listing all local brokers');

export const localBrokerConfigResponseSchema = z.object({
  status: z.enum(['success', 'not found']).describe('Response status'),
  data: z.object({
    hostname: z.string().describe('Global hostname configuration')
  })
}).describe('Response when retrieving local broker configuration');

export const localBrokerResponse400Schema = z.object({
  status: z.number().describe('HTTP status code'),
  result: z.string().describe('Error message')
}).describe('Error response for local broker operations');

export const localBrokerRegistrationTokenResponseSchema = z.object({
  status: z.enum(['success', 'not found']).describe('Response status'),
  data: z.object({
    token: z.string().describe('Generated registration token')
  })
}).describe('Response when generating a registration token');

// Type Exports
export type LocalBrokerPostRequest = z.infer<typeof localBrokerPostRequestSchema>;
export type LocalBrokerPutRequest = z.infer<typeof localBrokerPutRequestSchema>;
export type LocalBrokerConfigPutRequest = z.infer<typeof localBrokerConfigPutRequestSchema>;
export type LocalBrokerResponse = z.infer<typeof localBrokerResponseSchema>;
export type LocalBrokersGetResponse = z.infer<typeof localBrokersGetResponseSchema>;
export type LocalBrokerConfigResponse = z.infer<typeof localBrokerConfigResponseSchema>;
export type LocalBrokerResponse400 = z.infer<typeof localBrokerResponse400Schema>;
export type LocalBrokerRegistrationTokenResponse = z.infer<typeof localBrokerRegistrationTokenResponseSchema>;
