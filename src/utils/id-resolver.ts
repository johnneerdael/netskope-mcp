import { McpError } from '@modelcontextprotocol/sdk/types.js';

/**
 * Error codes for resource operations
 */
const ErrorCodes = {
  NotFound: 404,
  Internal: 500
} as const;

/**
 * Type guard to check if an object has a name property
 */
function hasName(obj: any): obj is { name: string } {
  return obj && typeof obj.name === 'string';
}

/**
 * Options for resource resolution
 */
export interface ResourceResolutionOptions {
  matchField?: string;
  caseSensitive?: boolean;
  throwOnNotFound?: boolean;
}

/**
 * Resolves a resource identifier (ID or name) to a specific resource
 * @param listFn Function that returns a list of resources
 * @param identifier The ID or name to look up
 * @param options Resolution options
 * @returns The found resource or throws if not found
 */
export async function resolveResourceId<T extends Record<string, any>>(
  listFn: () => Promise<T[]>,
  identifier: string | number,
  options: ResourceResolutionOptions = {}
): Promise<T> {
  const {
    matchField = 'id',
    caseSensitive = false,
    throwOnNotFound = true
  } = options;

  try {
    const resources = await listFn();
    const identifierStr = String(identifier);
    
    // Try exact ID match first
    const idMatch = resources.find(r => String(r[matchField]) === identifierStr);
    if (idMatch) return idMatch;

    // Try name matching if the identifier is a string
    if (typeof identifier === 'string') {
      const nameMatch = resources.find(r => {
        if (!hasName(r)) return false;
        const resourceName = caseSensitive ? r.name : r.name.toLowerCase();
        const searchName = caseSensitive ? identifier : identifier.toLowerCase();
        return resourceName === searchName;
      });
      if (nameMatch) return nameMatch;

      // If no exact matches, try to find similar names for better error messages
      if (throwOnNotFound) {
        const similarNames = resources
          .filter(hasName)
          .map(r => r.name)
          .filter(name => {
            const normalizedName = caseSensitive ? name : name.toLowerCase();
            const normalizedIdentifier = caseSensitive ? identifierStr : identifierStr.toLowerCase();
            return normalizedName.includes(normalizedIdentifier) || 
                   normalizedIdentifier.includes(normalizedName);
          });

        const suggestion = similarNames.length > 0
          ? `\nDid you mean one of these?\n${similarNames.join('\n')}`
          : '';

        throw new McpError(
          ErrorCodes.NotFound,
          `Resource not found with ${typeof identifier === 'string' ? 'name' : 'id'}: ${identifier}${suggestion}`
        );
      }
    }

    if (throwOnNotFound) {
      throw new McpError(
        ErrorCodes.NotFound,
        `Resource not found with identifier: ${identifier}`
      );
    }

    return undefined as unknown as T;
  } catch (error) {
    if (error instanceof McpError) throw error;
    
    throw new McpError(
      ErrorCodes.Internal,
      `Error resolving resource: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Checks if a resource exists without returning it
 */
export async function resourceExists<T extends Record<string, any>>(
  listFn: () => Promise<T[]>,
  identifier: string | number,
  options: Omit<ResourceResolutionOptions, 'throwOnNotFound'> = {}
): Promise<boolean> {
  try {
    const resource = await resolveResourceId(listFn, identifier, {
      ...options,
      throwOnNotFound: false
    });
    return !!resource;
  } catch (error) {
    return false;
  }
}

/**
 * Validates that a resource exists, throwing if it doesn't
 */
export async function validateResourceExists<T extends Record<string, any>>(
  resourceType: string,
  listFn: () => Promise<T[]>,
  identifier: string | number,
  options: Omit<ResourceResolutionOptions, 'throwOnNotFound'> = {}
): Promise<void> {
  const exists = await resourceExists(listFn, identifier, options);
  if (!exists) {
    throw new McpError(
      ErrorCodes.NotFound,
      `${resourceType} not found with identifier: ${identifier}`
    );
  }
}
