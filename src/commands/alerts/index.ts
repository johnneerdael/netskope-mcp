import { z } from 'zod';
import { AlertsTools } from '../../tools/alerts.js';
import { alertConfigSchema } from '../../types/schemas/alerts.schemas.js';

// Command implementations
export async function getAlertConfig() {
  try {
    const result = await AlertsTools.getConfig.handler();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get alert config: ${error.message}`);
    }
    throw error;
  }
}

export async function updateAlertConfig(params: z.infer<typeof alertConfigSchema>) {
  try {
    const result = await AlertsTools.updateConfig.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update alert config: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const alertCommands = {
  getAlertConfig: {
    name: 'getAlertConfig',
    schema: AlertsTools.getConfig.schema,
    handler: getAlertConfig
  },
  updateAlertConfig: {
    name: 'updateAlertConfig',
    schema: AlertsTools.updateConfig.schema,
    handler: updateAlertConfig
  }
};
