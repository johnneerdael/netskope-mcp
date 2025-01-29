import * as z from 'zod';
import { timezoneSchema, releaseTypeSchema } from './common.schemas.js';

// Request Schemas
export const upgradeProfilePostRequestSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  docker_tag: z.string(),
  frequency: z.string().regex(/^[0-9*]+ [0-9*]+ [0-9*]+ [*] [A-Z,]+$/, 'Must be in cron format: minute hour day * DAY_OF_WEEK'),
  timezone: timezoneSchema,
  release_type: releaseTypeSchema
});

export const upgradeProfilePutRequestSchema = z.object({
  id: z.number(),
  name: z.string(),
  enabled: z.boolean(),
  docker_tag: z.string(),
  frequency: z.string().regex(/^[0-9*]+ [0-9*]+ [0-9*]+ [*] [A-Z,]+$/, 'Must be in cron format: minute hour day * DAY_OF_WEEK'),
  timezone: timezoneSchema,
  release_type: releaseTypeSchema
});

export const bulkProfileUpdateRequestSchema = z.object({
  publishers: z.object({
    apply: z.object({
      upgrade_request: z.boolean()
    }),
    id: z.array(z.string())
  })
});

// Response Schemas
export const upgradeProfileSchema = z.object({
  id: z.number(),
  external_id: z.number(),
  name: z.string(),
  docker_tag: z.string(),
  enabled: z.boolean(),
  frequency: z.string(),
  timezone: timezoneSchema,
  release_type: releaseTypeSchema,
  created_at: z.string(),
  updated_at: z.string(),
  next_update_time: z.number().optional(),
  num_associated_publisher: z.number().default(0),
  upgrading_stage: z.number().optional(),
  will_start: z.boolean().optional()
});

export const upgradeProfileResponseSchema = z.object({
  data: upgradeProfileSchema,
  status: z.enum(['success', 'not found'])
});

export const upgradeProfileListResponseSchema = z.object({
  data: z.object({
    upgrade_profiles: z.array(upgradeProfileSchema)
  }),
  status: z.enum(['success', 'not found']),
  total: z.number()
});

export const bulkProfileUpdateResponseSchema = z.object({
  data: z.object({
    publishers: z.array(z.object({
      id: z.number(),
      name: z.string(),
      publisher_upgrade_profiles_id: z.number()
    }))
  }),
  status: z.enum(['success', 'not found'])
});

// Type Exports
export type UpgradeProfilePostRequest = z.infer<typeof upgradeProfilePostRequestSchema>;
export type UpgradeProfilePutRequest = z.infer<typeof upgradeProfilePutRequestSchema>;
export type BulkProfileUpdateRequest = z.infer<typeof bulkProfileUpdateRequestSchema>;
export type UpgradeProfile = z.infer<typeof upgradeProfileSchema>;
export type UpgradeProfileResponse = z.infer<typeof upgradeProfileResponseSchema>;
export type UpgradeProfileListResponse = z.infer<typeof upgradeProfileListResponseSchema>;
export type BulkProfileUpdateResponse = z.infer<typeof bulkProfileUpdateResponseSchema>;
