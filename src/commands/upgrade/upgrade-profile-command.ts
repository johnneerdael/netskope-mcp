import { ResourceCommand, ResourceHandlers, HandlerResponse } from '../base/resource-command.js';
import { UpgradeProfileTools } from '../../tools/upgrade-profiles.js';
import { 
  UpgradeProfilePostRequest, 
  UpgradeProfilePutRequest,
  UpgradeProfile,
  UpgradeProfileResponse,
  UpgradeProfileListResponse
} from '../../types/schemas/upgrade-profiles.schemas.js';

/**
 * Command implementation for upgrade profile operations
 */
export class UpgradeProfileCommand extends ResourceCommand<
  UpgradeProfile,
  UpgradeProfileListResponse,
  UpgradeProfilePostRequest,
  UpgradeProfilePutRequest
> {
  constructor() {
    // Create handlers with proper type assertions
    const handlers: ResourceHandlers<UpgradeProfile, UpgradeProfilePostRequest, UpgradeProfilePutRequest> = {
      list: {
        handler: async () => {
          const result = await UpgradeProfileTools.list.handler();
          const parsed = JSON.parse(result.content[0].text);
          return {
            content: result.content,
            data: parsed.data
          };
        }
      },
      get: {
        handler: async (params) => {
          if (!params?.id) throw new Error('ID is required');
          const result = await UpgradeProfileTools.get.handler({ id: params.id });
          const parsed = JSON.parse(result.content[0].text);
          return {
            content: result.content,
            data: parsed.data
          };
        }
      },
      create: {
        handler: async (params) => {
          if (!params) throw new Error('Data is required');
          const result = await UpgradeProfileTools.create.handler(params);
          const parsed = JSON.parse(result.content[0].text);
          return {
            content: result.content,
            data: parsed.data
          };
        }
      },
      update: {
        handler: async (params) => {
          if (!params) throw new Error('Data is required');
          const result = await UpgradeProfileTools.update.handler(params);
          const parsed = JSON.parse(result.content[0].text);
          return {
            content: result.content,
            data: parsed.data
          };
        }
      },
      delete: {
        handler: async (params) => {
          if (!params?.id) throw new Error('ID is required');
          const result = await UpgradeProfileTools.delete.handler({ id: params.id });
          const parsed = JSON.parse(result.content[0].text);
          return {
            content: result.content,
            data: parsed.data
          };
        }
      }
    };

    super(
      'Upgrade Profile',
      handlers,
      {
        matchField: 'id',
        caseSensitive: false,
        throwOnNotFound: true
      }
    );
  }

  /**
   * Extract list data from response
   */
  protected extractListData(response: UpgradeProfileListResponse): UpgradeProfile[] {
    return response.data.upgrade_profiles;
  }

  /**
   * Helper method to convert human-readable schedule to cron format
   */
  private convertToCron(schedule: string): string {
    // If already in cron format, validate and return
    if (schedule.includes('*')) {
      if (!/^[0-9*]+ [0-9*]+ [*] [*] [A-Z]+$/.test(schedule)) {
        throw new Error('Invalid cron format. Expected: minute hour * * DAY_OF_WEEK');
      }
      return schedule;
    }

    // Parse human-readable format (e.g., "TUE 10:00")
    const parts = schedule.split(' ');
    if (parts.length !== 2) {
      throw new Error('Invalid schedule format. Expected: "DAY HH:MM" or cron format');
    }

    const [day, time] = parts;
    const timeParts = time.split(':');
    if (timeParts.length !== 2) {
      throw new Error('Invalid time format. Expected: HH:MM');
    }

    const [hour, minute] = timeParts;
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);

    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      throw new Error('Hour must be between 0 and 23');
    }
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      throw new Error('Minute must be between 0 and 59');
    }

    // Validate day format
    const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const upperDay = day.toUpperCase();
    if (!validDays.includes(upperDay)) {
      throw new Error('Invalid day format. Must be SUN-SAT');
    }

    return `${minuteNum} ${hourNum} * * ${upperDay}`;
  }

  /**
   * Creates a new upgrade profile with schedule handling
   */
  async createWithSchedule(
    name: string,
    schedule: string,
    options: Partial<Omit<UpgradeProfilePostRequest, 'name' | 'frequency'>> = {}
  ): Promise<UpgradeProfile> {
    const frequency = this.convertToCron(schedule);

    const createData: UpgradeProfilePostRequest = {
      name,
      frequency,
      enabled: options.enabled ?? true,
      docker_tag: options.docker_tag ?? 'latest',
      timezone: options.timezone ?? 'US/Pacific',
      release_type: options.release_type ?? 'Beta'
    };

    return super.create(createData);
  }

  /**
   * Updates an upgrade profile's schedule
   */
  async updateSchedule(
    identifier: string | number,
    schedule: string
  ): Promise<UpgradeProfile> {
    const frequency = this.convertToCron(schedule);

    // Get existing profile to ensure we have all required fields
    const profile = await super.get(identifier);
    
    const updateData: UpgradeProfilePutRequest = {
      id: typeof identifier === 'string' ? parseInt(identifier, 10) : identifier,
      name: profile.name,
      docker_tag: profile.docker_tag,
      enabled: profile.enabled,
      frequency,
      timezone: profile.timezone,
      release_type: profile.release_type
    };

    return super.update(identifier, updateData);
  }
}
