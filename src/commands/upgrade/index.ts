import { z } from 'zod';
import { UpgradeProfileTools } from '../../tools/upgrade-profiles.js';
import { 
  upgradeProfilePostRequestSchema, 
  upgradeProfilePutRequestSchema
} from '../../types/schemas/upgrade-profiles.schemas.js';

// Command implementations
export async function listUpgradeProfiles() {
  try {
    const result = await UpgradeProfileTools.list.handler();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list upgrade profiles: ${error.message}`);
    }
    throw error;
  }
}

export async function getUpgradeProfile(id: number) {
  try {
    const result = await UpgradeProfileTools.get.handler({ id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get upgrade profile: ${error.message}`);
    }
    throw error;
  }
}

export async function createUpgradeProfile(params: z.infer<typeof upgradeProfilePostRequestSchema>) {
  try {
    const result = await UpgradeProfileTools.create.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create upgrade profile: ${error.message}`);
    }
    throw error;
  }
}

export async function updateUpgradeProfile(params: z.infer<typeof upgradeProfilePutRequestSchema>) {
  try {
    const result = await UpgradeProfileTools.update.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update upgrade profile: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteUpgradeProfile(id: number) {
  try {
    const result = await UpgradeProfileTools.delete.handler({ id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete upgrade profile: ${error.message}`);
    }
    throw error;
  }
}

export async function upgradeProfileSchedule(params: { id: number; schedule: string }) {
  try {
    const result = await UpgradeProfileTools.upgradeProfileSchedule.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update upgrade profile schedule: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const upgradeProfileCommands = {
  listUpgradeProfiles: {
    name: 'listUpgradeProfiles',
    schema: UpgradeProfileTools.list.schema,
    handler: listUpgradeProfiles
  },
  getUpgradeProfile: {
    name: 'getUpgradeProfile',
    schema: UpgradeProfileTools.get.schema,
    handler: getUpgradeProfile
  },
  createUpgradeProfile: {
    name: 'createUpgradeProfile',
    schema: upgradeProfilePostRequestSchema,
    handler: createUpgradeProfile
  },
  updateUpgradeProfile: {
    name: 'updateUpgradeProfile',
    schema: upgradeProfilePutRequestSchema,
    handler: updateUpgradeProfile
  },
  deleteUpgradeProfile: {
    name: 'deleteUpgradeProfile',
    schema: UpgradeProfileTools.delete.schema,
    handler: deleteUpgradeProfile
  },
  upgradeProfileSchedule: {
    name: 'upgradeProfileSchedule',
    schema: UpgradeProfileTools.upgradeProfileSchedule.schema,
    handler: upgradeProfileSchedule
  }
};
