import { z } from 'zod';
import { SteeringTools } from '../../tools/steering.js';
import { publisherAssociationRequestSchema } from '../../types/schemas/steering.schemas.js';

// Command implementations
export async function addPublisherAssociation(params: z.infer<typeof publisherAssociationRequestSchema>) {
  try {
    const result = await SteeringTools.addPublisherAssociation.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to add publisher association: ${error.message}`);
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
  addPublisherAssociation: {
    name: 'addPublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: addPublisherAssociation
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
