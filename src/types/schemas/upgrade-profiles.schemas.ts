import * as z from 'zod';
import { timezoneSchema, releaseTypeSchema } from './common.schemas.js';

// Request Schemas
export const upgradeProfilePostRequestSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  docker_tag: z.string(),
  frequency: z.string()
    .describe('Cron expression in format "minute hour * * DAY_OF_WEEK" (e.g., "0 2 * * SUN" for Sunday at 2 AM)')
    .refine((value) => {
      try {
        const parts = value.trim().split(' ');
        if (parts.length !== 5) return false;
        const [minute, hour, day, month, dayOfWeek] = parts;
        
        // Check minute (0-59 or *)
        if (minute !== '*' && (isNaN(parseInt(minute)) || parseInt(minute) < 0 || parseInt(minute) > 59)) return false;
        
        // Check hour (0-23 or *)
        if (hour !== '*' && (isNaN(parseInt(hour)) || parseInt(hour) < 0 || parseInt(hour) > 23)) return false;
        
        // Day and month must be *
        if (day !== '*' || month !== '*') return false;
        
        // Check day of week (0-6, SUN-SAT, sun-sat)
        const validDays = ['0', '1', '2', '3', '4', '5', '6', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const upperDayOfWeek = dayOfWeek.toUpperCase();
        return validDays.includes(dayOfWeek) || validDays.includes(upperDayOfWeek);
      } catch {
        return false;
      }
    }, {
      message: 'Must be in cron format: "minute hour * * DAY_OF_WEEK" where DAY_OF_WEEK is SUN-SAT or 0-6. Example: "0 2 * * SUN" for Sunday at 2 AM UTC'
    }),
  timezone: timezoneSchema,
  release_type: releaseTypeSchema
});

export const upgradeProfilePutRequestSchema = z.object({
  id: z.number().describe('External ID (not the internal database ID) - use external_id from the profile response'),
  name: z.string(),
  enabled: z.boolean(),
  docker_tag: z.string(),
  frequency: z.string()
    .describe('Cron expression in format "minute hour * * DAY_OF_WEEK" (e.g., "0 2 * * SUN" for Sunday at 2 AM)')
    .refine((value) => {
      try {
        const parts = value.trim().split(' ');
        if (parts.length !== 5) return false;
        const [minute, hour, day, month, dayOfWeek] = parts;
        
        // Check minute (0-59 or *)
        if (minute !== '*' && (isNaN(parseInt(minute)) || parseInt(minute) < 0 || parseInt(minute) > 59)) return false;
        
        // Check hour (0-23 or *)
        if (hour !== '*' && (isNaN(parseInt(hour)) || parseInt(hour) < 0 || parseInt(hour) > 23)) return false;
        
        // Day and month must be *
        if (day !== '*' || month !== '*') return false;
        
        // Check day of week (0-6, SUN-SAT, sun-sat)
        const validDays = ['0', '1', '2', '3', '4', '5', '6', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const upperDayOfWeek = dayOfWeek.toUpperCase();
        return validDays.includes(dayOfWeek) || validDays.includes(upperDayOfWeek);
      } catch {
        return false;
      }
    }, {
      message: 'Must be in cron format: "minute hour * * DAY_OF_WEEK" where DAY_OF_WEEK is SUN-SAT or 0-6. Example: "0 2 * * SUN" for Sunday at 2 AM UTC'
    }),
  timezone: timezoneSchema,
  release_type: releaseTypeSchema
});

export const bulkProfileUpdateRequestSchema = z.object({
  publishers: z.object({
    apply: z.object({
      publisher_upgrade_profiles_id: z.string().describe('Profile external_id to assign publishers to')
    }).describe('Profile assignment to apply'),
    id: z.array(z.string()).describe('Array of publisher IDs to assign to the profile')
  }).describe('Publishers to assign to upgrade profile')
}).describe('Request to assign multiple publishers to an upgrade profile');

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
