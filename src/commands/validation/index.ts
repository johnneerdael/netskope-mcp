import { z } from 'zod';
import { ValidationTools } from '../../tools/validation.js';
import { 
  resourceTypeSchema, 
  resourceValidationRequestSchema,
  tagTypeSchema,
  TagType,
  ResourceType
} from '../../types/schemas/validation.schemas.js';

// Command implementations
export async function validateName(params: {
  resourceType: ResourceType;
  name: string;
  tagType?: TagType;
}) {
  try {
    const result = await ValidationTools.validateName.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to validate name: ${error.message}`);
    }
    throw error;
  }
}

export async function validateResource(params: {
  resourceType: ResourceType;
  data: z.infer<typeof resourceValidationRequestSchema>;
}) {
  try {
    const result = await ValidationTools.validateResource.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to validate resource: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const validationCommands = {
  validateName: {
    name: 'validateName',
    schema: z.object({
      resourceType: resourceTypeSchema,
      name: z.string(),
      tagType: tagTypeSchema.optional()
    }),
    handler: validateName
  },
  validateResource: {
    name: 'validateResource',
    schema: z.object({
      resourceType: resourceTypeSchema,
      data: resourceValidationRequestSchema
    }),
    handler: validateResource
  }
};
