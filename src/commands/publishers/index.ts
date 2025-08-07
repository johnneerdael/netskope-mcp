import { z } from 'zod';
import { PublishersTools } from '../../tools/publishers.js';
import { 
  publisherPostRequestSchema, 
  publisherPutRequestSchema,
  publisherPatchRequestSchema,
  bulkUpgradeRequestSchema
} from '../../types/schemas/publisher.schemas.js';
import * as fs from 'fs';
import * as path from 'path';

// Debug logging function
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] COMMAND: ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`;
  const logPath = path.join(process.cwd(), 'debug.log');
  
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Failed to write to debug.log:', error);
  }
}

// Command implementations
export async function listPublishers(params: { fields?: string } = {}) {
  try {
    const result = await PublishersTools.list.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function getPublisher({ id }: { id: number }) {
  debugLog('getPublisher command called', { id, typeOfId: typeof id });
  
  try {
    const result = await PublishersTools.get.handler({ id });
    debugLog('getPublisher command successful', { resultStatus: result?.content?.[0]?.text ? 'has content' : 'no content' });
    return result;
  } catch (error) {
    debugLog('getPublisher command failed', { error: error instanceof Error ? error.message : error });
    if (error instanceof Error) {
      throw new Error(`Failed to get publisher: ${error.message}`);
    }
    throw error;
  }
}

export async function createPublisher(params: z.infer<typeof publisherPostRequestSchema>) {
  try {
    const result = await PublishersTools.create.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create publisher: ${error.message}`);
    }
    throw error;
  }
}

export async function replacePublisher(params: z.infer<typeof publisherPutRequestSchema> & { id: number }) {
  try {
    const result = await PublishersTools.replace.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to replace publisher: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePublisher(params: z.infer<typeof publisherPatchRequestSchema> & { id: number }) {
  try {
    const result = await PublishersTools.update.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update publisher: ${error.message}`);
    }
    throw error;
  }
}

export async function deletePublisher({ id }: { id: number }) {
  try {
    const result = await PublishersTools.delete.handler({ id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete publisher: ${error.message}`);
    }
    throw error;
  }
}

export async function bulkUpgradePublishers(params: z.infer<typeof bulkUpgradeRequestSchema>) {
  try {
    const result = await PublishersTools.bulkUpgrade.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to bulk upgrade publishers: ${error.message}`);
    }
    throw error;
  }
}

export async function getReleases() {
  try {
    const result = await PublishersTools.getReleases.handler();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get releases: ${error.message}`);
    }
    throw error;
  }
}

export async function getPrivateApps({ publisherId }: { publisherId: number }) {
  try {
    const result = await PublishersTools.getPrivateApps.handler({ publisherId });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get private apps: ${error.message}`);
    }
    throw error;
  }
}

export async function generatePublisherRegistrationToken({ publisherId }: { publisherId: number }) {
  try {
    const result = await PublishersTools.generatePublisherRegistrationToken.handler({ publisherId });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate registration token: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const publisherCommands = {
  listPublishers: {
    name: 'listPublishers',
    schema: PublishersTools.list.schema,
    handler: listPublishers
  },
  getPublisher: {
    name: 'getPublisher',
    schema: PublishersTools.get.schema,
    handler: getPublisher
  },
  createPublisher: {
    name: 'createPublisher',
    schema: publisherPostRequestSchema,
    handler: createPublisher
  },
  replacePublisher: {
    name: 'replacePublisher',
    schema: publisherPutRequestSchema,
    handler: replacePublisher
  },
  updatePublisher: {
    name: 'updatePublisher',
    schema: publisherPatchRequestSchema,
    handler: updatePublisher
  },
  deletePublisher: {
    name: 'deletePublisher',
    schema: PublishersTools.delete.schema,
    handler: deletePublisher
  },
  bulkUpgradePublishers: {
    name: 'bulkUpgradePublishers',
    schema: bulkUpgradeRequestSchema,
    handler: bulkUpgradePublishers
  },
  getReleases: {
    name: 'getReleases',
    schema: PublishersTools.getReleases.schema,
    handler: getReleases
  },
  getPrivateApps: {
    name: 'getPrivateApps',
    schema: PublishersTools.getPrivateApps.schema,
    handler: getPrivateApps
  },
  generatePublisherRegistrationToken: {
    name: 'generatePublisherRegistrationToken',
    schema: PublishersTools.generatePublisherRegistrationToken.schema,
    handler: generatePublisherRegistrationToken
  }
};
