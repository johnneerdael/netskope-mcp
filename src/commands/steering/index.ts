import { z } from 'zod';
import { SteeringTools } from '../../tools/steering.js';
import { publisherAssociationRequestSchema } from '../../types/schemas/steering.schemas.js';

// Command schemas with descriptions
const deviceDiagnosticsSchema = z.object({
  deviceId: z.string().describe('Device identifier'),
  privateAppId: z.string().describe('Private application identifier')
}).describe('Device diagnostics request parameters');

// Command implementations
export async function getUserDiagnostics() {
  try {
    const result = await SteeringTools.getUserDiagnostics.handler();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user diagnostics: ${error.message}`);
    }
    throw error;
  }
}

export async function getDeviceDiagnostics(deviceId: string, privateAppId: string) {
  try {
    const params = deviceDiagnosticsSchema.parse({
      deviceId,
      privateAppId
    });

    const result = await SteeringTools.getDeviceDiagnostics.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get device diagnostics: ${error.message}`);
    }
    throw error;
  }
}

export async function updatePublisherAssociation(params: z.infer<typeof publisherAssociationRequestSchema>) {
  try {
    const result = await SteeringTools.updatePublisherAssociation.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update publisher association: ${error.message}`);
    }
    throw error;
  }
}

export async function deletePublisherAssociation(params: z.infer<typeof publisherAssociationRequestSchema>) {
  try {
    const result = await SteeringTools.deletePublisherAssociation.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete publisher association: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const steeringCommands = {
  getUserDiagnostics: {
    name: 'getUserDiagnostics',
    schema: z.object({}).describe('Get user diagnostics information'),
    handler: getUserDiagnostics
  },
  getDeviceDiagnostics: {
    name: 'getDeviceDiagnostics',
    schema: deviceDiagnosticsSchema,
    handler: getDeviceDiagnostics
  },
  updatePublisherAssociation: {
    name: 'updatePublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: updatePublisherAssociation
  },
  deletePublisherAssociation: {
    name: 'deletePublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: deletePublisherAssociation
  }
};
